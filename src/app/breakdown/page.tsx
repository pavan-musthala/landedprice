'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CostBreakdown, COMMON_CURRENCIES } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { formatCurrencyWithSymbol, getExchangeRates, getLastUpdateDate, getSupportedCurrencies } from '@/lib/exchangeRates';
import { 
  FREIGHT_PER_CBM_USD, 
  DESTINATION_TRUCKING_PER_CBM_LCL,
  DESTINATION_CLEARANCE_LCL,
  DELIVERY_ORDER_CHARGES_LCL,
  DESTINATION_CLEARANCE_FCL_USD,
  THC_FCL_USD,
  IHC_FCL_USD,
  DESTINATION_DELIVERY_CHARGES_FCL_20FT_USD,
  DESTINATION_DELIVERY_CHARGES_FCL_40FT_USD,
  DESTINATION_ORDER_CHARGES_FCL_USD,
  TRANSACTIONAL_CHARGES_PERCENTAGE,
  INCO_TERMS
} from '@/lib/calculations';
import Link from 'next/link';

function BreakdownContent() {
  const searchParams = useSearchParams();
  const [breakdown, setBreakdown] = useState<CostBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get the breakdown data from URL
        const breakdownData = searchParams.get('data');
        if (!breakdownData) {
          setError('No breakdown data found');
          return;
        }

        // Parse the breakdown data
        const parsedBreakdown = JSON.parse(decodeURIComponent(breakdownData)) as CostBreakdown;
        setBreakdown(parsedBreakdown);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load breakdown data');
      }
    };

    fetchData();
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-800">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!breakdown) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-orange-800 mb-6">Cost Breakdown</h1>
          
          {/* Customer Information */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600">Customer Name</span>
                <p className="font-medium">{breakdown.customerName || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-gray-600">Company Name</span>
                <p className="font-medium">{breakdown.companyName || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-gray-600">Contact Number</span>
                <p className="font-medium">{breakdown.contactNumber || 'Not provided'}</p>
              </div>
              <div>
                <span className="text-gray-600">Email</span>
                <p className="font-medium">{breakdown.email || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Product Information - Improved Layout */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <span className="text-gray-600 block mb-2">Product Name</span>
                <p className="font-medium text-lg">{breakdown.productName}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <span className="text-gray-600 block mb-2">Shipping Mode</span>
                <p className="font-medium text-lg">{breakdown.shippingMode}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <span className="text-gray-600 block mb-2">INCO Term</span>
                <p className="font-medium text-lg">{breakdown.incoTerm}</p>
              </div>
              {breakdown.details?.containerType && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="text-gray-600 block mb-2">Container Type</span>
                  <p className="font-medium text-lg">{breakdown.details.containerType}</p>
                </div>
              )}
            </div>
          </div>

          {/* Cost Calculation Breakdown */}
          <div className="space-y-6">
            {/* 1. Base Product Cost */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">1. Base Product Cost</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Product Cost (INR)</span>
                  <span className="font-medium">{formatCurrency(breakdown.productCostINR)}</span>
                </div>
              </div>
            </div>

            {/* 2. Freight and Shipping Charges */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">2. Freight and Shipping Charges</h3>
              <div className="space-y-4">
                {/* Base Freight */}
                <div className="border-b border-gray-200 pb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      {breakdown.shippingMode === 'Sea LCL' 
                        ? `Base Freight Cost (${breakdown.details?.chargeableCBM} CBM × $${FREIGHT_PER_CBM_USD})`
                        : 'Base Freight Cost'}
                    </span>
                    <span className="font-medium">{formatCurrency(breakdown.freightOnlyINR)}</span>
                  </div>
                </div>

                {/* Transactional Charges */}
                {breakdown.otherCharges.transactionalChargesINR && (
                  <div className="border-b border-gray-200 pb-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Transactional Charges (3% of Product Cost)</span>
                      <span className="font-medium">{formatCurrency(breakdown.otherCharges.transactionalChargesINR)}</span>
                    </div>
                  </div>
                )}

                {/* Air Specific Charges */}
                {breakdown.shippingMode === 'Air' && (
                  <>
                    {/* Destination Charges */}
                    <div className="border-b border-gray-200 pb-2">
                      <h4 className="text-md font-medium text-gray-900 mb-2">Destination Charges</h4>
                      <div className="space-y-2 pl-4">
                        {breakdown.otherCharges.destinationClearanceINR && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Destination Clearance</span>
                            <span className="font-medium">{formatCurrency(breakdown.otherCharges.destinationClearanceINR)}</span>
                          </div>
                        )}
                        {breakdown.otherCharges.destinationDeliveryChargesINR && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Destination Delivery Charges</span>
                            <span className="font-medium">{formatCurrency(breakdown.otherCharges.destinationDeliveryChargesINR)}</span>
                          </div>
                        )}
                        {breakdown.otherCharges.destinationOrderChargesINR && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Destination Order Charges</span>
                            <span className="font-medium">{formatCurrency(breakdown.otherCharges.destinationOrderChargesINR)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* LCL Specific Charges */}
                {breakdown.shippingMode === 'Sea LCL' && (
                  <>
                    {/* Destination Charges */}
                    <div className="border-b border-gray-200 pb-2">
                      <h4 className="text-md font-medium text-gray-900 mb-2">Destination Charges</h4>
                      <div className="space-y-2 pl-4">
                        {breakdown.otherCharges.destinationClearanceINR && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Destination Clearance</span>
                            <span className="font-medium">{formatCurrency(breakdown.otherCharges.destinationClearanceINR)}</span>
                          </div>
                        )}
                        {breakdown.otherCharges.destinationTruckingINR && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">
                              Destination Trucking ({breakdown.details?.chargeableCBM} CBM × ₹{DESTINATION_TRUCKING_PER_CBM_LCL})
                            </span>
                            <span className="font-medium">{formatCurrency(breakdown.otherCharges.destinationTruckingINR)}</span>
                          </div>
                        )}
                        {breakdown.otherCharges.deliveryOrderChargesINR && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Delivery Order Charges</span>
                            <span className="font-medium">{formatCurrency(breakdown.otherCharges.deliveryOrderChargesINR)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* FCL Specific Charges */}
                {breakdown.shippingMode === 'Sea FCL' && (
                  <>
                    {/* Handling Charges */}
                    <div className="border-b border-gray-200 pb-2">
                      <h4 className="text-md font-medium text-gray-900 mb-2">Handling Charges</h4>
                      <div className="space-y-2 pl-4">
                        {breakdown.otherCharges.thcINR && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Terminal Handling Charges (THC)</span>
                            <span className="font-medium">{formatCurrency(breakdown.otherCharges.thcINR)}</span>
                          </div>
                        )}
                        {breakdown.otherCharges.ihcINR && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Inland Handling Charges (IHC)</span>
                            <span className="font-medium">{formatCurrency(breakdown.otherCharges.ihcINR)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Destination Charges */}
                    <div className="border-b border-gray-200 pb-2">
                      <h4 className="text-md font-medium text-gray-900 mb-2">Destination Charges</h4>
                      <div className="space-y-2 pl-4">
                        {breakdown.otherCharges.destinationClearanceINR && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Destination Clearance</span>
                            <span className="font-medium">{formatCurrency(breakdown.otherCharges.destinationClearanceINR)}</span>
                          </div>
                        )}
                        {breakdown.otherCharges.destinationDeliveryChargesINR && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Destination Delivery Charges ({breakdown.details?.containerType})</span>
                            <span className="font-medium">{formatCurrency(breakdown.otherCharges.destinationDeliveryChargesINR)}</span>
                          </div>
                        )}
                        {breakdown.otherCharges.destinationOrderChargesINR && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Destination Order Charges</span>
                            <span className="font-medium">{formatCurrency(breakdown.otherCharges.destinationOrderChargesINR)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* INCO Term Charges */}
                {(breakdown.otherCharges.exwChargesINR || 
                  breakdown.otherCharges.fobChargesINR || 
                  breakdown.otherCharges.cifChargesINR) && (
                  <div className="border-b border-gray-200 pb-2">
                    <h4 className="text-md font-medium text-gray-900 mb-2">INCO Term Charges ({breakdown.incoTerm})</h4>
                    <div className="space-y-2 pl-4">
                      {breakdown.otherCharges.exwChargesINR && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">EXW Charges</span>
                          <span className="font-medium">{formatCurrency(breakdown.otherCharges.exwChargesINR)}</span>
                        </div>
                      )}
                      {breakdown.otherCharges.fobChargesINR && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">FOB Charges</span>
                          <span className="font-medium">{formatCurrency(breakdown.otherCharges.fobChargesINR)}</span>
                        </div>
                      )}
                      {breakdown.otherCharges.cifChargesINR && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">CIF Charges</span>
                          <span className="font-medium">{formatCurrency(breakdown.otherCharges.cifChargesINR)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Total Freight Summary */}
                <div className="bg-orange-50 p-3 rounded-md">
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-gray-900">Total Freight and Shipping Charges</span>
                    <span className="text-orange-800">{formatCurrency(breakdown.totalFreightINR)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CBM Information for LCL */}
            {breakdown.shippingMode === 'Sea LCL' && breakdown.details?.totalCBM !== undefined && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">CBM Information</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total CBM</span>
                    <span className="font-medium">{breakdown.details.totalCBM.toFixed(3)} CBM</span>
                  </div>
                  {breakdown.details.packageCBM && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Package CBM</span>
                      <span className="font-medium">{breakdown.details.packageCBM.toFixed(3)} CBM</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Customs Duty Calculation */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">3. Customs Duty Calculation</h3>
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Product Cost (INR)</span>
                    <span className="font-medium">{formatCurrency(breakdown.productCostINR)}</span>
                  </div>
                </div>
                <div className="border-b border-gray-200 pb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Freight Cost (INR)</span>
                    <span className="font-medium">{formatCurrency(breakdown.freightOnlyINR)}</span>
                  </div>
                </div>
                <div className="border-b border-gray-200 pb-2">
                  <div className="flex justify-between items-center font-medium">
                    <span className="text-gray-900">Assessable Value (Product Cost + Freight Cost)</span>
                    <span className="text-orange-800">{formatCurrency(breakdown.productCostINR + breakdown.freightOnlyINR)}</span>
                  </div>
                </div>
                <div className="border-b border-gray-200 pb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Duty Percentage</span>
                    <span className="font-medium">{breakdown.dutyPercentage}%</span>
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-md">
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-gray-900">Customs Duty Amount</span>
                    <span className="text-orange-800">{formatCurrency(breakdown.customsDutyINR)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Final Total */}
            <div className="bg-orange-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-orange-900 mb-4">4. Total Landed Cost Calculation</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900">Product Cost</span>
                  <span className="font-medium">{formatCurrency(breakdown.productCostINR)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-900">Total Freight and Shipping Charges</span>
                  <span className="font-medium">{formatCurrency(breakdown.totalFreightINR)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-900">Customs Duty</span>
                  <span className="font-medium">{formatCurrency(breakdown.customsDutyINR)}</span>
                </div>
                <div className="border-t border-orange-200 pt-3 mt-3">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span className="text-orange-900">Total Landed Cost</span>
                    <span className="text-orange-800">{formatCurrency(breakdown.totalLandedCostINR)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Container Requirements (only for Sea shipments) */}
            {(breakdown.shippingMode === 'Sea FCL' || breakdown.shippingMode === 'Sea LCL') && 
             breakdown.details?.packageCBM !== undefined && (
              <div className="bg-gray-50 p-4 rounded-lg mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Container Requirements</h3>
                <div className="space-y-4">
                  <div className="border-b border-gray-200 pb-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Single Package CBM</span>
                      <span className="font-medium">{breakdown.details.packageCBM.toFixed(2)} m³</span>
                    </div>
                  </div>
                  <div className="border-b border-gray-200 pb-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total CBM (All Packages)</span>
                      <span className="font-medium">{breakdown.details.totalCBM?.toFixed(2)} m³</span>
                    </div>
                  </div>
                  <div className="border-b border-gray-200 pb-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Packages per 20ft Container</span>
                      <span className="font-medium">{breakdown.details.packagesPer20FT || 0}</span>
                    </div>
                  </div>
                  <div className="border-b border-gray-200 pb-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Packages per 40ft Container</span>
                      <span className="font-medium">{breakdown.details.packagesPer40FT || 0}</span>
                    </div>
                  </div>
                  <div className="border-b border-gray-200 pb-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Required 20ft Containers</span>
                      <span className="font-medium">{breakdown.details.required20FT || 0}</span>
                    </div>
                  </div>
                  <div className="border-b border-gray-200 pb-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Required 40ft Containers</span>
                      <span className="font-medium">{breakdown.details.required40FT || 0}</span>
                    </div>
                  </div>
                  {breakdown.details.error && (
                    <div className="mt-2 p-2 bg-red-50 text-red-600 rounded">
                      {breakdown.details.error}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link 
            href="/"
            className="inline-block bg-brown-600 text-white px-8 py-3 rounded-lg hover:bg-brown-700 transition-colors shadow-md text-lg"
          >
            Calculate Another Cost
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BreakdownPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    }>
      <BreakdownContent />
    </Suspense>
  );
} 