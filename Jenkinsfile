pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        IMAGE_NAME = "subtitle-generator"
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

        stage("Image Push"){
            steps{
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'docker_user', passwordVariable: 'docker_pass')]) {
                   sh "docker tag  ${IMAGE_NAME}:latest ${env.docker_user}/${IMAGE_NAME}:${BUILD_NUMBER}"
                   sh "docker login -u ${env.docker_user} -p ${env.docker_pass}"
                   sh "docker push ${env.docker_user}/${IMAGE_NAME}:${BUILD_NUMBER}"  
                }
            }
        }

        stage('Deploy Locally') {
            steps {
                echo '🚀 Deploying container on Jenkins EC2...'
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'docker_user', passwordVariable: 'docker_pass')]) {
                    sh "docker login -u ${env.docker_user} -p ${env.docker_pass} "
                    sh "docker pull ${env.docker_user}/${IMAGE_NAME}:${BUILD_NUMBER} "
                    sh "docker run -d --name subtitle-generator -p 3000:3000 ${env.docker_user}/${IMAGE_NAME}:${BUILD_NUMBER} "
                }
            }
        }
    }

}