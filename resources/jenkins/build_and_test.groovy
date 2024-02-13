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

NODE_VERSIONS = ['17', '18', '20', 'lts']

def getBuildAndTestStages(String nodeVersion) {
    def dockerImage = docker.build(
        "node-v${nodeVersion}",
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
                        dir ('rticonnextdds-connector') {
                            sh 'pip install -r resources/scripts/requirements.txt'

                            withAWS(credentials:'community-aws', region: 'us-east-1') {
                                withCredentials([
                                    string(credentialsId: 's3-bucket', variable: 'S3_BUCKET'),
                                    string(credentialsId: 's3-path', variable: 'S3_PATH'),
                                ]) {
                                    catchError(
                                        message: 'Library download failed',
                                        buildResult: 'UNSTABLE',
                                        stageResult: 'UNSTABLE'
                                    ) {
                                        sh "python resources/scripts/download_libs.py --storage-url \$S3_BUCKET --storage-path \$S3_PATH -o ."
                                    }
                                }
                            }

                            sh 'npm install'
                        }
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

pipeline {
    agent {
        node {
            label 'docker'
        }
    }

    triggers {
        // Build at least once a day to test newly created libs.
        cron('H H(18-21) * * *')
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
        stage('Build & Test') {
            failFast false

            steps {
                script {
                    buildAndTestStages = [:]

                    NODE_VERSIONS.each { version ->
                        buildAndTestStages["Node ${version}"] = getBuildAndTestStages(version)
                    }

                    if (env.BRANCH_NAME == "develop") {
                        buildAndTestStages["Node latest"] = getBuildAndTestStages("latest")
                    }

                    parallel buildAndTestStages
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
