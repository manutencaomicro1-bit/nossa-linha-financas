import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AppStateData,
  AuthSession,
  CategoryBudget,
  CloudConfig,
  CoupleProfile,
  FixedBillTemplate,
  Transaction,
  AcquisitionGoal,
} from '../types/finance';

const STORAGE_KEY = 'nossa_linha_app_data_v2';
const CLOUD_CONFIG_KEY = 'nossa_linha_cloud_config_v1';
const AUTH_SESSION_KEY = 'nossa_linha_auth_session_v1';

export function getCurrentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function addMonthsToMonthKey(monthKey: string, offset: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const date = new Date(y, m - 1 + offset, 1);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, '0');
  return `${ny}-${nm}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return `${months[(m - 1) % 12]} ${y}`;
}

export function formatShortMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[(m - 1) % 12]}/${String(y).slice(-2)}`;
}

export function buildCoupleSlug(partner1: string, partner2: string): string {
  const clean = (s: string) =>
    (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  const p1 = clean(partner1) || 'parceiro1';
  const p2 = clean(partner2) || 'parceiro2';
  const year = new Date().getFullYear();
  return `${p1}-e-${p2}-${year}`;
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

const DEFAULT_PROFILE: CoupleProfile = {
  partner1Name: 'Renato',
  partner2Name: 'Esposa',
  coupleLabel: 'Casal / Casa',
  monthlyIncomeTarget: 12000,
  superfluousWarningPercent: 25,
  accessPin: '25102020',
};

export const DEFAULT_CATEGORIES: CategoryBudget[] = [
  {
    id: 'cat_apto',
    name: 'Parcela do Apto / Financiamento',
    icon: 'Home',
    color: '#3b82f6',
    monthlyLimit: 2400,
    defaultNature: 'essential',
  },
  {
    id: 'cat_condominio',
    name: 'Condomínio & IPTU',
    icon: 'Building2',
    color: '#6366f1',
    monthlyLimit: 750,
    defaultNature: 'essential',
  },
  {
    id: 'cat_contas_casa',
    name: 'Luz, Água, Gás & Internet',
    icon: 'Zap',
    color: '#eab308',
    monthlyLimit: 650,
    defaultNature: 'essential',
  },
  {
    id: 'cat_carro_parcela',
    name: 'Parcela do Carro, Seguro & IPVA',
    icon: 'Car',
    color: '#f97316',
    monthlyLimit: 1450,
    defaultNature: 'essential',
  },
  {
    id: 'cat_combustivel',
    name: 'Combustível, Pedágio & Manutenção',
    icon: 'Wrench',
    color: '#f59e0b',
    monthlyLimit: 750,
    defaultNature: 'essential',
  },
  {
    id: 'cat_mercado',
    name: 'Supermercado, Açougue & Feira',
    icon: 'ShoppingCart',
    color: '#10b981',
    monthlyLimit: 1800,
    defaultNature: 'essential',
  },
  {
    id: 'cat_delivery',
    name: 'iFood, Delivery & Restaurantes',
    icon: 'Utensils',
    color: '#f43f5e',
    monthlyLimit: 750,
    defaultNature: 'lifestyle',
  },
  {
    id: 'cat_compras',
    name: 'Compras Pessoais & Impulso',
    icon: 'ShoppingBag',
    color: '#a855f7',
    monthlyLimit: 700,
    defaultNature: 'lifestyle',
  },
  {
    id: 'cat_assinaturas',
    name: 'Assinaturas, Streaming & Planos',
    icon: 'Tv',
    color: '#06b6d4',
    monthlyLimit: 250,
    defaultNature: 'lifestyle',
  },
  {
    id: 'cat_saude',
    name: 'Saúde, Farmácia & Academia',
    icon: 'HeartPulse',
    color: '#ec4899',
    monthlyLimit: 600,
    defaultNature: 'essential',
  },
  {
    id: 'cat_lazer',
    name: 'Passeios, Viagens & Lazer',
    icon: 'Sparkles',
    color: '#8b5cf6',
    monthlyLimit: 500,
    defaultNature: 'lifestyle',
  },
  {
    id: 'cat_metas',
    name: 'Reserva & Metas de Aquisição',
    icon: 'PiggyBank',
    color: '#14b8a6',
    monthlyLimit: 1400,
    defaultNature: 'savings',
  },
];

export const DEFAULT_FIXED_BILLS: FixedBillTemplate[] = [
  {
    id: 'fb_apto',
    name: 'Parcela do Apartamento (Financiamento)',
    categoryId: 'cat_apto',
    expectedAmount: 2250,
    dueDay: 10,
    owner: 'couple',
    paymentMethod: 'boleto',
    nature: 'essential',
    active: true,
  },
  {
    id: 'fb_condominio',
    name: 'Taxa de Condomínio',
    categoryId: 'cat_condominio',
    expectedAmount: 620,
    dueDay: 10,
    owner: 'couple',
    paymentMethod: 'boleto',
    nature: 'essential',
    active: true,
  },
  {
    id: 'fb_iptu',
    name: 'Parcela IPTU',
    categoryId: 'cat_condominio',
    expectedAmount: 120,
    dueDay: 15,
    owner: 'couple',
    paymentMethod: 'boleto',
    nature: 'essential',
    active: true,
  },
  {
    id: 'fb_carro',
    name: 'Parcela do Financiamento do Carro',
    categoryId: 'cat_carro_parcela',
    expectedAmount: 1180,
    dueDay: 12,
    owner: 'couple',
    paymentMethod: 'boleto',
    nature: 'essential',
    active: true,
  },
  {
    id: 'fb_seguro_carro',
    name: 'Seguro do Carro (Mensal)',
    categoryId: 'cat_carro_parcela',
    expectedAmount: 245,
    dueDay: 18,
    owner: 'partner1',
    paymentMethod: 'credit_card',
    nature: 'essential',
    active: true,
  },
  {
    id: 'fb_luz',
    name: 'Conta de Luz (Energia Elétrica)',
    categoryId: 'cat_contas_casa',
    expectedAmount: 285,
    dueDay: 15,
    owner: 'couple',
    paymentMethod: 'pix_debit',
    nature: 'essential',
    active: true,
  },
  {
    id: 'fb_agua_gas',
    name: 'Água & Gás Encanado',
    categoryId: 'cat_contas_casa',
    expectedAmount: 135,
    dueDay: 15,
    owner: 'couple',
    paymentMethod: 'pix_debit',
    nature: 'essential',
    active: true,
  },
  {
    id: 'fb_internet',
    name: 'Internet Fibra + Planos de Celular',
    categoryId: 'cat_contas_casa',
    expectedAmount: 199,
    dueDay: 20,
    owner: 'couple',
    paymentMethod: 'pix_debit',
    nature: 'essential',
    active: true,
  },
  {
    id: 'fb_academia',
    name: 'Academia / Saúde Casal',
    categoryId: 'cat_saude',
    expectedAmount: 260,
    dueDay: 8,
    owner: 'couple',
    paymentMethod: 'credit_card',
    nature: 'essential',
    active: true,
  },
  {
    id: 'fb_streaming',
    name: 'Pacote Streamings (Netflix, Spotify, Prime)',
    categoryId: 'cat_assinaturas',
    expectedAmount: 149,
    dueDay: 10,
    owner: 'couple',
    paymentMethod: 'credit_card',
    nature: 'lifestyle',
    active: true,
  },
];

export function buildDemoSeedData(): AppStateData {
  const currentMonth = getCurrentMonthKey();
  const next1 = addMonthsToMonthKey(currentMonth, 1);
  const next2 = addMonthsToMonthKey(currentMonth, 2);
  const next3 = addMonthsToMonthKey(currentMonth, 3);
  const prev1 = addMonthsToMonthKey(currentMonth, -1);

  const transactions: Transaction[] = [
    // Receitas do mês atual
    {
      id: 'tx_inc_1',
      description: 'Salário / Renda Principal Renato',
      amount: 7200,
      date: `${currentMonth}-05`,
      monthKey: currentMonth,
      type: 'income',
      categoryId: 'cat_apto',
      owner: 'partner1',
      nature: 'essential',
      paymentMethod: 'pix_debit',
      isRecurring: true,
    },
    {
      id: 'tx_inc_2',
      description: 'Salário / Renda Esposa',
      amount: 5300,
      date: `${currentMonth}-05`,
      monthKey: currentMonth,
      type: 'income',
      categoryId: 'cat_apto',
      owner: 'partner2',
      nature: 'essential',
      paymentMethod: 'pix_debit',
      isRecurring: true,
    },
    // Contas Fixas já pagas no mês de exemplo
    {
      id: 'tx_fb_apto',
      description: 'Parcela do Apartamento (Financiamento)',
      amount: 2250,
      date: `${currentMonth}-10`,
      monthKey: currentMonth,
      type: 'expense',
      categoryId: 'cat_apto',
      owner: 'couple',
      nature: 'essential',
      paymentMethod: 'boleto',
      isRecurring: true,
      fixedBillId: 'fb_apto',
      isPaid: true,
    },
    {
      id: 'tx_fb_cond',
      description: 'Taxa de Condomínio',
      amount: 620,
      date: `${currentMonth}-10`,
      monthKey: currentMonth,
      type: 'expense',
      categoryId: 'cat_condominio',
      owner: 'couple',
      nature: 'essential',
      paymentMethod: 'boleto',
      isRecurring: true,
      fixedBillId: 'fb_condominio',
      isPaid: true,
    },
    {
      id: 'tx_fb_carro',
      description: 'Parcela do Financiamento do Carro',
      amount: 1180,
      date: `${currentMonth}-12`,
      monthKey: currentMonth,
      type: 'expense',
      categoryId: 'cat_carro_parcela',
      owner: 'couple',
      nature: 'essential',
      paymentMethod: 'boleto',
      isRecurring: true,
      fixedBillId: 'fb_carro',
      isPaid: true,
    },
    {
      id: 'tx_fb_luz',
      description: 'Conta de Luz (Energia Elétrica)',
      amount: 292,
      date: `${currentMonth}-15`,
      monthKey: currentMonth,
      type: 'expense',
      categoryId: 'cat_contas_casa',
      owner: 'couple',
      nature: 'essential',
      paymentMethod: 'pix_debit',
      isRecurring: true,
      fixedBillId: 'fb_luz',
      isPaid: true,
    },
    {
      id: 'tx_fb_internet',
      description: 'Internet Fibra + Planos de Celular',
      amount: 199,
      date: `${currentMonth}-20`,
      monthKey: currentMonth,
      type: 'expense',
      categoryId: 'cat_contas_casa',
      owner: 'couple',
      nature: 'essential',
      paymentMethod: 'pix_debit',
      isRecurring: true,
      fixedBillId: 'fb_internet',
      isPaid: true,
    },
    // Supermercado
    {
      id: 'tx_exp_3',
      description: 'Compra do Mês Atacadão',
      amount: 1180,
      date: `${currentMonth}-08`,
      monthKey: currentMonth,
      type: 'expense',
      categoryId: 'cat_mercado',
      owner: 'couple',
      nature: 'essential',
      paymentMethod: 'pix_debit',
    },
    {
      id: 'tx_exp_4',
      description: 'Hortifruti, Açougue e Padaria',
      amount: 390,
      date: `${currentMonth}-14`,
      monthKey: currentMonth,
      type: 'expense',
      categoryId: 'cat_mercado',
      owner: 'partner2',
      nature: 'essential',
      paymentMethod: 'credit_card',
      cardName: 'Nubank',
    },
    // Despesas onde "estão perdendo a linha" (Delivery & Impulso)
    {
      id: 'tx_exp_5',
      description: 'iFood — Jantar Japonês Sexta',
      amount: 215,
      date: `${currentMonth}-07`,
      monthKey: currentMonth,
      type: 'expense',
      categoryId: 'cat_delivery',
      owner: 'couple',
      nature: 'lifestyle',
      paymentMethod: 'credit_card',
      cardName: 'Nubank',
    },
    {
      id: 'tx_exp_6',
      description: 'iFood — Hambúrguer & Sobremesa Domingo',
      amount: 168,
      date: `${currentMonth}-09`,
      monthKey: currentMonth,
      type: 'expense',
      categoryId: 'cat_delivery',
      owner: 'partner1',
      nature: 'lifestyle',
      paymentMethod: 'credit_card',
      cardName: 'Nubank',
    },
    {
      id: 'tx_exp_7',
      description: 'Almoço Restaurante Final de Semana',
      amount: 290,
      date: `${currentMonth}-15`,
      monthKey: currentMonth,
      type: 'expense',
      categoryId: 'cat_delivery',
      owner: 'couple',
      nature: 'lifestyle',
      paymentMethod: 'credit_card',
      cardName: 'Itaú',
    },
    {
      id: 'tx_exp_8',
      description: 'Pedidos Rápidos iFood / Cafés na Semana',
      amount: 195,
      date: `${currentMonth}-18`,
      monthKey: currentMonth,
      type: 'expense',
      categoryId: 'cat_delivery',
      owner: 'partner2',
      nature: 'lifestyle',
      paymentMethod: 'credit_card',
      cardName: 'Nubank',
    },
    // Combustível
    {
      id: 'tx_exp_9',
      description: 'Tanque Cheio Combustível + Pedágios',
      amount: 540,
      date: `${currentMonth}-12`,
      monthKey: currentMonth,
      type: 'expense',
      categoryId: 'cat_combustivel',
      owner: 'partner1',
      nature: 'essential',
      paymentMethod: 'credit_card',
      cardName: 'Itaú',
    },
    // Compras Parceladas no Cartão (Mostrando comprometimento futuro)
    {
      id: 'tx_inst_a_1',
      description: 'Roupas e Tênis Shopping',
      amount: 320,
      totalPurchaseAmount: 960,
      date: `${prev1}-15`,
      monthKey: currentMonth,
      type: 'expense',
      categoryId: 'cat_compras',
      owner: 'partner2',
      nature: 'lifestyle',
      paymentMethod: 'credit_card',
      cardName: 'Nubank',
      installmentGroupId: 'grp_roupas',
      installmentCurrent: 2,
      installmentTotal: 3,
    },
    {
      id: 'tx_inst_a_2',
      description: 'Roupas e Tênis Shopping',
      amount: 320,
      totalPurchaseAmount: 960,
      date: `${prev1}-15`,
      monthKey: next1,
      type: 'expense',
      categoryId: 'cat_compras',
      owner: 'partner2',
      nature: 'lifestyle',
      paymentMethod: 'credit_card',
      cardName: 'Nubank',
      installmentGroupId: 'grp_roupas',
      installmentCurrent: 3,
      installmentTotal: 3,
    },
    {
      id: 'tx_inst_b_1',
      description: 'Revisão e Pneus do Carro',
      amount: 450,
      totalPurchaseAmount: 1800,
      date: `${prev1}-20`,
      monthKey: currentMonth,
      type: 'expense',
      categoryId: 'cat_combustivel',
      owner: 'couple',
      nature: 'essential',
      paymentMethod: 'credit_card',
      cardName: 'Itaú',
      installmentGroupId: 'grp_pneus',
      installmentCurrent: 2,
      installmentTotal: 4,
    },
    {
      id: 'tx_inst_b_2',
      description: 'Revisão e Pneus do Carro',
      amount: 450,
      totalPurchaseAmount: 1800,
      date: `${prev1}-20`,
      monthKey: next1,
      type: 'expense',
      categoryId: 'cat_combustivel',
      owner: 'couple',
      nature: 'essential',
      paymentMethod: 'credit_card',
      cardName: 'Itaú',
      installmentGroupId: 'grp_pneus',
      installmentCurrent: 3,
      installmentTotal: 4,
    },
    {
      id: 'tx_inst_b_3',
      description: 'Revisão e Pneus do Carro',
      amount: 450,
      totalPurchaseAmount: 1800,
      date: `${prev1}-20`,
      monthKey: next2,
      type: 'expense',
      categoryId: 'cat_combustivel',
      owner: 'couple',
      nature: 'essential',
      paymentMethod: 'credit_card',
      cardName: 'Itaú',
      installmentGroupId: 'grp_pneus',
      installmentCurrent: 4,
      installmentTotal: 4,
    },
    {
      id: 'tx_inst_c_1',
      description: 'Compras Mercado Livre / Eletro',
      amount: 280,
      totalPurchaseAmount: 1120,
      date: `${currentMonth}-04`,
      monthKey: currentMonth,
      type: 'expense',
      categoryId: 'cat_compras',
      owner: 'partner1',
      nature: 'lifestyle',
      paymentMethod: 'credit_card',
      cardName: 'Nubank',
      installmentGroupId: 'grp_gadget',
      installmentCurrent: 1,
      installmentTotal: 4,
    },
    {
      id: 'tx_inst_c_2',
      description: 'Compras Mercado Livre / Eletro',
      amount: 280,
      totalPurchaseAmount: 1120,
      date: `${currentMonth}-04`,
      monthKey: next1,
      type: 'expense',
      categoryId: 'cat_compras',
      owner: 'partner1',
      nature: 'lifestyle',
      paymentMethod: 'credit_card',
      cardName: 'Nubank',
      installmentGroupId: 'grp_gadget',
      installmentCurrent: 2,
      installmentTotal: 4,
    },
    {
      id: 'tx_inst_c_3',
      description: 'Compras Mercado Livre / Eletro',
      amount: 280,
      totalPurchaseAmount: 1120,
      date: `${currentMonth}-04`,
      monthKey: next2,
      type: 'expense',
      categoryId: 'cat_compras',
      owner: 'partner1',
      nature: 'lifestyle',
      paymentMethod: 'credit_card',
      cardName: 'Nubank',
      installmentGroupId: 'grp_gadget',
      installmentCurrent: 3,
      installmentTotal: 4,
    },
    {
      id: 'tx_inst_c_4',
      description: 'Compras Mercado Livre / Eletro',
      amount: 280,
      totalPurchaseAmount: 1120,
      date: `${currentMonth}-04`,
      monthKey: next3,
      type: 'expense',
      categoryId: 'cat_compras',
      owner: 'partner1',
      nature: 'lifestyle',
      paymentMethod: 'credit_card',
      cardName: 'Nubank',
      installmentGroupId: 'grp_gadget',
      installmentCurrent: 4,
      installmentTotal: 4,
    },
    // Reserva do mês
    {
      id: 'tx_sav_1',
      description: 'Aporte Caixinha das Metas do Casal',
      amount: 1000,
      date: `${currentMonth}-06`,
      monthKey: currentMonth,
      type: 'expense',
      categoryId: 'cat_metas',
      owner: 'couple',
      nature: 'savings',
      paymentMethod: 'pix_debit',
    },
  ];

  const goals: AcquisitionGoal[] = [
    {
      id: 'goal_1',
      title: 'Sofá Retrátil Novo + Smart TV 65"',
      category: 'casa',
      targetAmount: 6800,
      savedAmount: 2400,
      cashDiscountPercent: 12,
      maxInstallmentsInterestFree: 10,
      priority: 'alta',
      targetDate: addMonthsToMonthKey(currentMonth, 4),
      notes: 'Queremos trocar antes das festas de fim de ano. À vista no PIX tem 12% de desconto.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'goal_2',
      title: 'Viagem de Férias do Casal (7 dias)',
      category: 'viagem',
      targetAmount: 9500,
      savedAmount: 3100,
      cashDiscountPercent: 8,
      maxInstallmentsInterestFree: 6,
      priority: 'media',
      targetDate: addMonthsToMonthKey(currentMonth, 7),
      notes: 'Passagens + Resort / Hospedagem e passeios.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'goal_3',
      title: 'Lava-louças Inox 14 Serviços',
      category: 'eletronico',
      targetAmount: 3400,
      savedAmount: 1500,
      cashDiscountPercent: 10,
      maxInstallmentsInterestFree: 10,
      priority: 'alta',
      targetDate: addMonthsToMonthKey(currentMonth, 2),
      notes: 'Esperar acabar a parcela das roupas para caber folgado no orçamento.',
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    profile: DEFAULT_PROFILE,
    categories: DEFAULT_CATEGORIES,
    fixedBills: DEFAULT_FIXED_BILLS,
    transactions,
    goals,
    updatedAt: new Date().toISOString(),
  };
}

export function loadLocalData(): AppStateData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = buildDemoSeedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as AppStateData;
    if (!parsed.fixedBills) {
      parsed.fixedBills = DEFAULT_FIXED_BILLS;
    }
    if (!parsed.profile.accessPin || parsed.profile.accessPin === '1234') {
      parsed.profile.accessPin = '25102020';
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return buildDemoSeedData();
  }
}

export function saveLocalData(data: AppStateData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Erro ao salvar no LocalStorage:', e);
  }
}

export function getEmptyData(keepProfile?: CoupleProfile): AppStateData {
  const zeroedCategories = DEFAULT_CATEGORIES.map((c) => ({
    ...c,
    monthlyLimit: 0,
  }));

  return {
    profile: {
      partner1Name: keepProfile?.partner1Name || 'Renato',
      partner2Name: keepProfile?.partner2Name || 'Esposa',
      coupleLabel: keepProfile?.coupleLabel || 'Casal / Casa',
      monthlyIncomeTarget: 0,
      superfluousWarningPercent: keepProfile?.superfluousWarningPercent || 25,
      accessPin: keepProfile?.accessPin || '25102020',
    },
    categories: zeroedCategories,
    fixedBills: [],
    transactions: [],
    goals: [],
    updatedAt: new Date().toISOString(),
  };
}

export function loadAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession | null): void {
  if (!session) {
    localStorage.removeItem(AUTH_SESSION_KEY);
  } else {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  }
}

export function loadCloudConfig(): CloudConfig {
  try {
    const raw = localStorage.getItem(CLOUD_CONFIG_KEY);
    if (!raw) {
      return {
        supabaseUrl: '',
        supabaseAnonKey: '',
        coupleSpaceId: 'renato-e-esposa-2026',
        enabled: false,
      };
    }
    return JSON.parse(raw) as CloudConfig;
  } catch {
    return {
      supabaseUrl: '',
      supabaseAnonKey: '',
      coupleSpaceId: 'renato-e-esposa-2026',
      enabled: false,
    };
  }
}

export function saveCloudConfig(config: CloudConfig): void {
  localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
}

let supabaseInstance: SupabaseClient | null = null;
let cachedConfigKey = '';

export function getSupabaseClient(config: CloudConfig): SupabaseClient | null {
  if (!config.enabled || !config.supabaseUrl || !config.supabaseAnonKey) {
    return null;
  }
  const key = `${config.supabaseUrl}|${config.supabaseAnonKey}`;
  if (!supabaseInstance || cachedConfigKey !== key) {
    try {
      supabaseInstance = createClient(config.supabaseUrl.trim(), config.supabaseAnonKey.trim());
      cachedConfigKey = key;
    } catch (e) {
      console.error('Erro ao inicializar Supabase:', e);
      return null;
    }
  }
  return supabaseInstance;
}

export async function pushDataToCloud(config: CloudConfig, data: AppStateData): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { ok: false, error: 'Cliente Supabase não configurado' };

  try {
    const { error } = await client
      .from('couple_spaces')
      .upsert(
        {
          space_id: config.coupleSpaceId.trim(),
          payload: data,
          updated_at: data.updatedAt,
        },
        { onConflict: 'space_id' }
      );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Falha de conexão com Supabase' };
  }
}

export async function pullDataFromCloud(config: CloudConfig): Promise<{ ok: boolean; data?: AppStateData; error?: string }> {
  const client = getSupabaseClient(config);
  if (!client) return { ok: false, error: 'Cliente Supabase não configurado' };

  try {
    const { data, error } = await client
      .from('couple_spaces')
      .select('payload, updated_at')
      .eq('space_id', config.coupleSpaceId.trim())
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!data || !data.payload) return { ok: true, data: undefined };
    return { ok: true, data: data.payload as AppStateData };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Falha ao buscar dados na nuvem' };
  }
}
