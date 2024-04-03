import { Context, StructuredReturn } from 'faas-js-runtime';
import { MongoClient, Collection } from 'mongodb';
import * as dotenv from 'dotenv';

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

  const submissions = emailCollection.find({ collected: false });
  const emails: string[] = [];
  for await (const submission of submissions) {
    emails.push(submission.email);
  }

  // No emails, continue
  if (emails.length) {
    return {
      statusCode: 200
    };
  }

  return {
    body: body,
    headers: {
      'content-type': 'application/json'
    }
  };
};

export { handle };
