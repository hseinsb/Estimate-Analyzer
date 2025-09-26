export interface Vehicle {
  year: number | null;
  make: string | null;
  model: string | null;
  vin: string | null;
}

export interface Totals {
  parts: number;
  // Individual labor breakdowns (new structure)
  bodyLabor?: number;
  paintLabor?: number;
  mechanicalLabor?: number;
  frameLabor?: number;
  totalLabor?: number;
  // Legacy labor field (for backward compatibility)
  labor?: number;
  paintSupplies: number;
  // Updated field names
  miscellaneous?: number;
  misc?: number; // Legacy
  otherCharges: number;
  subtotal: number;
  salesTax: number;
  grandTotal: number;
  customerPay: number; // Deductible
  insurancePay: number;
}

export interface Profits {
  estimateProfit: number;
  actualPartsCost: number | null;
  actualProfit: number | null;
}

export interface Estimate {
  id: string;
  jobNumber: string | null;
  customerName: string;
  claimNumber: string;
  insuranceCompany: string;
  vehicle: Vehicle;
  totals: Totals;
  profits: Profits;
  pdfUrl: string | null; // Always null on Spark plan
  parseConfidence: number;
  status: 'parsed' | 'needs_review' | 'error';
  createdAt: Date | null;
  updatedAt: Date | null;
  estimateDate?: string;
  preparedBy?: string;
  pageCount?: number;
  fileName?: string; // Original PDF filename for reference
  notes?: string; // User notes
}

export interface Upload {
  id: string;
  fileName: string;
  jobNumber?: string;
  notes?: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  error?: string;
  estimateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FilterOptions {
  dateRange?: {
    start: Date;
    end: Date;
  };
  insuranceCompany?: string;
  status?: string;
  searchTerm?: string;
}
