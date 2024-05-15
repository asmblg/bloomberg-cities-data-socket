
# Project Name

Describe your project here. Include a brief description of what the application does and what technologies it utilizes.

## Prerequisites

Before you begin, ensure you have met the following requirements:
- An AWS account
- A GitHub account
- SSH key added to your GitHub account

## Setting Up the EC2 Instance

Follow these steps to set up your Amazon EC2 instance:

1. **Launch an Instance**:
   - Navigate to the EC2 dashboard in AWS Management Console.
   - Click "Launch Instance" and select an Ubuntu Server AMI.
   - Choose an instance type (e.g., t2.micro for free tier eligible).
   - Configure instance details, add storage, and configure security groups. Ensure SSH port 22 is open to your IP.

2. **Connect to Your Instance**:
   - After the instance is launched, connect to it using SSH:
     ```bash
     ssh -i /path/to/your-key.pem ubuntu@ec2-xx-xxx-xxx-xxx.compute-1.amazonaws.com
     ```

3. **Install Necessary Software**:
   - Update your packages and install Node.js and MongoDB:
     ```bash
     sudo apt-get update
     sudo apt-get install -y nodejs npm 

     # Install Docker and run MongoDB Image
     sudo apt-get install -y docker.io
     sudo docker run --name mongodb -d -p 27017:27017 mongo:latest

     # Clone the Puppeteer GitHub repository
     git clone https://github.com/puppeteer/puppeteer.git

     # Navigate to the directory containing the Dockerfile
     cd puppeteer/docker

     # Build the Docker image
     sudo docker build -t puppeteer-chrome-linux .
    ```

## Deploying Your Node Application

1. **Clone Your Repository**:
   - Generate SSH keys and add them to your GitHub account.
   - Clone your repository:
     ```bash
     git clone git@github.com:username/repository.git
     ```

2. **Install Dependencies**:
   - Navigate to the project directory and install dependencies:
     ```bash
     cd repository
     npm install
     ```

3. **Start Your Application**:
   - Use PM2 to manage your application process:
     ```bash
     sudo npm install pm2@latest -g
     pm2 start app.js
     pm2 startup
     ```

## Automating Updates with Cron

## Automating Updates and Script Execution with Cron

To automate your application updates and script execution, including starting MongoDB and preparing Puppeteer, create a shell script and a cron job:

1. **Create a Shell Script**:
   - Create a script `start_app.sh` to start MongoDB, set up Puppeteer, and run your Node.js application:
     ```bash
      #!/bin/bash

      # Container names
      MONGO_CONTAINER_NAME="mongodb"
      PUPPETEER_CONTAINER_NAME="puppeteer-chrome"

      # Path to your Node.js script that uses Puppeteer and MongoDB
      NODE_SCRIPT_PATH="/path/to/your/app.js"

      # Volume mapping for Node scripts and MongoDB data (if needed)
      NODE_VOLUME_MAPPING="/path/to/your/scripts:/app"
      MONGO_VOLUME_MAPPING="/path/to/your/mongo/data:/data/db"

      # Start the MongoDB container
      echo "Starting MongoDB container..."
      sudo docker run -d --rm --name $MONGO_CONTAINER_NAME -v $MONGO_VOLUME_MAPPING mongo:latest

      # Check if MongoDB started successfully
      if [ $? -eq 0 ]; then
          echo "MongoDB container started successfully."

          # Start the Puppeteer Docker container in detached mode
          echo "Starting the Puppeteer Docker container..."
          sudo docker run -d --rm --name $PUPPETEER_CONTAINER_NAME -v $NODE_VOLUME_MAPPING puppeteer-chrome-linux

          # Check if Puppeteer started successfully
          if [ $? -eq 0 ]; then
              echo "Puppeteer container started successfully."

              # Run your Node.js application that uses Puppeteer and MongoDB
              echo "Running Node.js application..."
              sudo docker exec $PUPPETEER_CONTAINER_NAME node /app/your_script.js

              # Stop the Puppeteer Docker container after the Node script finishes
              echo "Stopping Puppeteer Docker container..."
              sudo docker stop $PUPPETEER_CONTAINER_NAME
              echo "Puppeteer Docker container stopped."
          else
              echo "Failed to start Puppeteer Docker container."
          fi

          # Stop the MongoDB container after the Node script finishes
          echo "Stopping MongoDB container..."
          sudo docker stop $MONGO_CONTAINER_NAME
          echo "MongoDB container stopped."
      else
          echo "Failed to start MongoDB container."
      fi
     ```

   - Make the script executable:
     ```bash
     chmod +x /path/to/your/start_app.sh
     ```

2. **Set Up a Cron Job**:
   - Open the crontab for editing:
     ```bash
     crontab -e
     ```

   - Add a line to run your script periodically (e.g., daily at midnight):
     ```cron
     0 0 * * * /path/to/your/start_app.sh > /dev/null 2>&1
     ```


## Automating Updates with Cron

Set up a cron job to regularly update your application from GitHub:

```bash
crontab -e
```

Add the following line to pull changes daily at midnight:

```cron
0 0 * * * cd /path/to/your/repository && git pull > /dev/null 2>&1
```

## Monitoring and Logs

- **Monitoring**: Use AWS CloudWatch to monitor the instance and set alarms.
- **Logging**: Configure your application to log important events. These logs can be forwarded to CloudWatch Logs.

## Backup and Security

- Ensure regular backups of your MongoDB database.
- Regularly update your instance and review security settings.

## Troubleshooting

- If you encounter issues with MongoDB, ensure the MongoDB service is running:
  ```bash
  sudo systemctl status mongod
  ```

- For application errors, check the Node.js logs and PM2 status:
  ```bash
  pm2 list
  pm2 logs
  ```

## Contributors

List the people who have contributed to this project.

## License

This project uses the following license: [license_name](link_to_license).
