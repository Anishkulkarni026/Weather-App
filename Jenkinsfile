pipeline {
    agent any

    environment {
        NODE_ENV = 'development'
        DOCKER_IMAGE = "your-dockerhub-username/weather-app"
        DOCKER_TAG = "latest"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}")
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    script {
                        docker.withRegistry('https://registry.hub.docker.com', 'dockerhub-creds') {
                            docker.image("${DOCKER_IMAGE}:${DOCKER_TAG}").push()
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Done building and pushing Docker image.'
        }
    }
}
