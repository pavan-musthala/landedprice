import { CostBreakdown } from '@/types';

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

export async function saveToGoogleSheet(data: CostBreakdown) {
  try {
    console.log('Preparing to save data:', data);
    
    // Format the data for the sheet
    const rowData = [
      new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), // Indian timestamp
      data.customerName || '',
      data.companyName || '',
      data.contactNumber || '',
      data.email || '',
      data.productName || '',
      data.productCostINR?.toFixed(2) || '0.00',
      data.freightOnlyINR?.toFixed(2) || '0.00',
      data.totalFreightINR?.toFixed(2) || '0.00',
      data.customsDutyINR?.toFixed(2) || '0.00',
      data.dutyPercentage?.toFixed(2) || '0.00',
      data.totalLandedCostINR?.toFixed(2) || '0.00',
      data.shippingMode || '',
      data.incoTerm || '',
      data.otherCharges?.transactionalChargesINR?.toFixed(2) || '0.00',
      data.otherCharges?.thcINR?.toFixed(2) || '0.00',
      data.otherCharges?.ihcINR?.toFixed(2) || '0.00',
      data.otherCharges?.destinationClearanceINR?.toFixed(2) || '0.00',
      data.otherCharges?.destinationDeliveryChargesINR?.toFixed(2) || '0.00',
      data.otherCharges?.destinationOrderChargesINR?.toFixed(2) || '0.00',
      data.otherCharges?.exwChargesINR?.toFixed(2) || '0.00',
      data.details?.containerType || '',
      data.details?.required20FT?.toString() || '0',
      data.details?.required40FT?.toString() || '0',
      data.details?.packageCBM?.toFixed(6) || '0.000000',
      data.details?.packagesPer20FT?.toString() || '0',
      data.details?.packagesPer40FT?.toString() || '0'
    ];

    console.log('Formatted row data:', rowData);

    // Make API call to your backend endpoint that will handle the Google Sheets API
    const response = await fetch('/api/save-calculation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        spreadsheetId: SPREADSHEET_ID,
        sheetName: SHEET_NAME,
        headers: HEADERS,
        rowData: rowData
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from API:', errorData);
      throw new Error(errorData.error || 'Failed to save to Google Sheet');
    }

    const result = await response.json();
    console.log('Save successful:', result);
    return true;
  } catch (error) {
    console.error('Error in saveToGoogleSheet:', error);
    throw error;
  }
} 