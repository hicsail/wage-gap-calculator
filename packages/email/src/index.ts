import { Context, StructuredReturn } from 'faas-js-runtime';
import { MongoClient, Collection } from 'mongodb';
import * as dotenv from 'dotenv';
import { createTransport, SendMailOptions } from 'nodemailer';
import * as excel from 'exceljs';

// Configure environment variables
dotenv.config();

/** Get the email collection from the DB */
const getEmailCollection = async (): Promise<Collection> => {
  const mongoURI: string | undefined = process.env.MONGO_URI;
  if (!mongoURI) {
    throw new Error(`MONGO_URI not defined`);
  }
  const dbName: string | undefined = process.env.MONGO_DB;
  if (!dbName) {
    throw new Error(`MONGO_DB not defined`);
  }
  const collectionName: string | undefined = process.env.MONGO_COLLECTION;
  if (!collectionName) {
    throw new Error(`MONGO_COLLECTION not defined`);
  }

  const client = new MongoClient(mongoURI);
  await client.connect();
  const database = client.db(dbName);
  return database.collection(collectionName);
};

/**
 * Send out an email containing the submissions
 */
const handle = async (_context: Context, body: string): Promise<StructuredReturn> => {
  const emailCollection = await getEmailCollection();

  // Read in the submissions
  const submissions = emailCollection.find({ collected: false });
  const emails: { [key: string]: string }[] = [];
  for await (const submission of submissions) {
    emails.push({ 'email': submission.email });
  }

  // No emails, continue
  if (emails.length == 0) {
    return {
      statusCode: 200
    };
  }

  // Create the Excel file to store the emails
  const workbook = new excel.Workbook();
  const sheet = workbook.addWorksheet('Emails');
  sheet.columns = [
    { header: 'BWWC Wage Gap Calculator Submitters', key: 'email'}
  ];


  // Add the emails to the sheet
  emails.forEach(element => {
    sheet.addRow(element);
  });

  // Get the workbook buffer for emailing
  const buffer = await workbook.xlsx.writeBuffer();

  const transporter = createTransport({
    host: 'smtp.mailgun.org/',
    service: 'MailGun',
    port: 465,
    secure: false,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD
    },
		logger: true
  });

  const mailConfigurations: SendMailOptions = {
    from: process.env.SMTP_SENDER,
    to: process.env.RECEIVER,
    subject: 'BWWC Wage Gap Calculator Submitters',
    text:'Please find attached an excel file of people who have submitted to the wage gap calculator.',
    attachments: [
      {
        filename: 'BWWC_Wage_Gap_Calculator_Emails.xlsx',
        content: Buffer.from(buffer),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ]
  };

  await transporter.sendMail(mailConfigurations);

  await emailCollection.updateMany({ collected: false }, { $set: { collected: true }});

  return {
    body: body,
    headers: {
      'content-type': 'application/json'
    }
  };
};

export { handle };
