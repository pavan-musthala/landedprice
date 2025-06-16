'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CostEstimateInput, CostBreakdown } from '@/types';
import { costEstimateSchema } from '@/lib/validation';
import { calculateLandedCost, INCO_TERMS, FREIGHT_PER_CBM_USD } from '@/lib/calculations';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveToGoogleSheet } from '@/lib/googleSheets';
import { COMMON_CURRENCIES } from '@/types';
import { originCountries, seaOriginPorts, seaDestinationPorts, airOriginAirports, airDestinationAirports, hsnCodes, OriginCountry } from '@/lib/constants';

export default function CostEstimateForm() {
  const router = useRouter();
  const [result, setResult] = useState<CostBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidatingHSN, setIsValidatingHSN] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CostEstimateInput>({
    resolver: zodResolver(costEstimateSchema),
    defaultValues: {
      dimensions: {
        length: 1,
        width: 1,
        height: 1,
      },
    },
  });

  const shippingMode = watch('shippingMode');

  const onSubmit = async (data: CostEstimateInput) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Form data being submitted:', data);
      
      // Calculate the cost breakdown
      const result = await calculateLandedCost(data);
      console.log('Calculation result:', result);
      
      // Save to Google Sheet
      try {
        await saveToGoogleSheet(result);
        console.log('Successfully saved to Google Sheet');
      } catch (saveError) {
        console.error('Error saving to Google Sheet:', saveError);
        setError('Failed to save calculation to Google Sheet. Please try again.');
        // Still proceed to show the breakdown even if saving fails
      }
      
      // Navigate to breakdown page with the result
      const queryString = encodeURIComponent(JSON.stringify(result));
      router.push(`/breakdown?data=${queryString}`);
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const renderOriginPortOptions = () => {
    const country = watch('originCountry') as OriginCountry | undefined;
    if (!country) return null;

    if (shippingMode === 'Air') {
      const airports = airOriginAirports[country];
      return airports?.map((airport) => (
        <option key={airport} value={airport}>{airport}</option>
      ));
    } else {
      const ports = seaOriginPorts[country];
      return ports?.map((port) => (
        <option key={port} value={port}>{port}</option>
      ));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-orange-800">BEFACH INTERNATIONAL</h1>
          <p className="mt-2 text-orange-600 text-lg">Landed Cost Calculator</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Product Information Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-orange-100">
            <h2 className="text-2xl font-semibold text-orange-800 mb-6">Product Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Product Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Product Name</label>
                <input
                  type="text"
                  {...register('productName')}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                  placeholder="Enter product name"
                />
                {errors.productName && (
                  <p className="text-sm text-red-600">{errors.productName.message}</p>
                )}
              </div>

              {/* Invoice Value with Currency */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Invoice Value</label>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-7">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('productCost', { 
                        valueAsNumber: true,
                        validate: {
                          isNumber: (value) => !isNaN(value) || 'Invoice value must be a valid number',
                          isPositive: (value) => value >= 0 || 'Invoice value must be greater than or equal to 0'
                        }
                      })}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                      placeholder="Enter invoice value"
                    />
                  </div>
                  <div className="col-span-5">
                    <select
                      {...register('currency')}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors bg-white"
                    >
                      {COMMON_CURRENCIES.map(currency => (
                        <option key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {errors.productCost && (
                  <p className="text-sm text-red-600">{errors.productCost.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Shipping Details Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-orange-100">
            <h2 className="text-2xl font-semibold text-orange-800 mb-6">Shipping Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Shipping Mode */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Shipping Mode</label>
                <select
                  {...register('shippingMode')}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors bg-white"
                >
                  <option value="Sea FCL">Sea FCL</option>
                  <option value="Sea LCL">Sea LCL</option>
                  <option value="Air">Air</option>
                </select>
                {errors.shippingMode && (
                  <p className="text-sm text-red-600">{errors.shippingMode.message}</p>
                )}
              </div>

              {/* INCO Term */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">INCO Term</label>
                <select
                  {...register('incoTerm')}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors bg-white"
                >
                  <option value="EXW">EXW</option>
                  <option value="FOB">FOB</option>
                  <option value="CIF">CIF</option>
                </select>
                {errors.incoTerm && (
                  <p className="text-sm text-red-600">{errors.incoTerm.message}</p>
                )}
              </div>

              {/* Container Type (only for Sea FCL) */}
              {shippingMode === 'Sea FCL' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Container Type</label>
                  <select
                    {...register('containerType')}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors bg-white"
                  >
                    <option value="20 ft">20 ft</option>
                    <option value="40 ft">40 ft</option>
                  </select>
                  {errors.containerType && (
                    <p className="text-sm text-red-600">{errors.containerType.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Origin & Destination Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-orange-100">
            <h2 className="text-2xl font-semibold text-orange-800 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Origin & Destination
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Origin Country Dropdown */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Origin Country</label>
                <select
                  {...register('originCountry')}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors bg-white"
                >
                  <option value="">Select Origin Country</option>
                  {originCountries.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                {errors.originCountry && (
                  <p className="text-sm text-red-600">{errors.originCountry.message}</p>
                )}
              </div>

              {/* Origin Port (or Airport) Dropdown – conditionally rendered based on shipping mode and origin country */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {shippingMode === 'Air' ? 'Origin Airport' : 'Origin Port'}
                </label>
                <select
                  {...register('originPort')}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors bg-white"
                >
                  <option value="">Select {shippingMode === 'Air' ? 'Origin Airport' : 'Origin Port'}</option>
                  {renderOriginPortOptions()}
                </select>
                 {errors.originPort && (
                   <p className="text-sm text-red-600">{errors.originPort.message}</p>
                 )}
              </div>

              {/* Destination Port (or Airport) Dropdown – conditionally rendered based on shipping mode */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {shippingMode === 'Air' ? 'Destination Airport' : 'Destination Port'}
                </label>
                <select
                  {...register('destinationPort')}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors bg-white"
                >
                  <option value="">Select {shippingMode === 'Air' ? 'Destination Airport' : 'Destination Port'}</option>
                  {(() => {
                     if (shippingMode === 'Air') {
                        return airDestinationAirports.map((airport) => (
                           <option key={airport} value={airport}>{airport}</option>
                        ));
                     } else {
                        return seaDestinationPorts.map((port) => (
                           <option key={port} value={port}>{port}</option>
                        ));
                     }
                  })()}
                </select>
                 {errors.destinationPort && (
                   <p className="text-sm text-red-600">{errors.destinationPort.message}</p>
                 )}
              </div>

              {/* HSN Code Dropdown (replacing the text input) */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">HSN Code</label>
                <select
                  {...register('hsnCode')}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors bg-white"
                >
                  <option value="">Select HSN Code</option>
                  {hsnCodes.map((code) => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
                {errors.hsnCode && (
                  <p className="text-sm text-red-600">{errors.hsnCode.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Package Details Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-orange-100">
            <h2 className="text-2xl font-semibold text-orange-800 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Package Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Gross Weight */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Gross Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('grossWeight', { valueAsNumber: true })}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                  placeholder="Enter gross weight"
                />
                {errors.grossWeight && (
                  <p className="text-sm text-red-600">{errors.grossWeight.message}</p>
                )}
              </div>

              {/* Dimensions and Quantity for Sea shipments */}
              {shippingMode === 'Sea FCL' || shippingMode === 'Sea LCL' ? (
                <>
                  {/* Length */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Length (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('dimensions.length', { valueAsNumber: true })}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                      placeholder="Enter length"
                    />
                    {errors.dimensions?.length && (
                      <p className="text-sm text-red-600">{errors.dimensions.length.message}</p>
                    )}
                  </div>

                  {/* Width */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Width (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('dimensions.width', { valueAsNumber: true })}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                      placeholder="Enter width"
                    />
                    {errors.dimensions?.width && (
                      <p className="text-sm text-red-600">{errors.dimensions.width.message}</p>
                    )}
                  </div>

                  {/* Height */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Height (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('dimensions.height', { valueAsNumber: true })}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                      placeholder="Enter height"
                    />
                    {errors.dimensions?.height && (
                      <p className="text-sm text-red-600">{errors.dimensions.height.message}</p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                    <input
                      type="number"
                      {...register('cartons', { valueAsNumber: true })}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                      placeholder="Enter quantity"
                    />
                    {errors.cartons && (
                      <p className="text-sm text-red-600">{errors.cartons.message}</p>
                    )}
                  </div>
                </>
              ) : (
                // Air shipment form (unchanged)
                <>
                  {/* Number of Cartons for Air */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Number of Cartons</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      {...register('cartons', { 
                        valueAsNumber: true,
                        validate: (value) => !isNaN(value) || 'Number of cartons must be a valid number'
                      })}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                      placeholder="Enter number of cartons"
                    />
                    {errors.cartons && (
                      <p className="text-sm text-red-600">{errors.cartons.message}</p>
                    )}
                  </div>

                  {/* Dimensions for Air */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Length (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      {...register('dimensions.length', { valueAsNumber: true })}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                      placeholder="Enter length"
                    />
                    {errors.dimensions?.length && (
                      <p className="text-sm text-red-600">{errors.dimensions.length.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Width (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      {...register('dimensions.width', { valueAsNumber: true })}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                      placeholder="Enter width"
                    />
                    {errors.dimensions?.width && (
                      <p className="text-sm text-red-600">{errors.dimensions.width.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      {...register('dimensions.height', { valueAsNumber: true })}
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                      placeholder="Enter height"
                    />
                    {errors.dimensions?.height && (
                      <p className="text-sm text-red-600">{errors.dimensions.height.message}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Customer Information Section - Moved to end */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-orange-100">
            <h2 className="text-2xl font-semibold text-orange-800 mb-6">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Customer Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                <input
                  type="text"
                  {...register('customerName')}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                  placeholder="Enter customer name"
                />
                {errors.customerName && (
                  <p className="text-sm text-red-600">{errors.customerName.message}</p>
                )}
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input
                  type="text"
                  {...register('companyName')}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                  placeholder="Enter company name"
                />
                {errors.companyName && (
                  <p className="text-sm text-red-600">{errors.companyName.message}</p>
                )}
              </div>

              {/* Contact Number */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                <input
                  type="tel"
                  {...register('contactNumber')}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                  placeholder="Enter 10-digit contact number"
                />
                {errors.contactNumber && (
                  <p className="text-sm text-red-600">{errors.contactNumber.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-colors"
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-12">
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white px-8 py-4 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading || isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Calculating...
                </>
              ) : (
                'Calculate Landed Price'
              )}
            </button>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-6 border border-red-100">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  );
} 