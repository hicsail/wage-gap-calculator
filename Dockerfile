FROM node:alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY client ./client
COPY server ./server

RUN echo "55 13 * * * node /app/server/mailer.js" > /var/spool/cron/crontabs/root

EXPOSE 8080

CMD ["sh", "-c", "crond && node server/server.js"]
