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

pipeline {
    agent {
        node {
            label 'docker'
            customWorkspace "/rti/jenkins/workspace/${env.JOB_NAME}"
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
            matrix {
                agent {
                   node {
                        customWorkspace "/rti/jenkins/workspace/${env.JOB_NAME}/${NODE_VERSION}"
                        label 'docker'
                    }
                }
                axes {
                    axis {
                        name 'NODE_VERSION'
                        values '17', '18', '20', 'lts', 'latest'
                    }
                }

                stages {
                    stage('Checkout repo') {
                        steps {
                            echo "[INFO] Building from ${pwd()}..."

                            checkout scm
                        }
                    }

                    stage('Downloading dependencies') {
                        agent {
                            dockerfile {
                                additionalBuildArgs  "--build-arg NODE_VERSION=${NODE_VERSION}"
                                reuseNode true
                            }
                        }

                        steps {
                            dir ('rticonnextdds-connector') {
                                sh 'pip install -r resources/scripts/requirements.txt'

                                withCredentials([string(credentialsId: 'artifactory-path', variable: 'ARTIFACTORY_PATH')]) {
                                    catchError(
                                        message: 'Library download failed',
                                        buildResult: 'UNSTABLE',
                                        stageResult: 'UNSTABLE'
                                    ) {
                                        sh "python resources/scripts/download_latest_libs.py --storage-url ${servers.ARTIFACTORY_URL} --storage-path \$ARTIFACTORY_PATH -o ."
                                    }
                                }
                            }

                            sh 'npm install'
                        }
                    }

                    stage('Run tests') {
                        agent {
                            dockerfile {
                                args '--network none'
                                additionalBuildArgs  "--build-arg NODE_VERSION=${NODE_VERSION}"
                                reuseNode true
                            }
                        }

                        steps {
                            sh 'npm run test-junit'
                        }

                        post {
                            always {
                                junit(testResults: 'test-results.xml')
                            }
                        }
                    }
                }
            }
        }

        stage('Build doc') {
            agent {
                dockerfile {
                    additionalBuildArgs  '--build-arg NODE_VERSION=18'
                    reuseNode true
                }
            }

            steps {
                dir('docs') {
                    sh 'npm config set prefix \'/opt/node_deps\''
                    sh 'npm install -g jsdoc'
                    sh 'pip install -r requirements.txt --no-cache-dir'
                    sh 'make html'
                }
            }

            post {
                success {
                    publishHTML(
                        [
                            allowMissing: false,
                            alwaysLinkToLastBuild: false,
                            keepAll: false,
                            reportDir: 'docs/_build/html/',
                            reportFiles: 'index.html',
                            reportName: 'Connector Documentation',
                            reportTitles: 'Connector Documentation'
                        ]
                    )
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
