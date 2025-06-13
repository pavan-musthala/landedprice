import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const SPREADSHEET_ID = '1LPLgVUTkmfCf0ZetUAYQ7ISRMHPxiSF-AEALmrvAHbs';
const SHEET_NAME = 'Sheet1';

// Headers for the Google Sheet
const HEADERS = [
  'Timestamp',
  'Customer Name',
  'Company Name',
  'Contact Number',
  'Email',
  'Product Name',
  'Product Cost (INR)',
  'Freight Only (INR)',
  'Total Freight (INR)',
  'Customs Duty (INR)',
  'Duty Percentage',
  'Total Landed Cost (INR)',
  'Shipping Mode',
  'Incoterm',
  'Transactional Charges (INR)',
  'THC (INR)',
  'IHC (INR)',
  'Destination Clearance (INR)',
  'Destination Delivery Charges (INR)',
  'Destination Order Charges (INR)',
  'EXW Charges (INR)',
  'Container Type',
  'Required 20FT',
  'Required 40FT',
  'Package CBM',
  'Packages Per 20FT',
  'Packages Per 40FT'
];

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function GET() {
  try {
    console.log('Initializing Google Sheet...');
    console.log('Environment variables check:');
    console.log('- GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL ? 'Set' : 'Not set');
    console.log('- GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? 'Set' : 'Not set');
    console.log('- GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID ? 'Set' : 'Not set');

    // First, try to get the sheet metadata to verify access
    console.log('Verifying sheet access...');
    try {
      const metadata = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
        fields: 'properties.title,sheets.properties.title',
      });
      console.log('Successfully accessed sheet:', metadata.data.properties?.title);
    } catch (error) {
      console.error('Failed to access sheet. Please verify:');
      console.error('1. The sheet ID is correct:', SPREADSHEET_ID);
      console.error('2. The service account email has been added as an editor:', process.env.GOOGLE_CLIENT_EMAIL);
      console.error('3. The service account has the correct permissions');
      throw error;
    }

    // Clear existing content
    console.log('Clearing existing content...');
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:AA1000`,
    });
    console.log('Cleared existing content');

    // Add headers
    console.log('Adding headers...');
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:AA1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [HEADERS],
      },
    });
    console.log('Added headers');

    // Format headers
    console.log('Getting sheet metadata for formatting...');
    const sheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      ranges: [`${SHEET_NAME}!A1:AA1`],
    });

    console.log('Applying formatting...');
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheet.data.sheets?.[0]?.properties?.sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.8, green: 0.8, blue: 0.8 },
                  textFormat: { bold: true },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
          {
            updateSheetProperties: {
              properties: {
                sheetId: sheet.data.sheets?.[0]?.properties?.sheetId,
                gridProperties: {
                  frozenRowCount: 1,
                },
              },
              fields: 'gridProperties.frozenRowCount',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: sheet.data.sheets?.[0]?.properties?.sheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 27, // A through AA
              },
            },
          },
        ],
      },
    });
    console.log('Applied formatting');

    return NextResponse.json({ 
      success: true, 
      message: 'Sheet initialized successfully',
      sheetTitle: sheet.data.properties?.title
    });
  } catch (error) {
    console.error('Detailed error in sheet initialization:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        help: 'Please verify that the service account has been added as an editor to the sheet.'
      },
      { status: 500 }
    );
  }
} 