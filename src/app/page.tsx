'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import CostEstimateForm from '@/components/CostEstimateForm';
import { saveToGoogleSheet } from '@/lib/googleSheets';
import { calculateLandedCost } from '@/lib/calculations';
import { CostBreakdown, CostEstimateInput } from '@/types';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [formData, setFormData] = useState<CostEstimateInput>({
    customerName: '',
    companyName: '',
    contactNumber: '',
    email: '',
    productName: '',
    productCost: 0,
    currency: 'USD',
    cartons: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    grossWeight: 0,
    shippingMode: 'Sea FCL',
    incoTerm: 'FOB',
    originPort: '',
    destinationPort: '',
    originCountry: '',
    hsnCode: '',
    containerType: '20 ft'
  });
  const [breakdown, setBreakdown] = useState<CostBreakdown | null>(null);

  const handleInitializeSheet = async () => {
    setIsInitializing(true);
    setError(null);
    try {
      const response = await fetch('/api/init-sheet');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize sheet');
      }
      
      alert('Sheet initialized successfully!');
    } catch (error) {
      console.error('Error initializing sheet:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize sheet');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    
    try {
      // Calculate landed cost
      const result = await calculateLandedCost(formData);
      setBreakdown(result);
      setError(null);

      // Save to Google Sheet
      try {
        await saveToGoogleSheet(result);  // result is now the resolved CostBreakdown, not a Promise
        console.log('Successfully saved to Google Sheet');
      } catch (saveError) {
        console.error('Error saving to Google Sheet:', saveError);
      }
      
      // Navigate to breakdown page with the data
      const queryString = new URLSearchParams({
        data: JSON.stringify(result)
      }).toString();
      
      router.push(`/breakdown?${queryString}`);
    } catch (error) {
      console.error('Error calculating:', error);
      setError('An error occurred during calculation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                Landed Cost Calculator
              </h1>
              <CostEstimateForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 