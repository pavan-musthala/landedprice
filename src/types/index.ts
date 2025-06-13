export type ShippingMode = 'Sea FCL' | 'Sea LCL' | 'Air';
export type IncoTerm = 'EXW' | 'FOB' | 'CIF';
export type ContainerType = '20 ft' | '40 ft';

export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

export interface FreightCost {
  id: number;
  country: string;
  origin_port: string;
  destination_port: string;
  container_type: string;
  freight_cost_usd: number;
  alternate_routes: string;
}

export interface HSCode {
  hsn_code: string;
  description: string;
  duty_percentage: number;
}

// Add a type for currency selection
export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

// Common currencies with their full names and symbols
export const COMMON_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' }
];

export interface CostEstimateInput {
  // Customer Information
  customerName: string;
  companyName: string;
  contactNumber: string;
  email: string;
  // Existing fields
  productName: string;
  productCost: number;
  currency: string;
  shippingMode: ShippingMode;
  incoTerm: IncoTerm;
  containerType?: ContainerType;
  hsnCode: string;
  originCountry: string;
  originPort: string;
  destinationPort: string;
  grossWeight: number;
  cartons: number;
  dimensions: Dimensions;
}

export interface CostBreakdown {
  customerName: string;
  companyName: string;
  contactNumber: string;
  email: string;
  productName: string;
  productCostINR: number;
  freightOnlyINR: number;
  totalFreightINR: number;
  customsDutyINR: number;
  dutyPercentage: number;
  totalLandedCostINR: number;
  shippingMode: ShippingMode;
  incoTerm: IncoTerm;
  otherCharges: {
    transactionalChargesINR?: number;
    thcINR?: number;
    ihcINR?: number;
    destinationClearanceINR?: number;
    destinationDeliveryChargesINR?: number;
    destinationOrderChargesINR?: number;
    destinationTruckingINR?: number;
    deliveryOrderChargesINR?: number;
    exwChargesINR?: number;
    fobChargesINR?: number;
    cifChargesINR?: number;
    clearanceINR?: number;
    doChargesINR?: number;
  };
  details: {
    containerType?: ContainerType;
    required20FT?: number;
    required40FT?: number;
    packageCBM?: number;
    totalCBM?: number;
    chargeableCBM?: number;
    packagesPer20FT?: number;
    packagesPer40FT?: number;
    chargeableWeight?: number;
    error?: string;
  };
} 