pipeline {
    agent any

    environment {
        NODE_ENV = 'development'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Lint (optional)') {
            steps {
                // Run lint if your project has it
                sh 'npm run lint || true'
            }
        }

        stage('Test') {
            steps {
                // Skip if you don't have tests
                sh 'npm test || true'
            }
        }

        stage('Run') {
            steps {
                // Run the app (use "npm start" if you have it configured)
                sh 'node index.js &'
                sh 'sleep 10' // Wait for app to start (optional)
            }
        }
    }

    post {
        always {
            echo 'Cleaning up...'
        }
    }
}
