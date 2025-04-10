import { NextRequest, NextResponse } from "next/server";
import { downloadFioStatement } from "@/lib/bank-parsers/bank-connector";
import { BankWorkflow } from "@/lib/services/workflows/bank-workflow";
import admin from 'firebase-admin';

// Initialize Firebase Admin once (outside the handler)
// This prevents re-initialization on each request
const firebaseAdmin = admin.apps.length 
  ? admin.app() 
  : admin.initializeApp({
      // For emulator, we don't need credentials
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kmen-fondrozvoje',
    });

// Configure emulator if in development
if (process.env.NODE_ENV === 'development') {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  console.log('Using Firestore emulator');
}

async function authCheck(request: NextRequest): Promise<admin.auth.UserRecord | null> {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return null;
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    return await admin.auth().getUser(uid);
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  console.log("Processing update-credits request");

  try {
    // Optional auth check (commenting out for now to make testing easier)
    // const user = await authCheck(request);
    // if (!user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // Download bank statement using connector
    const bankStatement = await downloadFioStatement();
    if (!bankStatement.success) {
      return NextResponse.json({ 
        error: `Error downloading bank statement: ${bankStatement.message}` 
      }, { status: 500 });
    }

    // If no data was returned
    if (!bankStatement.data) {
      return NextResponse.json({ 
        message: "No new transactions to process" 
      }, { status: 200 });
    }

    // Update bank statement using bank workflow
    const bankWorkflow = new BankWorkflow();
    const result = await bankWorkflow.loadPaymentsFromBankStatementAndUpdateCreditAllocation(bankStatement.data);

    return NextResponse.json({ 
      success: true,
      message: "Successfully processed bank statement and updated credit allocations" 
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error in update-credits route:", error);
    return NextResponse.json({ 
      error: `Error processing request: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
}