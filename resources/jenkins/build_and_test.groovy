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

def getBuildAndTestStages(String nodeVersion) {
    return {
        dir("${env.WORKSPACE}/${nodeVersion}") {
            stage('Checkout repo') {
                echo "[INFO] Building from ${pwd()}..."
                checkout scm
            }

            stage('Downloading dependencies') {
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

            stage('Run tests') {
                try {
                    sh 'npm run test-junit'
                } finally {
                    junit(testResults: 'test-results.xml')
                }
            }
        }
    }
}

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
        skipDefaultCheckout()
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
                    buildStages = getBuildAndTestStages("20")
                    buildStages.call()
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
