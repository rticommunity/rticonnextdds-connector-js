/*
 * (c) Copyright, Real-Time Innovations, 2024.  All rights reserved.
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
        }
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
        stage('Build doc') {
            agent {
                dockerfile {
                    additionalBuildArgs  '--build-arg NODE_VERSION=18'
                    dir 'resources/docker'
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
