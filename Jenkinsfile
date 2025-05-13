pipeline {
    agent any

    environment {
        // Define environment variables
        APP_NAME = 'charleswooden-server'
        REMOTE_DIR = "/var/www/${APP_NAME}"
        DEPLOY_SERVER = 'deploy-server' // Matches Jenkins SSH Publisher config name
        NODE_VERSION = 'NodeJS-18' // Node.js version configured in Jenkins > Tools
    }

    triggers {
        githubPush()
    }

    stages {
        // STAGE 1: Checkout Code
        stage('Checkout') {
            steps {
                git branch: 'main', // Replace with your branch
                     url: 'https://github.com/euhansarkar/charleswooden-server',
                     credentialsId: 'charleswooden-server-secret' // GitHub PAT credentials ID
            }
        }

        // STAGE 2: Build (Node.js + Prisma)
        stage('Build') {
            steps {
                nodejs("${NODE_VERSION}") {
                    sh 'npm install'
                    sh 'npx prisma generate' // Generate Prisma client
                    sh 'npm run build' // Run build script (e.g., TypeScript compilation)
                }
            }
        }

        // STAGE 3: Test (Optional but recommended)
        stage('Test') {
            steps {
                nodejs("${NODE_VERSION}") {
                    sh 'npm test' // Ensure your package.json has a "test" script
                }
            }
        }

        // STAGE 4: Deploy to Server
        stage('Deploy') {
            steps {
                script {
                    try {
                        // Step 1: Transfer files via SSH Publisher
                        sshPublisher(
                            publishers: [
                                sshPublisherDesc(
                                    configName: "${DEPLOY_SERVER}", // Jenkins SSH server config
                                    transfers: [
                                        transferSet(
                                            sourceFiles: '**/*',
                                            removePrefix: '.',
                                            remoteDirectory: "${REMOTE_DIR}"
                                        )
                                    ],
                                    verbose: true
                                )
                            ]
                        )

                        // Step 2: Run deployment commands on the server
                        sshCommand(
                            hostname: "${DEPLOY_SERVER}",
                            username: 'user', // SSH username
                            command: """
                                # Set up environment
                                export PATH="/usr/local/bin:\$PATH"
                                cd ${REMOTE_DIR} || { echo "Directory ${REMOTE_DIR} not found"; exit 1; }

                                # Install production dependencies
                                npm install --production

                                # Regenerate Prisma client (in case of schema changes)
                                npx prisma generate

                                # Restart PM2 process
                                pm2 restart ecosystem.config.js || { echo "PM2 restart failed"; exit 1; }

                                # Reload Nginx
                                sudo systemctl reload nginx || { echo "Nginx reload failed"; exit 1; }

                                echo "✅ Deployment successful"
                            """
                        )
                    } catch (Exception e) {
                        currentBuild.result = 'FAILURE'
                        throw e
                    }
                }
            }
        }
    }

    // Optional: Notifications on failure
    post {
        failure {
            echo '🚨 Deployment failed! Check Jenkins logs for details.'
        // Add Slack/email notifications here if needed
        }
    }
}
