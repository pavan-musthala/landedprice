import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function POST(request: Request) {
  try {
    console.log('Starting Google Sheets save operation...');
    console.log('Service Account Email:', process.env.GOOGLE_CLIENT_EMAIL);
    
    const { spreadsheetId, sheetName, headers, rowData } = await request.json();
    console.log('Received data:', { 
      spreadsheetId, 
      sheetName, 
      headersCount: headers?.length,
      rowDataCount: rowData?.length 
    });

    // Verify sheet access
    try {
      console.log('Verifying sheet access...');
      const sheet = await sheets.spreadsheets.get({
        spreadsheetId,
        ranges: [`${sheetName}!A1:AA1`], // Updated range to match new column count
      });
      console.log('Sheet access verified successfully');
    } catch (error) {
      console.error('Sheet access error:', error);
      return NextResponse.json(
        { error: 'Cannot access the Google Sheet. Please verify the service account has edit access.' },
        { status: 403 }
      );
    }

    // First, check if headers exist
    console.log('Checking for existing headers...');
    const sheet = await sheets.spreadsheets.get({
      spreadsheetId,
      ranges: [`${sheetName}!A1:AA1`], // Updated range
    });

    const range = sheet.data.sheets?.[0]?.data?.[0]?.rowData?.[0]?.values;
    const hasHeaders = range && range.length > 0;
    console.log('Headers exist:', hasHeaders);

    // If no headers exist, add them
    if (!hasHeaders) {
      console.log('Adding headers...');
      try {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${sheetName}!A1:AA1`, // Updated range
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [headers],
          },
        });
        console.log('Headers added successfully');

        // Format headers
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
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
            ],
          },
        });
        console.log('Header formatting applied');
      } catch (error) {
        console.error('Error adding headers:', error);
        throw error;
      }
    }

    // Append the row to the sheet
    console.log('Appending row data...');
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:AA`, // Updated range
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowData],
        },
      });
      console.log('Row appended successfully');
    } catch (error) {
      console.error('Error appending row:', error);
      throw error;
    }

    // Auto-resize columns
    console.log('Auto-resizing columns...');
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
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
      console.log('Columns resized successfully');
    } catch (error) {
      console.error('Error resizing columns:', error);
      // Don't throw here as the data was already saved
    }

    console.log('Google Sheets save operation completed successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Detailed error in Google Sheets operation:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to save to Google Sheet',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 