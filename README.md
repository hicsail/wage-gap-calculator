# BWWC Wage Gap Calculator

The wage-gap-calculator is a tool to help companies assess their individual organization's gender, racial, and combined wage gaps. See [here](https://thebwwc.org/pay-equity) for more info.

# Getting Started
## Requirements
- Node.js
- MongoDB

## Local Installation
1. Open a terminal and clone this repo to your machine: `git clone https://github.com/hicsail/wage-gap-calculator.git`
2. Create a `.env` file in the top level directory of the project of the following form:
```
MONGODB_URI={URI of your local mongodb including the database name e.g. mongodb://localhost:{port}/{db_name}}
SMTP_USERNAME={email address of sender of reports if you intend to use the mailer}
SMTP_PASSWORD={password of sender's email address}
RECEIVER={email address of receiver of reports}
NODE_ENV=local
```
3. In your terminal, navigate to the top level directory of this project and run `npm install` to install all dependencies.
4. Run `npm start` to start the server and navigate to localhost:8080 in your browser to see the calculator. (NOTE: you may also run `npm run dev` if you would like to run with nodemon instead)

## Database
This project creates a MongoDB database with one collection whose purpose is to collect email addresses of those who use the calculator. Included in the server files is a script that will read all the uncollected emails from this database and send them to the email address specified in your `.env` file.
