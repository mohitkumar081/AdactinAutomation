pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    triggers {
        githubPush()
        cron('H 3 * * *')
    }

    environment {
        IMAGE_NAME     = "playwright-tests:jenkins-${env.BUILD_NUMBER}"
        CONTAINER_NAME = "playwright-tests-jenkins-${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker image') {
            steps {
                echo "Building ${env.IMAGE_NAME}"
                script {
                    def loadExitCode = bat(
                        script: 'docker build --load -t %IMAGE_NAME% .',
                        returnStatus: true
                    )
                    if (loadExitCode != 0) {
                        echo '--load unsupported by this Docker CLI; retrying with legacy builder'
                        bat 'docker build -t %IMAGE_NAME% .'
                    }
                }
            }
        }

        stage('Run UI + API tests in container') {
            steps {
                script {
                    def testExitCode = bat(
                        script: 'docker run --name %CONTAINER_NAME% %IMAGE_NAME%',
                        returnStatus: true
                    )
                    echo "Playwright container exit code: ${testExitCode}"

                    bat '''
                        if exist playwright-report rmdir /s /q playwright-report
                        if exist allure-results rmdir /s /q allure-results
                        if exist test-results rmdir /s /q test-results
                        docker cp %CONTAINER_NAME%:/app/playwright-report ./playwright-report
                        docker cp %CONTAINER_NAME%:/app/allure-results ./allure-results
                        docker cp %CONTAINER_NAME%:/app/test-results ./test-results
                        exit /b 0
                    '''

                    if (testExitCode != 0) {
                        error("Playwright UI + API tests failed (exit ${testExitCode})")
                    }
                }
            }
        }

        stage('Publish reports and archive evidence') {
            steps {
                archiveArtifacts(
                    artifacts: 'playwright-report/**/*, allure-results/**/*, test-results/**/*',
                    allowEmptyArchive: true
                )

                publishHTML(target: [
                    allowMissing: true,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'playwright-report',
                    reportFiles: 'index.html',
                    reportName: 'Playwright HTML Report'
                ])

                allure results: [[path: 'allure-results']]
            }
        }
    }

    post {
        always {
            bat 'docker rm -f %CONTAINER_NAME% >nul 2>&1 || exit /b 0'
        }
        success {
            echo 'PLAYWRIGHT TESTS PASSED - reports published and artifacts archived.'
        }
        failure {
            echo 'PLAYWRIGHT TESTS FAILED - see archived Allure/HTML reports and screenshots.'
        }
    }
}
