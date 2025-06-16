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
import { motion } from 'framer-motion';

// Add this type guard function at the top of the file, after imports
function isValidCountry(country: string): country is keyof typeof airOriginAirports {
  return country in airOriginAirports;
}

// Add custom styles
const styles = {
  formContainer: "max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-lg transform transition-all duration-300 hover:shadow-xl",
  formTitle: "text-3xl font-bold text-[#6F4E37] mb-8 text-center",
  formSection: "mb-8 p-6 bg-white rounded-xl border border-orange-100 shadow-sm hover:shadow-md transition-all duration-300",
  sectionTitle: "text-xl font-semibold text-[#A0522D] mb-4 flex items-center gap-2",
  inputGroup: "space-y-4",
  label: "block text-sm font-medium text-[#6F4E37] mb-1.5 transition-colors duration-200",
  input: "block w-full px-4 py-3 bg-white border border-orange-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#FF8C42] focus:border-[#FF8C42] sm:text-sm transition-all duration-200 placeholder:text-orange-200",
  select: "block w-full px-4 py-3 bg-white border border-orange-200 rounded-lg shadow-sm focus:ring-2 focus:ring-[#FF8C42] focus:border-[#FF8C42] sm:text-sm transition-all duration-200",
  error: "text-sm text-red-600 mt-1.5 animate-fadeIn",
  button: "w-full px-6 py-3 bg-[#FF8C42] text-white font-semibold rounded-lg shadow-md hover:bg-[#FF7B2D] focus:outline-none focus:ring-2 focus:ring-[#FF8C42] focus:ring-offset-2 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
  buttonDisabled: "w-full px-6 py-3 bg-gray-300 text-gray-500 font-semibold rounded-lg cursor-not-allowed",
  loadingSpinner: "animate-spin h-5 w-5 text-white",
  icon: "h-5 w-5 text-[#FF8C42]"
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
};

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
      shippingMode: 'Sea FCL',
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
    const country = watch('originCountry') as keyof typeof airOriginAirports;
    if (!country) return null;

    if (shippingMode === 'Air' && airOriginAirports[country]) {
      return airOriginAirports[country].map((airport) => (
        <option key={airport} value={airport}>{airport}</option>
      ));
    } else if (shippingMode !== 'Air' && seaOriginPorts[country]) {
      return seaOriginPorts[country].map((port) => (
        <option key={port} value={port}>{port}</option>
      ));
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 via-orange-50 to-white">
      {/* Header with Icons */}
      <header className="bg-white shadow-lg border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center mb-4">
            <img src="/befach.jpg" alt="Befach International Logo" className="w-36 h-auto mb-2" style={{maxWidth:'200px'}} />
            <h1 className="text-3xl font-bold text-orange-800 mb-1">Befach International</h1>
            <p className="text-xl font-bold text-gray-800 text-center">Get Your Landed Price Quotation in Seconds Know Your True Cost, Instantly!</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Product Information Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-orange-100">
            <h2 className="text-2xl font-semibold text-orange-800 mb-6">Product Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={styles.inputGroup}>
                <label className={styles.label}>Product Name</label>
                <input
                  {...register('productName')}
                  className={styles.input}
                  placeholder="Enter product name"
                />
                {errors.productName && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={styles.error}
                  >
                    {errors.productName.message}
                  </motion.p>
                )}
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Invoice Value</label>
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
                      className={styles.input}
                      placeholder="Enter invoice value"
                    />
                  </div>
                  <div className="col-span-5">
                    <select
                      {...register('currency')}
                      className={styles.select}
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
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={styles.error}
                  >
                    {errors.productCost.message}
                  </motion.p>
                )}
              </div>
            </div>
          </div>

          {/* Shipping Details Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-orange-100">
            <h2 className="text-2xl font-semibold text-orange-800 mb-6">Shipping Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={styles.inputGroup}>
                <label className={styles.label}>Shipping Mode</label>
                <select
                  {...register('shippingMode')}
                  className={styles.select}
                >
                  <option value="Sea FCL">Sea FCL</option>
                  <option value="Sea LCL">Sea LCL</option>
                  <option value="Air">Air</option>
                </select>
                {errors.shippingMode && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={styles.error}
                  >
                    {errors.shippingMode.message}
                  </motion.p>
                )}
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>INCO Term</label>
                <select
                  {...register('incoTerm')}
                  className={styles.select}
                >
                  <option value="EXW">EXW</option>
                  <option value="FOB">FOB</option>
                  <option value="CIF">CIF</option>
                </select>
                {errors.incoTerm && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={styles.error}
                  >
                    {errors.incoTerm.message}
                  </motion.p>
                )}
              </div>
              {shippingMode === 'Sea FCL' && (
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Container Type</label>
                  <select
                    {...register('containerType')}
                    className={styles.select}
                  >
                    <option value="20 ft">20 ft</option>
                    <option value="40 ft">40 ft</option>
                  </select>
                  {errors.containerType && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={styles.error}
                    >
                      {errors.containerType.message}
                    </motion.p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Origin & Destination Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-orange-100">
            <h2 className="text-2xl font-semibold text-orange-800 mb-6">Origin & Destination</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={styles.inputGroup}>
                <label className={styles.label}>Origin Country</label>
                <select
                  {...register('originCountry')}
                  className={styles.select}
                >
                  <option value="">Select Origin Country</option>
                  {originCountries.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                {errors.originCountry && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={styles.error}
                  >
                    {errors.originCountry.message}
                  </motion.p>
                )}
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  {shippingMode === 'Air' ? 'Origin Airport' : 'Origin Port'}
                </label>
                <select
                  {...register('originPort')}
                  className={styles.select}
                >
                  <option value="">Select {shippingMode === 'Air' ? 'Origin Airport' : 'Origin Port'}</option>
                  {(() => {
                     const country = watch('originCountry');
                     if (!country || !isValidCountry(country)) return null;

                     if (shippingMode === 'Air') {
                        return airOriginAirports[country].map((airport) => (
                           <option key={airport} value={airport}>{airport}</option>
                        ));
                     } else {
                        return seaOriginPorts[country].map((port) => (
                           <option key={port} value={port}>{port}</option>
                        ));
                     }
                  })()}
                </select>
                {errors.originPort && (
                   <motion.p 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     className={styles.error}
                   >
                     {errors.originPort.message}
                   </motion.p>
                )}
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  {shippingMode === 'Air' ? 'Destination Airport' : 'Destination Port'}
                </label>
                <select
                  {...register('destinationPort')}
                  className={styles.select}
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
                   <motion.p 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     className={styles.error}
                   >
                     {errors.destinationPort.message}
                   </motion.p>
                )}
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>HSN Code</label>
                <select
                    {...register('hsnCode')}
                  className={styles.select}
                >
                  <option value="">Select HSN Code</option>
                  {hsnCodes.map((code) => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
                {errors.hsnCode && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={styles.error}
                  >
                    {errors.hsnCode.message}
                  </motion.p>
                )}
              </div>
            </div>
          </div>

          {/* Package Details Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-orange-100">
            <h2 className="text-2xl font-semibold text-orange-800 mb-6">Package Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={styles.inputGroup}>
                <label className={styles.label}>Gross Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('grossWeight', { valueAsNumber: true })}
                  className={styles.input}
                  placeholder="Enter gross weight"
                />
                {errors.grossWeight && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={styles.error}
                  >
                    {errors.grossWeight.message}
                  </motion.p>
                )}
              </div>
              {shippingMode === 'Sea FCL' || shippingMode === 'Sea LCL' ? (
                <>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Length (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('dimensions.length', { valueAsNumber: true })}
                      className={styles.input}
                      placeholder="Enter length"
                    />
                    {errors.dimensions?.length && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={styles.error}
                      >
                        {errors.dimensions.length.message}
                      </motion.p>
                    )}
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Width (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('dimensions.width', { valueAsNumber: true })}
                      className={styles.input}
                      placeholder="Enter width"
                    />
                    {errors.dimensions?.width && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={styles.error}
                      >
                        {errors.dimensions.width.message}
                      </motion.p>
                    )}
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Height (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('dimensions.height', { valueAsNumber: true })}
                      className={styles.input}
                      placeholder="Enter height"
                    />
                    {errors.dimensions?.height && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={styles.error}
                      >
                        {errors.dimensions.height.message}
                      </motion.p>
                    )}
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Quantity</label>
                    <input
                      type="number"
                      {...register('cartons', { valueAsNumber: true })}
                      className={styles.input}
                      placeholder="Enter quantity"
                    />
                    {errors.cartons && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={styles.error}
                      >
                        {errors.cartons.message}
                      </motion.p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Number of Cartons</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      {...register('cartons', { 
                        valueAsNumber: true,
                        validate: (value) => !isNaN(value) || 'Number of cartons must be a valid number'
                      })}
                      className={styles.input}
                      placeholder="Enter number of cartons"
                    />
                    {errors.cartons && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={styles.error}
                      >
                        {errors.cartons.message}
                      </motion.p>
                    )}
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Length (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      {...register('dimensions.length', { valueAsNumber: true })}
                      className={styles.input}
                      placeholder="Enter length"
                    />
                    {errors.dimensions?.length && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={styles.error}
                      >
                        {errors.dimensions.length.message}
                      </motion.p>
                    )}
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Width (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      {...register('dimensions.width', { valueAsNumber: true })}
                      className={styles.input}
                      placeholder="Enter width"
                    />
                    {errors.dimensions?.width && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={styles.error}
                      >
                        {errors.dimensions.width.message}
                      </motion.p>
                    )}
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Height (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      {...register('dimensions.height', { valueAsNumber: true })}
                      className={styles.input}
                      placeholder="Enter height"
                    />
                    {errors.dimensions?.height && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={styles.error}
                      >
                        {errors.dimensions.height.message}
                      </motion.p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Customer Information Section - Kept at the end */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-orange-100">
            <h2 className="text-2xl font-semibold text-orange-800 mb-6">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className={styles.inputGroup}>
                <label className={styles.label}>Customer Name</label>
                <input
                  {...register('customerName')}
                  className={styles.input}
                  placeholder="Enter customer name"
                />
                {errors.customerName && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={styles.error}
                  >
                    {errors.customerName.message}
                  </motion.p>
                )}
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Company Name</label>
                <input
                  {...register('companyName')}
                  className={styles.input}
                  placeholder="Enter company name"
                />
                {errors.companyName && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={styles.error}
                  >
                    {errors.companyName.message}
                  </motion.p>
                )}
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Contact Number</label>
                <input
                  type="tel"
                  {...register('contactNumber')}
                  className={styles.input}
                  placeholder="Enter 10-digit contact number"
                />
                {errors.contactNumber && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={styles.error}
                  >
                    {errors.contactNumber.message}
                  </motion.p>
                )}
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Email</label>
                <input
                  type="email"
                  {...register('email')}
                  className={styles.input}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={styles.error}
                  >
                    {errors.email.message}
                  </motion.p>
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
                  <svg className={styles.icon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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