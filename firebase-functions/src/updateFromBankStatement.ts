import * as functions from "firebase-functions";
import { downloadFioStatement } from "../../src/lib/bank-parsers/bank-connector";
import { BankWorkflow } from "../../src/lib/services/workflows/bank-workflow";

export const updateFromBankStatement = functions.https.onRequest(async(request, response) => {
    functions.logger.info("Hello logs!", { structuredData: true });
    response.send("Hello from Firebase!");
  });

export const processBankStatement = functions.https.onRequest(async(request, response) => {
    functions.logger.info("Processing bank statement!", { structuredData: true });

    // load bank statement using fio connector
    const bankStatement = await downloadFioStatement();
    if (!bankStatement.success) {
        response.send(`Error downloading bank statement: ${bankStatement.message}`);
        return;
    }

    response.send(`Bank statement loaded: ${bankStatement.data}`);
    return

    // update bank statement using bank workflow
    const bankWorkflow = new BankWorkflow();

    let result = false

    // if empty bankStatement.data, return false
    if (!bankStatement.data) {
        response.send(`Empty bank statement data`);
        return;
    }

    try {
        result = await bankWorkflow.loadPaymentsFromBankStatementAndUpdateCreditAllocation(bankStatement.data || "");
    } catch (error) {
        response.send(`Error processing bank statement: ${error}`);
    }

    if(result) {
        response.send(`Processed bank statement: ${result}`);
    } else {
        response.send(`False result of processing bank statement: ${result}`);
    }
  });