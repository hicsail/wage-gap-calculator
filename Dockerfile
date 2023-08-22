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
RUN echo "0 0 * * * /path/to/your/script.sh >> /path/to/logfile 2>&1" | crontab -

EXPOSE 8080

# Use a startup script to run both cron and your application
COPY ./start.sh /start.sh
RUN chmod +x /start.sh
CMD ["/start.sh"]