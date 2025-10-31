pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        IMAGE_NAME = 'shweta0/subtitle-generator'
    }

    stages {
        stage('Checkout') {
            steps {
                echo '📥 Cloning GitHub repository...'
                git branch: 'main', url: 'https://github.com/shw-eta11/subtitle-generator.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📦 Installing Node.js dependencies...'
                sh 'npm install'
            }
        }

        stage('Build Next.js App') {
            steps {
                echo '🏗️ Building Next.js application...'
                sh 'npm run build'
            }
        }

        stage('Docker Build') {
            steps {
                echo '🐳 Building Docker image...'
                sh 'docker build -t ${IMAGE_NAME}:latest .'
            }
        }

        stage('Docker Login & Push') {
            steps {
                echo '🔐 Logging in and pushing image to Docker Hub...'
                sh '''
                    echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin
                    docker push ${IMAGE_NAME}:latest
                '''
            }
        }

        stage('Deploy Locally') {
            steps {
                echo '🚀 Deploying container on the same EC2 (Jenkins host)...'
                sh '''
                    docker stop subtitle-generator || true
                    docker rm subtitle-generator || true
                    docker pull ${IMAGE_NAME}:latest
                    docker run -d --name subtitle-generator -p 3000:3000 ${IMAGE_NAME}:latest
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Build, Push, and Deploy completed successfully!'
        }
        failure {
            echo '❌ Build or Deploy failed. Check Jenkins logs for details.'
        }
    }
}
