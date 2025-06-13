'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

export async function getFreightCost(
  country: string,
  originPort: string,
  destinationPort: string,
  containerType?: string
) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured');
  }

  console.log('Fetching freight cost for:', {
    country,
    originPort,
    destinationPort,
    containerType
  });

  const query = supabase
    .from('freight_costs')
    .select('*')
    .eq('country', country)
    .eq('origin_port', originPort)
    .eq('destination_port', destinationPort);

  if (containerType) {
    query.eq('container_type', containerType);
  }

  const { data, error } = await query.single();

  if (error) {
    console.error('Error fetching freight cost:', error);
    if (error.code === 'PGRST116') {
      throw new Error(`No freight cost found for the given route: ${country} - ${originPort} to ${destinationPort}`);
    }
    throw error;
  }

  if (!data) {
    throw new Error(`No freight cost found for the given route: ${country} - ${originPort} to ${destinationPort}`);
  }

  console.log('Freight cost data:', data);
  return {
    ...data,
    freight_cost: data.freight_cost_usd // Map the correct column name
  };
}

export async function getHSCode(hsnCode: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured');
  }

  console.log('Fetching HSN code:', hsnCode);

  const { data, error } = await supabase
    .from('hs_codes')
    .select('*')
    .eq('hsn_code', hsnCode)
    .single();

  if (error) {
    console.error('Error fetching HSN code:', error);
    throw error;
  }

  console.log('HSN code data:', data);
  return data;
}

// Helper function to test the connection
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('hs_codes').select('count').limit(1);
    if (error) throw error;
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
} 