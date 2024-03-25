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

/** Handles adding an email to the database if it doesn't exist */
const handle = async (context: Context, body: any): Promise<StructuredReturn> => {
  // Make sure the request is of the correct type
  if (context.method != 'POST') {
    return { statusCode: 405, body: 'Invalid method' };
  }

  // Make sure the body is present
  if (body == null || body === '') {
    return { statusCode: 400, body: 'Email required' };
  }

  // Get the email from the request
  const email: string | undefined = body.email;

  if (!email) {
    return { statusCode: 400, body: 'Email required' };
  }

  const emailCollection = await getEmailCollection();

  // Check to see if the email is already in the collection
  const existing = await emailCollection.findOne({ email });
  if (!existing) {
    await emailCollection.insertOne({ email, collected: false });
  }

  return {
    body: body,
    headers: {
      'content-type': 'application/json'
    }
  };
};

export { handle };
