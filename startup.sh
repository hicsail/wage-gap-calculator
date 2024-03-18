#!/bin/bash

# Start the cron service
service cron start

# Start application
node ./server/server.js