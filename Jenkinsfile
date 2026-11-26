// PART 08 - Declarative Jenkins Pipeline for the Adactin Playwright framework.
// Prerequisites in Jenkins: Pipeline, Git, GitHub Integration, HTML Publisher
// and Allure Jenkins plugins; docker.exe on Jenkins' global PATH (see JENKINS_SETUP.md).

pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    // Trigger on a GitHub push (webhook -> ngrok -> /github-webhook/) and nightly.
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
                // --load keeps the image in the local daemon when Docker uses
                // the BuildKit/docker-container builder.
                bat 'docker build --load -t %IMAGE_NAME% .'
            }
        }

        stage('Run UI + API tests in container') {
            steps {
                script {
                    // returnStatus keeps the pipeline alive so reports can still be
                    // exported and published when tests fail.
                    def testExitCode = bat(
                        script: 'docker run --name %CONTAINER_NAME% %IMAGE_NAME%',
                        returnStatus: true
                    )
                    echo "Playwright container exit code: ${testExitCode}"

                    // Copy HTML report, Allure results and screenshots/videos/logs
                    // out of the stopped container into the Jenkins workspace.
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
                // Screenshots, videos, traces, Allure attachments, logs.
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
            // Remove the container even when tests fail or the build is aborted.
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
