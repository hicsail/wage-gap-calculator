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
 * Your HTTP handling function, invoked with each request. This is an example
 * function that logs the incoming request and echoes its input to the caller.
 *
 * It can be invoked with `func invoke`
 * It can be tested with `npm test`
 *
 * It can be invoked with `func invoke`
 * It can be tested with `npm test`
 *
 * @param {Context} context a context object.
 * @param {object} context.body the request body if any
 * @param {object} context.query the query string deserialized as an object, if any
 * @param {object} context.log logging object with methods for 'info', 'warn', 'error', etc.
 * @param {object} context.headers the HTTP request headers
 * @param {string} context.method the HTTP request method
 * @param {string} context.httpVersion the HTTP protocol version
 * See: https://github.com/knative/func/blob/main/docs/guides/nodejs.md#the-context-object
 */
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
