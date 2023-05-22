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
        dockerfile {
            label 'docker'
            customWorkspace "/rti/jenkins/workspace/${UUID.randomUUID().toString().split('-')[-1]}"
        }
    }

    stages {
        stage('Download libs') {
            steps {
                publishInProgressCheck(
                    title: 'Downloading',
                    summary: ':arrow_down: Downloading RTI Connext DDS libraries...',
                )

                dir ('rticonnextdds-connector') {
                    sh 'pip install -r resources/scripts/requirements.txt'
                    withCredentials([string(credentialsId: 'artifactory-path', variable: 'ARTIFACTORY_PATH')]) {
                        sh "python3 resources/scripts/download_latest_libs.py --storage-url ${servers.ARTIFACTORY_URL} --storage-path \$ARTIFACTORY_PATH -o ."
                    }
                }
            }

            post {
                success {
                    publishPassedCheck(
                        summary: ':white_check_mark: RTI Connext DDS libraries downloaded.',
                    )
                }
                failure {
                    publishFailedCheck(
                        summary: ':warning: Failed downloading RTI Connext DDS libraries.',
                    )
                }
                aborted {
                    publishAbortedCheck(
                        summary: ':no_entry: The download of RTI Connext DDS libraries was aborted.',
                    )
                }
            }
        }

        stage('Run tests') {
            steps {
                publishInProgressCheck(
                    title: 'Running tests...',
                    summary: ':test_tube: Testing Connector JS...',
                )

                sh 'npm install'
                sh 'npm run test-junit'
            }

            post {
                always {
                    junit(
                        testResults: "test-results.xml"
                    )
                }
                success {
                    publishPassedCheck(
                        summary: ':white_check_mark: Connector JS successfully tested.',
                    )
                }
                failure {
                    publishFailedCheck(
                        summary: ':warning: At least one test failed.',
                    )
                }
                aborted {
                    publishAbortedCheck(
                        summary: ':no_entry: The tests were aborted.',
                    )
                }
            }
        }

        stage('Build doc') {
            steps {
                publishInProgressCheck(
                    title: 'Building documentation...',
                    summary: ':book: Building Connector JS Documentation...',
                )

                dir('docs') {
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

                    publishPassedCheck(
                        summary: ':white_check_mark: Connector JS documentation generated sucessfully.',
                    )
                }
                failure {
                    publishFailedCheck(
                        summary: ':warning: Failed to build documentation.',
                    )
                }
                aborted {
                    publishAbortedCheck(
                        summary: ':no_entry: The documentation generation was aborted.',
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
