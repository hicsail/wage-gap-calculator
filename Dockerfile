FROM node:26-alpine3.24

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY client ./client
COPY server ./server

RUN echo "0 0 * * * node /app/server/mailer.js >> /proc/1/fd/1 2>&1" > /var/spool/cron/crontabs/root

EXPOSE 8080

CMD ["sh", "-c", "printenv > /etc/environment && crond && node server/server.js"]
