import { CostEstimateInput, CostBreakdown, ShippingMode, IncoTerm, ContainerType } from '@/types';
import { getFreightCost, getHSCode } from './supabase';
import { getExchangeRates } from '@/lib/exchangeRates';

// Exchange rates (you might want to fetch these from an API in production)
// export const EXCHANGE_RATES = { ... }

// All constants are in USD
export const FREIGHT_PER_CBM_USD = 60;  // USD per CBM
export const THC_FCL_USD = 725;  // USD per container
export const IHC_FCL_USD = 302;  // USD per container
export const DESTINATION_DELIVERY_CHARGES_FCL_20FT_USD = 241;  // USD per container
export const DESTINATION_DELIVERY_CHARGES_FCL_40FT_USD = 362;  // USD per container
export const DESTINATION_ORDER_CHARGES_FCL_USD = 121;  // USD per container
export const DESTINATION_CLEARANCE_FCL_USD = 241;  // USD per container
export const DELIVERY_ORDER_CHARGES_LCL_USD = 121;  // USD per shipment
export const DESTINATION_TRUCKING_PER_CBM_LCL_USD = 49;  // USD per CBM

// Air Freight Rates (all in USD)
export const AIR_CARGO_BASE_RATE_USD = 12;  // USD per kg
export const DESTINATION_CLEARANCE_AIR_USD = 61;  // USD per shipment
export const DESTINATION_TRUCKING_CHARGES_AIR_USD = 36;  // USD per 100 kg

// Air Freight Rate Constants (all in USD per kg)
export const AIR_RATE_3_10KG_USD = 11;
export const AIR_RATE_11_40KG_USD = 10;
export const AIR_RATE_41_99KG_USD = 9;
export const AIR_RATE_100_200KG_USD = 3.2;
export const AIR_RATE_201_300KG_USD = 2.8;
export const AIR_RATE_301_500KG_USD = 2.5;
export const AIR_RATE_501_5000KG_USD = 2.1;
export const AIR_RATE_ABOVE_5000KG_USD = 1.8;

// Percentage (no currency)
export const TRANSACTIONAL_CHARGES_PERCENTAGE = 3;  // Percentage of invoice value

// INCO Terms in USD
export const INCO_TERMS = {
  EXW: 300,  // USD
  FOB: 200,  // USD
  CIF: 0,    // USD
};

// FCL Constants

// LCL Constants
export const DESTINATION_CLEARANCE_LCL = 241; // USD
export const DESTINATION_TRUCKING_PER_CBM_LCL = 49; // USD per CBM
export const DELIVERY_ORDER_CHARGES_LCL = 121; // USD

// Container capacities in CBM
export const CONTAINER_20FT_CAPACITY = 33; // 33 CBM for 20ft container
export const CONTAINER_40FT_CAPACITY = 67; // 67 CBM for 40ft container

// Air Freight Rate Constants (per kg)
export const AIR_RATE_0_2KG = 12; // USD per kg
export const AIR_RATE_3_10KG = 11; // USD per kg
export const AIR_RATE_11_40KG = 10; // USD per kg
export const AIR_RATE_41_99KG = 9; // USD per kg
export const AIR_RATE_100_200KG = 3.2; // USD per kg
export const AIR_RATE_201_300KG = 2.8; // USD per kg
export const AIR_RATE_301_500KG = 2.5; // USD per kg
export const AIR_RATE_501_5000KG = 2.1; // USD per kg
export const AIR_RATE_ABOVE_5000KG = 1.8; // USD per kg

// Air Freight Additional Charges
export const DESTINATION_CLEARANCE_AIR = 61; // INR
export const DELIVERY_ORDER_CHARGES_AIR = 5000; // INR
export const DESTINATION_TRUCKING_CHARGES_AIR = 3000; // INR per 100 kg

// Helper function to calculate CBM
function calculateCBM(dimensions: { length: number; width: number; height: number }, cartons: number = 1): number {
  const { length, width, height } = dimensions;
  return (length * width * height); // to m³
}

export function calculateVolumetricWeight(dimensions: { length: number; width: number; height: number }, cartons: number): number {
  // Convert cm³ to m³ by dividing by 1,000,000, then divide by 6000 for air freight
  // Formula: (L × W × H × cartons) / (1000000 × 6000)
  return (dimensions.length * dimensions.width * dimensions.height * cartons) / (1000000 * 6000);
}

export function getCourierRate(weight: number): number {
  // Simplified rate structure for courier
  if (weight <= 10) return 500;
  if (weight <= 20) return 450;
  if (weight <= 50) return 400;
  return 350;
}

export function getAirCargoRate(weight: number): number {
  // Simplified rate structure for air cargo
  if (weight <= 100) return 7.0;
  if (weight <= 500) return 6.5;
  return 6.0;
}

export function calculateContainerRequirements(dimensions: { length: number; width: number; height: number }, quantity: number) {
  // Calculate single package CBM
  const singlePackageCBM = dimensions.length * dimensions.width * dimensions.height;
  
  // Calculate total CBM for all packages
  const totalCBM = singlePackageCBM * quantity;
  
  // Calculate how many packages can fit in each container type
  const packagesPer20FT = Math.floor(CONTAINER_20FT_CAPACITY / singlePackageCBM);
  const packagesPer40FT = Math.floor(CONTAINER_40FT_CAPACITY / singlePackageCBM);
  
  // Calculate required containers based on total quantity
  const required20FT = Math.ceil(quantity / packagesPer20FT);
  const required40FT = Math.ceil(quantity / packagesPer40FT);
  
  // If a single package is larger than container capacity
  if (singlePackageCBM > CONTAINER_40FT_CAPACITY) {
    return {
      required20FT: 0,
      required40FT: 0,
      packageCBM: singlePackageCBM,
      totalCBM,
      packagesPer20FT: 0,
      packagesPer40FT: 0,
      error: 'Package size exceeds container capacity'
    };
  }
  
  // If package is too large for 20ft but fits in 40ft
  if (singlePackageCBM > CONTAINER_20FT_CAPACITY) {
    return {
      required20FT: 0,
      required40FT: required40FT,
      packageCBM: singlePackageCBM,
      totalCBM,
      packagesPer20FT: 0,
      packagesPer40FT: packagesPer40FT,
      error: 'Package size exceeds 20ft container capacity'
    };
  }
  
  return {
    required20FT,
    required40FT,
    packageCBM: singlePackageCBM,
    totalCBM,
    packagesPer20FT,
    packagesPer40FT
  };
}

export async function calculateLandedCost(input: CostEstimateInput): Promise<CostBreakdown> {
  console.log('=== STARTING LANDED COST CALCULATION ===');
  console.log('Input data:', {
    productCost: input.productCost,
    currency: input.currency,
    shippingMode: input.shippingMode,
    incoTerm: input.incoTerm,
    containerType: input.containerType,
    originCountry: input.originCountry,
    originPort: input.originPort,
    destinationPort: input.destinationPort,
    dimensions: input.dimensions,
    cartons: input.cartons,
    grossWeight: input.grossWeight,
    hsnCode: input.hsnCode
  });

  // Get HSN code details first
  const hsnDetails = await getHSCode(input.hsnCode);
  console.log('HSN code details:', hsnDetails);

  if (!hsnDetails || typeof hsnDetails.duty_percentage !== 'number') {
    throw new Error('Invalid HSN code or duty percentage not found');
  }

  const dutyPercentage = hsnDetails.duty_percentage;
  console.log('Duty percentage:', dutyPercentage);

  const { 
    customerName,
    companyName,
    contactNumber,
    email,
    productName, 
    productCost, 
    currency, 
    shippingMode, 
    incoTerm, 
    dimensions, 
    cartons,
    grossWeight,
    containerType 
  } = input;

  // Get current exchange rates
  console.log('=== FETCHING EXCHANGE RATES ===');
  const exchangeRates = await getExchangeRates();
  console.log('All exchange rates:', exchangeRates);
  console.log('Selected currency rate:', {
    currency,
    rate: exchangeRates[currency],
    availableRates: Object.keys(exchangeRates)
  });
  
  // Convert ONLY the invoice value to INR using user's selected currency
  const productCostINR = productCost * exchangeRates[currency];
  console.log('=== CURRENCY CONVERSION DETAILS ===');
  console.log('Product cost conversion:', {
    originalCost: productCost,
    originalCurrency: currency,
    exchangeRate: exchangeRates[currency],
    convertedCostINR: productCostINR,
    calculation: `${productCost} ${currency} × ${exchangeRates[currency]} = ${productCostINR} INR`
  });

  // Convert all USD constants to INR
  const USD_TO_INR = exchangeRates['USD'];
  console.log('USD to INR rate:', USD_TO_INR);
  console.log('=== USD CONSTANTS CONVERSION ===');
  
  // Convert all USD constants to INR
  const FREIGHT_PER_CBM_INR = FREIGHT_PER_CBM_USD * USD_TO_INR;
  const THC_INR = THC_FCL_USD * USD_TO_INR;
  const IHC_INR = IHC_FCL_USD * USD_TO_INR;
  const DESTINATION_DELIVERY_20FT_INR = DESTINATION_DELIVERY_CHARGES_FCL_20FT_USD * USD_TO_INR;
  const DESTINATION_DELIVERY_40FT_INR = DESTINATION_DELIVERY_CHARGES_FCL_40FT_USD * USD_TO_INR;
  const DESTINATION_ORDER_CHARGES_INR = DESTINATION_ORDER_CHARGES_FCL_USD * USD_TO_INR;
  const DESTINATION_CLEARANCE_INR = DESTINATION_CLEARANCE_FCL_USD * USD_TO_INR;
  const DELIVERY_ORDER_CHARGES_INR = DELIVERY_ORDER_CHARGES_LCL_USD * USD_TO_INR;
  const DESTINATION_TRUCKING_PER_CBM_INR = DESTINATION_TRUCKING_PER_CBM_LCL_USD * USD_TO_INR;
  const AIR_CARGO_BASE_RATE_INR = AIR_CARGO_BASE_RATE_USD * USD_TO_INR;
  const DESTINATION_CLEARANCE_AIR_INR = DESTINATION_CLEARANCE_AIR_USD * USD_TO_INR;
  const DESTINATION_TRUCKING_CHARGES_AIR_INR = DESTINATION_TRUCKING_CHARGES_AIR_USD * USD_TO_INR;

  console.log('Converted USD constants to INR:', {
    FREIGHT_PER_CBM: { USD: FREIGHT_PER_CBM_USD, INR: FREIGHT_PER_CBM_INR },
    THC: { USD: THC_FCL_USD, INR: THC_INR },
    IHC: { USD: IHC_FCL_USD, INR: IHC_INR },
    DESTINATION_DELIVERY_20FT: { USD: DESTINATION_DELIVERY_CHARGES_FCL_20FT_USD, INR: DESTINATION_DELIVERY_20FT_INR },
    DESTINATION_DELIVERY_40FT: { USD: DESTINATION_DELIVERY_CHARGES_FCL_40FT_USD, INR: DESTINATION_DELIVERY_40FT_INR },
    DESTINATION_ORDER_CHARGES: { USD: DESTINATION_ORDER_CHARGES_FCL_USD, INR: DESTINATION_ORDER_CHARGES_INR },
    DESTINATION_CLEARANCE: { USD: DESTINATION_CLEARANCE_FCL_USD, INR: DESTINATION_CLEARANCE_INR },
    DELIVERY_ORDER_CHARGES: { USD: DELIVERY_ORDER_CHARGES_LCL_USD, INR: DELIVERY_ORDER_CHARGES_INR },
    DESTINATION_TRUCKING_PER_CBM: { USD: DESTINATION_TRUCKING_PER_CBM_LCL_USD, INR: DESTINATION_TRUCKING_PER_CBM_INR },
    AIR_CARGO_BASE_RATE: { USD: AIR_CARGO_BASE_RATE_USD, INR: AIR_CARGO_BASE_RATE_INR },
    DESTINATION_CLEARANCE_AIR: { USD: DESTINATION_CLEARANCE_AIR_USD, INR: DESTINATION_CLEARANCE_AIR_INR },
    DESTINATION_TRUCKING_CHARGES_AIR: { USD: DESTINATION_TRUCKING_CHARGES_AIR_USD, INR: DESTINATION_TRUCKING_CHARGES_AIR_INR }
  });
  
  const INCO_TERMS_INR = {
    EXW: INCO_TERMS.EXW * USD_TO_INR,
    FOB: INCO_TERMS.FOB * USD_TO_INR,
    CIF: INCO_TERMS.CIF * USD_TO_INR
  };

  console.log('Converted INCO terms to INR:', {
    EXW: { USD: INCO_TERMS.EXW, INR: INCO_TERMS_INR.EXW },
    FOB: { USD: INCO_TERMS.FOB, INR: INCO_TERMS_INR.FOB },
    CIF: { USD: INCO_TERMS.CIF, INR: INCO_TERMS_INR.CIF }
  });
  
  let freightOnlyINR = 0;
  let totalFreightINR = 0;
  const otherCharges: CostBreakdown['otherCharges'] = {};
  const details: CostBreakdown['details'] = {};

  switch (shippingMode) {
    case 'Sea FCL': {
      try {
        // Get freight cost from database - this is in USD
        const freightCost = await getFreightCost(
          input.originCountry,
          input.originPort,
          input.destinationPort,
          input.containerType
        );
        
        console.log('Freight cost from database:', freightCost);
        
        if (!freightCost || typeof freightCost.freight_cost_usd !== 'number') {
          throw new Error('Invalid freight cost data received');
        }

        // Convert freight cost from USD to INR using the exchange rate
        // The freight_cost_usd is in USD, and USD_TO_INR is the rate (e.g., 83)
        // For example, if freight_cost_usd is 1000 USD and USD_TO_INR is 83, then:
        // freightOnlyINR = 1000 * 83 = 83,000 INR
        freightOnlyINR = Math.round(freightCost.freight_cost_usd * USD_TO_INR);
        console.log('Freight cost conversion:', {
          freight_cost_usd: freightCost.freight_cost_usd,
          USD_TO_INR,
          freightOnlyINR
        });
        
        // Calculate transactional charges (3% of invoice value in INR)
        const transactionalChargesINR = Math.round(productCostINR * (TRANSACTIONAL_CHARGES_PERCENTAGE / 100));
        console.log('Transactional charges:', {
          productCostINR,
          TRANSACTIONAL_CHARGES_PERCENTAGE,
          transactionalChargesINR
        });
        
        // Use converted charges (all USD constants are already converted to INR)
        const destinationDeliveryChargesINR = containerType === '20 ft' 
          ? DESTINATION_DELIVERY_20FT_INR 
          : DESTINATION_DELIVERY_40FT_INR;

        // Calculate total freight including all charges
        totalFreightINR = freightOnlyINR + 
                         THC_INR + 
                         IHC_INR + 
                         DESTINATION_CLEARANCE_INR + 
                         destinationDeliveryChargesINR + 
                         DESTINATION_ORDER_CHARGES_INR +
                         transactionalChargesINR;

        // Add all charges to otherCharges for breakdown
        otherCharges.transactionalChargesINR = transactionalChargesINR;
        otherCharges.thcINR = THC_INR;
        otherCharges.ihcINR = IHC_INR;
        otherCharges.destinationClearanceINR = DESTINATION_CLEARANCE_INR;
        otherCharges.destinationDeliveryChargesINR = destinationDeliveryChargesINR;
        otherCharges.destinationOrderChargesINR = DESTINATION_ORDER_CHARGES_INR;
        details.containerType = input.containerType;

        // Use converted INCO term charges
        if (incoTerm === 'EXW') {
          totalFreightINR += INCO_TERMS_INR.EXW;
          otherCharges.exwChargesINR = INCO_TERMS_INR.EXW;
        } else if (incoTerm === 'FOB') {
          totalFreightINR += INCO_TERMS_INR.FOB;
          otherCharges.fobChargesINR = INCO_TERMS_INR.FOB;
        }

        // Calculate container requirements
        const containerReqs = calculateContainerRequirements(dimensions, cartons);
        details.required20FT = containerReqs.required20FT;
        details.required40FT = containerReqs.required40FT;
        details.packageCBM = containerReqs.packageCBM;
        details.totalCBM = containerReqs.totalCBM;
        details.packagesPer20FT = containerReqs.packagesPer20FT;
        details.packagesPer40FT = containerReqs.packagesPer40FT;
        details.error = containerReqs.error;

      } catch (error) {
        console.error('Error calculating FCL costs:', error);
        throw error;
      }
      break;
    }

    case 'Sea LCL': {
      // Calculate CBM
      const packageCBM = calculateCBM(dimensions);
      const totalCBM = packageCBM * cartons;
      details.packageCBM = packageCBM;
      details.totalCBM = totalCBM;

      // Use converted LCL rates
      freightOnlyINR = totalCBM * FREIGHT_PER_CBM_INR;
      
      // Calculate other charges using converted rates
      const truckingChargesINR = totalCBM * DESTINATION_TRUCKING_PER_CBM_INR;
      const clearanceChargesINR = DESTINATION_CLEARANCE_INR;
      const doChargesINR = DELIVERY_ORDER_CHARGES_INR;
      
      // Calculate transactional charges (3% of invoice value in INR)
      const transactionalChargesINR = Math.round(productCostINR * (TRANSACTIONAL_CHARGES_PERCENTAGE / 100));

      // Calculate total freight
      totalFreightINR = freightOnlyINR + 
                       truckingChargesINR + 
                       clearanceChargesINR + 
                       doChargesINR +
                       transactionalChargesINR;

      // Add all charges to otherCharges
      otherCharges.destinationTruckingINR = truckingChargesINR;
      otherCharges.destinationClearanceINR = clearanceChargesINR;
      otherCharges.deliveryOrderChargesINR = doChargesINR;
      otherCharges.transactionalChargesINR = transactionalChargesINR;

      // Use converted INCO term charges
      if (incoTerm === 'EXW') {
        totalFreightINR += INCO_TERMS_INR.EXW;
        otherCharges.exwChargesINR = INCO_TERMS_INR.EXW;
      } else if (incoTerm === 'FOB') {
        totalFreightINR += INCO_TERMS_INR.FOB;
        otherCharges.fobChargesINR = INCO_TERMS_INR.FOB;
      }
      break;
    }

    case 'Air': {
      const volumetricWeight = calculateVolumetricWeight(dimensions, cartons);
      const chargeableWeight = Math.max(grossWeight, volumetricWeight);
      details.chargeableWeight = chargeableWeight;

      // Calculate transactional charges (3% of invoice value in INR) for all air shipments
      const transactionalChargesINR = Math.round(productCostINR * (TRANSACTIONAL_CHARGES_PERCENTAGE / 100));
      otherCharges.transactionalChargesINR = transactionalChargesINR;

      if (chargeableWeight <= 80) {
        // For shipments under 80kg, use fixed INR rate
        freightOnlyINR = chargeableWeight * AIR_CARGO_BASE_RATE_INR;
        totalFreightINR = freightOnlyINR + transactionalChargesINR;
      } else {
        // For shipments over 80kg, use tiered USD rates
        let rateUSD = AIR_CARGO_BASE_RATE_USD; // Default rate
        
        // Apply tiered rates based on weight
        if (chargeableWeight <= 2) rateUSD = AIR_RATE_0_2KG;
        else if (chargeableWeight <= 10) rateUSD = AIR_RATE_3_10KG;
        else if (chargeableWeight <= 40) rateUSD = AIR_RATE_11_40KG;
        else if (chargeableWeight <= 99) rateUSD = AIR_RATE_41_99KG;
        else if (chargeableWeight <= 200) rateUSD = AIR_RATE_100_200KG;
        else if (chargeableWeight <= 300) rateUSD = AIR_RATE_201_300KG;
        else if (chargeableWeight <= 500) rateUSD = AIR_RATE_301_500KG;
        else if (chargeableWeight <= 5000) rateUSD = AIR_RATE_501_5000KG;
        else rateUSD = AIR_RATE_ABOVE_5000KG;

        // Calculate freight in USD first, then convert to INR
        const freightUSD = chargeableWeight * rateUSD;
        freightOnlyINR = Math.round(freightUSD * USD_TO_INR);
        
        const clearanceINR = DESTINATION_CLEARANCE_AIR_INR;
        const doChargesINR = DESTINATION_TRUCKING_CHARGES_AIR_INR;

        // Add all charges to otherCharges
        otherCharges.destinationClearanceINR = clearanceINR;
        otherCharges.destinationDeliveryChargesINR = doChargesINR;
        otherCharges.destinationOrderChargesINR = doChargesINR;

        // Use converted INCO term charges
        if (incoTerm === 'EXW') {
          totalFreightINR = freightOnlyINR + INCO_TERMS_INR.EXW + clearanceINR + doChargesINR + transactionalChargesINR;
          otherCharges.exwChargesINR = INCO_TERMS_INR.EXW;
        } else if (incoTerm === 'FOB') {
          totalFreightINR = freightOnlyINR + INCO_TERMS_INR.FOB + clearanceINR + doChargesINR + transactionalChargesINR;
          otherCharges.fobChargesINR = INCO_TERMS_INR.FOB;
        } else if (incoTerm === 'CIF') {
          totalFreightINR = INCO_TERMS_INR.CIF + clearanceINR + doChargesINR + transactionalChargesINR;
          freightOnlyINR = 0;
          otherCharges.cifChargesINR = INCO_TERMS_INR.CIF;
        }
      }
      break;
    }
  }

  // Calculate total landed cost
  const assessableValue = productCostINR + freightOnlyINR;
  const customsDutyINR = Math.round(assessableValue * (dutyPercentage / 100));
  const totalLandedCostINR = assessableValue + customsDutyINR + totalFreightINR;

  // At the end of the function, before returning:
  console.log('=== FINAL CALCULATION SUMMARY ===');
  console.log('Final values:', {
    productCostINR,
    freightOnlyINR,
    totalFreightINR,
    customsDutyINR,
    totalLandedCostINR,
    dutyPercentage
  });
  console.log('=== END OF LANDED COST CALCULATION ===');

  return {
    customerName,
    companyName,
    contactNumber,
    email,
    productName,
    productCostINR,
    freightOnlyINR,
    totalFreightINR,
    customsDutyINR,
    dutyPercentage,
    totalLandedCostINR,
    shippingMode,
    incoTerm,
    otherCharges,
    details
  };
} 