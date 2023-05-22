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
                dir ('rticonnextdds-connector') {
                    sh 'pip install -r resources/scripts/requirements.txt'
                    sh "python3 resources/scripts/download_latest_libs.py --storage-url ${servers.ARTIFACTORY_URL} --storage-path ${credentials('artifactory-path')} -o ."
                }
            }
        }

        stage('Run tests') {
            steps {
                sh 'npm install'
                sh 'npm run test-junit'
            }

            post {
                always {
                    junit(
                        testResults: "test-results.xml"
                    )
                }
            }
        }

        stage('Build doc') {
            steps {
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
