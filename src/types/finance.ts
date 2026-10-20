export type OwnerTag = 'partner1' | 'partner2' | 'couple';
export type ExpenseNature = 'essential' | 'lifestyle' | 'savings';
export type PaymentMethod = 'pix_debit' | 'credit_card' | 'boleto' | 'cash';
export type TransactionType = 'income' | 'expense';

export interface CoupleProfile {
  partner1Name: string;
  partner2Name: string;
  coupleLabel: string;
  monthlyIncomeTarget: number;
  superfluousWarningPercent: number; // e.g., 25% of income
  accessPin?: string; // Senha/PIN de acesso do casal
}

export interface AuthSession {
  loggedUser: 'partner1' | 'partner2';
  loggedAt: string;
}

export interface CategoryBudget {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthlyLimit: number;
  defaultNature: ExpenseNature;
}

export interface FixedBillTemplate {
  id: string;
  name: string; // Ex: Parcela do Apto, Condomínio, Conta de Luz, Parcela do Carro...
  categoryId: string;
  expectedAmount: number;
  dueDay: number; // Dia de vencimento (1..31)
  owner: OwnerTag;
  paymentMethod: PaymentMethod;
  nature: ExpenseNature;
  active: boolean;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number; // Value of THIS month's occurrence (or installment amount)
  totalPurchaseAmount?: number; // Full price if installment
  date: string; // YYYY-MM-DD
  monthKey: string; // YYYY-MM
  type: TransactionType;
  categoryId: string;
  owner: OwnerTag;
  nature: ExpenseNature;
  paymentMethod: PaymentMethod;
  isRecurring?: boolean;
  fixedBillId?: string; // Links this transaction to a FixedBillTemplate in this month
  isPaid?: boolean;
  // Installment fields
  installmentGroupId?: string;
  installmentCurrent?: number;
  installmentTotal?: number;
  cardName?: string;
  notes?: string;
}

export interface AcquisitionGoal {
  id: string;
  title: string;
  category: 'eletronico' | 'casa' | 'viagem' | 'veiculo' | 'outro';
  targetAmount: number;
  savedAmount: number;
  cashDiscountPercent: number; // e.g., 10% discount if bought in cash
  maxInstallmentsInterestFree: number; // e.g., 10x sem juros
  priority: 'alta' | 'media' | 'baixa';
  targetDate?: string; // YYYY-MM
  notes?: string;
  createdAt: string;
}

export interface CloudConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  coupleSpaceId: string; // Shared room key between Renato & Wife
  enabled: boolean;
  lastSyncedAt?: string;
}

export interface AppStateData {
  profile: CoupleProfile;
  categories: CategoryBudget[];
  fixedBills: FixedBillTemplate[];
  transactions: Transaction[];
  goals: AcquisitionGoal[];
  updatedAt: string;
}
