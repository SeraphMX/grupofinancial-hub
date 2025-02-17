// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'agent' | 'supervisor';
  createdAt: string;
}

// Credit Request Types
export interface PersonalCreditRequest {
  id: string;
  type: 'personal';
  applicantName: string;
  applicantId: string;
  income: number;
  amount: number;
  term: number;
  purpose: string;
  status: RequestStatus;
  assignedTo: string;
  createdAt: string;
  documents: Document[];
  communications: Communication[];
}

export interface BusinessCreditRequest {
  id: string;
  type: 'business';
  businessName: string;
  businessId: string;
  annualRevenue: number;
  amount: number;
  term: number;
  purpose: string;
  status: RequestStatus;
  assignedTo: string;
  createdAt: string;
  documents: Document[];
  communications: Communication[];
}

export type CreditRequest = PersonalCreditRequest | BusinessCreditRequest;

export type RequestStatus = 
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'processing';

export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface Communication {
  id: string;
  type: 'call' | 'email' | 'whatsapp';
  content: string;
  createdAt: string;
  createdBy: string;
}

// Credit Portfolio Types
export interface Credit {
  id: string;
  requestId: string;
  amount: number;
  term: number;
  interestRate: number;
  monthlyPayment: number;
  status: 'active' | 'completed' | 'defaulted';
  commission: number;
  approvedAt: string;
  nextPaymentDate: string;
}