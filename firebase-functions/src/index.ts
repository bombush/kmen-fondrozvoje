/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */



// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

import * as functions from "firebase-functions";

import  { BankStatement } from "../../src/types";

export const helloWorld = functions.https.onRequest((request, response) => {
    functions.logger.info("Hello logs!", { structuredData: true });
    response.send("Hello from Firebase!");
  });

  export const processBankStatement = functions.https.onRequest((request, response) => {
    functions.logger.info("Processing bank statement!", { structuredData: true });

    const bankStatement: BankStatement = {
      id: 'test-statement-id',
      adapter: "fio",
      month: "2023-01",
      status: "pending",
      rawData: "[]",
      processedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timestamp: new Date().getTime() / 1000
    };

    response.send(`Processing bank statement: ${bankStatement.id} Created at: ${bankStatement.timestamp}`);
  });
  
  
