/*
 * (c) Copyright, Real-Time Innovations, 2023.  All rights reserved.
 * RTI grants Licensee a license to use, modify, compile, and create derivative
 * works of the software solely for use with RTI Connext DDS. Licensee may
 * redistribute copies of the software provided that all such copies are subject
 * to this license. The software is provided "as is", with no warranty of any
 * type, including any warranty for fitness for any purpose. RTI is under no
 * obligation to maintain or support the software. RTI shall not be liable for
 * any incidental or consequential damages arising out of the use or inability
 * to use the software.
 */

@Library("rticommunity-jenkins-pipelines@feature/COMMUNITY-95") _

CI_CONFIG = [:]

/*
 * This function generates the stages to Build & Test connector using a specific Node-JS version.
 *
 * @param nodeVersion Version of Node-JS used to generate the build & test stage.
 * @return The generated Build & Test stages
 */
def getBuildAndTestStages(String nodeVersion) {
    def dockerImage = docker.build(
        UUID.randomUUID().toString().split('-')[-1],
        "--pull -f resources/docker/Dockerfile --build-arg NODE_VERSION=${nodeVersion} ."
    )

    return {
        stage("Node ${nodeVersion}") {
            dir("${env.WORKSPACE}/${nodeVersion}") {
                stage("Checkout repo") {
                    echo "[INFO] Building from ${pwd()}..."
                    checkout scm
                }

                stage("Downloading dependencies") {
                    dockerImage.inside() {
                        downloadAndExtract(
                            installDirectory: 'rticonnextdds-connector/',
                            flavour: 'connectorlibs'
                        )

                        sh 'npm install'
                    }
                }

                stage("Run tests") {
                    dockerImage.inside('--network none') {
                        try {
                            sh 'npm run test-junit'
                        } finally {
                            junit(testResults: 'test-results.xml')
                        }
                    }
                }
            }
        }
    }
}

/*
 * Get the Node-JS version from the job name if it is defined there. Example of job name:
 * ci/connector-js/rticonnextdds-connector-js_node-20_latest.
 *
 * @return The list of node versions defined in the Job Name. An empty list if it is not defined in the job name.
 */
def getNodeVersionsFromJobName() {
    def matcher = env.JOB_NAME =~ /.*_node-(.*)\/.*/

    return matcher ? matcher.group(1).split('_') : []
}

pipeline {
    agent {
        node {
            label 'docker'
        }
    }

    triggers {
        // If it is develop, build at least once a day to test newly created libs.
        // If it is another branch, never build based on timer (31 February = Never).
        cron(env.BRANCH_NAME == 'develop' ? 'H H(18-21) * * *' : '* * 31 2 *')
    }

    options {
        disableConcurrentBuilds()
        /*
            To avoid excessive resource usage in server, we limit the number
            of builds to keep in pull requests
        */
        buildDiscarder(
            logRotator(
                artifactDaysToKeepStr: '',
                artifactNumToKeepStr: '',
                daysToKeepStr: '',
                /*
                   For pull requests only keep the last 10 builds, for regular
                   branches keep up to 20 builds.
                */
                numToKeepStr: changeRequest() ? '10' : '20'
            )
        )
        // Set a timeout for the entire pipeline
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {
        stage('Read CI Config') {
            steps {
                script {
                    CI_CONFIG = readYaml(file: "ci_config.yaml")

                    downloadAndExtract(
                        installDirectory: 'rticonnextdds-connector/',
                        flavour: 'connectorlibs'
                    )
                }
            }
        }

        stage('Build & Test') {
            failFast false

            steps {
                script {
                    def nodeVersions = getNodeVersionsFromJobName()

                    // If the node versions was not predefined in the job name, read them from the config file.
                    if(!nodeVersions) {
                        nodeVersions = CI_CONFIG["node_versions"]
                    }

                    def buildAndTestStages = [:]

                    // Generate the Build & Test stages for every selected node version.
                    nodeVersions.each { version ->
                        buildAndTestStages["Node ${version}"] = getBuildAndTestStages(version)
                    }

                    parallel buildAndTestStages
                }
            }
        }

        stage('Publish') {
            agent {
                dockerfile {
                    additionalBuildArgs  "--build-arg NODE_VERSION=${CI_CONFIG['publish_version']}"
                    dir 'resources/docker'
                    reuseNode true
                    label 'docker'
                }
            }

            when {
                beforeAgent true
                tag pattern: /v\d+\.\d+\.\d+-dev/, comparator: "REGEXP"
            }

            steps {
                script {
                    def publishDir = "${env.WORKSPACE}/${CI_CONFIG['publish_version']}"

                    if(!fileExists(publishDir)) {
                        error(
                            "The node version ${CI_CONFIG['publish_version']} was not used to test connector. Please update the \"publish_version\" field in ci_config.yaml"
                        )
                    }

                    withCredentials([
                        string(credentialsId: 'npm-registry', variable: 'NPM_REGISTRY'),
                        string(credentialsId: 'npm-token', variable: 'NPM_TOKEN')
                    ]) {
                        dir(publishDir) {
                            sh 'echo "//\$NPM_REGISTRY:_authToken=${NPM_TOKEN}" > .npmrc'
                            sh './resources/scripts/publish.sh'
                        }
                    }
                }
            }
        }
    }

    post {
        cleanup {
            cleanWs()
        }
    }
}
