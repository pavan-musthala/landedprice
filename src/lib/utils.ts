export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '₹0';
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}; 