import { NextRequest, NextResponse } from "next/server";
import { downloadFioStatement, downloadFioStatementFromDate } from "@/lib/bank-parsers/bank-connector";
import { BankWorkflow } from "@/lib/services/workflows/bank-workflow";
import admin from 'firebase-admin';


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

// take in GET parameter: last date of existing bank statement (YYYY-MM-DD)
// download bank statement from that date
// return bank statement as JSON
export async function GET(request: NextRequest) {
  console.log("Processing fetch-bank-statement request");
  const lastDateParam = request.nextUrl.searchParams.get("lastDate");
  if (!lastDateParam) {
    return NextResponse.json({ 
      error: "Last date parameter is required" 
    }, { status: 400 });
  }
  
  // parse lastDate to Date
  //@TODO: remove this once we have a real last date
  //const lastDate = new Date(lastDateParam);
  const lastDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  // check if lastDateDate is valid
  if (isNaN(lastDate.getTime())) {
    return NextResponse.json({ 
      error: "Invalid date format" 
    }, { status: 400 });
  }

  console.log("Last date rcvd:", lastDate);
  try {
    // Optional auth check (commenting out for now to make testing easier)
    // const user = await authCheck(request);
    // if (!user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // Download bank statement using connector
    const bankStatement = await downloadFioStatementFromDate(lastDate);
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

    return NextResponse.json({ 
      success: true,
      data: bankStatement.data,
      message: "Succesfully downloaded bank statement" 
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error downloading bank statement:", error);
    return NextResponse.json({ 
      error: `Error processing request: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
}