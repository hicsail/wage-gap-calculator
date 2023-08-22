#./Dockerfile
FROM node:20

WORKDIR /app

# Install cron
RUN apt-get update && apt-get install -y cron

# Copy your application and install dependencies
COPY ./package*.json ./
RUN npm install
COPY . .

# Setup the cron job
RUN echo "0 0 * * * /home/centos/calculator-mailer.sh >> /home/centos/calculator-mailer-logs 2>&1" | crontab -

EXPOSE 8080

# Use a startup script to run both cron and your application
COPY ./startup.sh /startup.sh
RUN chmod +x /startup.sh
CMD ["/startup.sh"]