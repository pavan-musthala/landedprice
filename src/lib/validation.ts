import { z } from 'zod';
import { ShippingMode, IncoTerm, ContainerType, COMMON_CURRENCIES } from '@/types';
import { getHSCode } from './supabase';

export const dimensionsSchema = z.object({
  length: z.number({ 
    required_error: 'Length is required',
    invalid_type_error: 'Length must be a number',
  }).min(1, 'Length must be greater than 0'),
  width: z.number({ 
    required_error: 'Width is required',
    invalid_type_error: 'Width must be a number',
  }).min(1, 'Width must be greater than 0'),
  height: z.number({ 
    required_error: 'Height is required',
    invalid_type_error: 'Height must be a number',
  }).min(1, 'Height must be greater than 0'),
});

// Create a union type of all currency codes
const currencyCodes = COMMON_CURRENCIES.map(c => c.code) as [string, ...string[]];

export const costEstimateSchema = z.object({
  // Customer Information
  customerName: z.string({
    required_error: 'Customer name is required',
    invalid_type_error: 'Customer name must be text',
  }).min(1, 'Customer name is required'),
  
  companyName: z.string({
    required_error: 'Company name is required',
    invalid_type_error: 'Company name must be text',
  }).min(1, 'Company name is required'),
  
  contactNumber: z.string({
    required_error: 'Contact number is required',
    invalid_type_error: 'Contact number must be text',
  })
  .regex(/^[0-9]{10}$/, 'Contact number must be exactly 10 digits'),
  
  email: z.string({
    required_error: 'Email is required',
    invalid_type_error: 'Email must be text',
  })
  .email('Invalid email address')
  .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid email domain'),

  productName: z.string({
    required_error: 'Product name is required',
    invalid_type_error: 'Product name must be text',
  }).min(1, 'Product name is required'),
  productCost: z.number({ 
    required_error: 'Invoice value is required',
    invalid_type_error: 'Invoice value must be a number',
  }).min(0, 'Invoice value must be greater than or equal to 0'),
  currency: z.enum(currencyCodes, {
    required_error: 'Currency is required',
    invalid_type_error: 'Please select a valid currency',
  }),
  shippingMode: z.enum(['Sea FCL', 'Sea LCL', 'Air'] as const, {
    required_error: 'Shipping mode is required',
    invalid_type_error: 'Please select a valid shipping mode',
  }),
  incoTerm: z.enum(['EXW', 'FOB', 'CIF'] as const, {
    required_error: 'INCO term is required',
    invalid_type_error: 'Please select a valid INCO term',
  }),
  hsnCode: z.string({
    required_error: 'HSN code is required',
    invalid_type_error: 'HSN code must be a text',
  }).min(1, 'HSN code is required').refine(
    async (code) => {
      try {
        await getHSCode(code);
        return true;
      } catch (error) {
        return false;
      }
    },
    {
      message: 'Invalid HSN code. Please enter a valid code from the database.',
    }
  ),
  originCountry: z.string({
    required_error: 'Origin country is required',
    invalid_type_error: 'Origin country must be a text',
  }).min(1, 'Origin country is required'),
  originPort: z.string({
    required_error: 'Origin port/airport is required',
    invalid_type_error: 'Origin port/airport must be a text',
  }).min(1, 'Origin port/airport is required'),
  destinationPort: z.string({
    required_error: 'Destination port/airport is required',
    invalid_type_error: 'Destination port/airport must be a text',
  }).min(1, 'Destination port/airport is required'),
  containerType: z.enum(['20 ft', '40 ft'] as const, {
    required_error: 'Container type is required for Sea FCL',
    invalid_type_error: 'Please select a valid container type',
  }).optional(),
  grossWeight: z.number({ 
    required_error: 'Gross weight is required',
    invalid_type_error: 'Gross weight must be a number',
  }).min(0, 'Gross weight must be greater than or equal to 0'),
  cartons: z.number({ 
    required_error: 'Quantity is required',
    invalid_type_error: 'Quantity must be a number',
  }).int('Quantity must be a whole number').min(1, 'Quantity must be at least 1'),
  dimensions: dimensionsSchema,
}).refine((data) => {
  // Container type is required for Sea FCL
  if (data.shippingMode === 'Sea FCL' && !data.containerType) {
    return false;
  }
  return true;
}, {
  message: 'Container type is required for Sea FCL shipments',
  path: ['containerType'],
}).refine((data) => {
  // Air shipments over 80kg must have an incoterm
  if (data.shippingMode === 'Air' && data.grossWeight > 80 && !data.incoTerm) {
    return false;
  }
  return true;
}, {
  message: 'Air shipments over 80kg must specify an incoterm',
  path: ['incoTerm'],
});