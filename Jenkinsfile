stage('Deploy') {
    steps {
        sshPublisher(
            publishers: [
                sshPublisherDesc(
                    configName: 'deploy-server',
                    transfers: [
                        transferSet(
                            sourceFiles: "**/*",
                            removePrefix: ".",
                            remoteDirectory: "/var/www/charleswooden-server"
                        )
                    ],
                    verbose: true
                )
            ]
        )
        sshCommand(
            hostname: "deploy-server",
            username: "user",
            command: """
                cd /var/www/my-nodejs-app
                npm install --production
                pm2 restart app.js || pm2 start app.js
            """
        )
    }
}