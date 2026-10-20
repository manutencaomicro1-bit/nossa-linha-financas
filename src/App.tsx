import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  Target,
  Sliders,
  Plus,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Sparkles,
  HeartHandshake,
  Home,
  LogOut,
  User,
} from 'lucide-react';
import {
  AcquisitionGoal,
  AppStateData,
  AuthSession,
  CategoryBudget,
  CloudConfig,
  CoupleProfile,
  FixedBillTemplate,
  Transaction,
} from './types/finance';
import {
  addMonthsToMonthKey,
  buildDemoSeedData,
  formatMonthLabel,
  getCurrentMonthKey,
  getEmptyData,
  getSupabaseClient,
  loadAuthSession,
  loadCloudConfig,
  loadLocalData,
  pullDataFromCloud,
  pushDataToCloud,
  saveAuthSession,
  saveCloudConfig,
  saveLocalData,
} from './services/storage';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { InstallmentsTimeline } from './components/InstallmentsTimeline';
import { AcquisitionPlanner } from './components/AcquisitionPlanner';
import { BudgetLimitsAndCloud } from './components/BudgetLimitsAndCloud';
import { NewTransactionModal } from './components/NewTransactionModal';
import { LoginScreen } from './components/LoginScreen';
import { FixedBillsChecklist } from './components/FixedBillsChecklist';

type TabKey =
  | 'dashboard'
  | 'fixed_bills'
  | 'transactions'
  | 'installments'
  | 'goals'
  | 'settings';

export function App() {
  const [appData, setAppData] = useState<AppStateData>(() => loadLocalData());
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>(() => loadCloudConfig());
  const [authSession, setAuthSession] = useState<AuthSession | null>(() =>
    loadAuthSession()
  );
  const [syncStatus, setSyncStatus] = useState<string>('Modo Local Ativo');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonthKey());
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [isNewTxOpen, setIsNewTxOpen] = useState<boolean>(false);

  // Save locally and optionally push to Supabase
  const persistData = useCallback(
    async (nextData: AppStateData, currentCloud = cloudConfig) => {
      const stamped: AppStateData = {
        ...nextData,
        updatedAt: new Date().toISOString(),
      };
      setAppData(stamped);
      saveLocalData(stamped);

      if (
        currentCloud.enabled &&
        currentCloud.supabaseUrl &&
        currentCloud.supabaseAnonKey
      ) {
        setSyncStatus('Sincronizando...');
        const res = await pushDataToCloud(currentCloud, stamped);
        if (res.ok) {
          setSyncStatus('☁️ Nuvem Sincronizada');
        } else {
          setSyncStatus(`⚠️ Erro Nuvem: ${res.error}`);
        }
      } else {
        setSyncStatus('💾 Salvo no Dispositivo');
      }
    },
    [cloudConfig]
  );

  // Initial pull and Realtime subscription when Cloud is enabled
  useEffect(() => {
    if (
      !cloudConfig.enabled ||
      !cloudConfig.supabaseUrl ||
      !cloudConfig.supabaseAnonKey
    ) {
      setSyncStatus('💾 Salvo no Dispositivo');
      return;
    }

    let isMounted = true;
    const syncFromCloud = async () => {
      setSyncStatus('Buscando na nuvem...');
      const res = await pullDataFromCloud(cloudConfig);
      if (!isMounted) return;
      if (res.ok && res.data) {
        setAppData(res.data);
        saveLocalData(res.data);
        setSyncStatus('☁️ Nuvem Sincronizada');
      } else if (res.ok && !res.data) {
        await pushDataToCloud(cloudConfig, appData);
        if (isMounted) setSyncStatus('☁️ Nuvem Sincronizada');
      } else {
        setSyncStatus(`⚠️ Erro: ${res.error}`);
      }
    };

    syncFromCloud();

    const client = getSupabaseClient(cloudConfig);
    if (!client) return;

    const channel = client
      .channel(`space_${cloudConfig.coupleSpaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'couple_spaces',
          filter: `space_id=eq.${cloudConfig.coupleSpaceId.trim()}`,
        },
        (payload: any) => {
          const remoteData = payload?.new?.payload as AppStateData | undefined;
          if (remoteData && remoteData.updatedAt !== appData.updatedAt) {
            setAppData(remoteData);
            saveLocalData(remoteData);
            setSyncStatus('☁️ Atualizado em Tempo Real');
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      client.removeChannel(channel);
    };
  }, [cloudConfig]);

  // Login / Logout handlers
  const handleLoginSuccess = (session: AuthSession, updatedSpaceId?: string) => {
    saveAuthSession(session);
    setAuthSession(session);
    if (updatedSpaceId && updatedSpaceId !== cloudConfig.coupleSpaceId) {
      const nextCloud = { ...cloudConfig, coupleSpaceId: updatedSpaceId };
      saveCloudConfig(nextCloud);
      setCloudConfig(nextCloud);
    }
  };

  const handleLogout = () => {
    saveAuthSession(null);
    setAuthSession(null);
  };

  // Fixed Bills handlers
  const handlePayFixedBill = (bill: FixedBillTemplate, actualAmount: number) => {
    const dueStr = String(bill.dueDay || 10).padStart(2, '0');
    const newTx: Transaction = {
      id: `tx_fb_${bill.id}_${selectedMonth}_${Date.now()}`,
      description: bill.name,
      amount: Number(actualAmount.toFixed(2)),
      date: `${selectedMonth}-${dueStr}`,
      monthKey: selectedMonth,
      type: 'expense',
      categoryId: bill.categoryId,
      owner: bill.owner,
      nature: bill.nature,
      paymentMethod: bill.paymentMethod,
      isRecurring: true,
      fixedBillId: bill.id,
      isPaid: true,
    };

    persistData({
      ...appData,
      transactions: [newTx, ...appData.transactions],
    });
  };

  const handleUnpayFixedBill = (txId: string) => {
    persistData({
      ...appData,
      transactions: appData.transactions.filter((t) => t.id !== txId),
    });
  };

  const handleLaunchAllPendingBills = () => {
    const monthTxs = appData.transactions.filter(
      (t) => t.monthKey === selectedMonth && t.type === 'expense'
    );
    const pendingBills = (appData.fixedBills || []).filter(
      (b) => b.active && !monthTxs.some((t) => t.fixedBillId === b.id)
    );
    if (pendingBills.length === 0) return;

    const created: Transaction[] = pendingBills.map((bill, idx) => {
      const dueStr = String(bill.dueDay || 10).padStart(2, '0');
      return {
        id: `tx_fb_${bill.id}_${selectedMonth}_${Date.now()}_${idx}`,
        description: bill.name,
        amount: bill.expectedAmount,
        date: `${selectedMonth}-${dueStr}`,
        monthKey: selectedMonth,
        type: 'expense',
        categoryId: bill.categoryId,
        owner: bill.owner,
        nature: bill.nature,
        paymentMethod: bill.paymentMethod,
        isRecurring: true,
        fixedBillId: bill.id,
        isPaid: true,
      };
    });

    persistData({
      ...appData,
      transactions: [...created, ...appData.transactions],
    });
  };

  const handleAddFixedBillTemplate = (bill: FixedBillTemplate) => {
    persistData({
      ...appData,
      fixedBills: [...(appData.fixedBills || []), bill],
    });
  };

  const handleUpdateFixedBillTemplate = (updatedBill: FixedBillTemplate) => {
    persistData({
      ...appData,
      fixedBills: (appData.fixedBills || []).map((b) =>
        b.id === updatedBill.id ? updatedBill : b
      ),
    });
  };

  const handleDeleteFixedBillTemplate = (billId: string) => {
    persistData({
      ...appData,
      fixedBills: (appData.fixedBills || []).filter((b) => b.id !== billId),
    });
  };

  // Transactions & Goals handlers
  const handleAddTransactions = (newTxs: Transaction[]) => {
    persistData({
      ...appData,
      transactions: [...newTxs, ...appData.transactions],
    });
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    persistData({
      ...appData,
      transactions: appData.transactions.map((t) =>
        t.id === updatedTx.id ? updatedTx : t
      ),
    });
  };

  const handleDeleteTransaction = (tx: Transaction, deleteAllInstallments: boolean) => {
    const nextTxs = appData.transactions.filter((item) => {
      if (deleteAllInstallments && tx.installmentGroupId) {
        return item.installmentGroupId !== tx.installmentGroupId;
      }
      return item.id !== tx.id;
    });
    persistData({
      ...appData,
      transactions: nextTxs,
    });
  };

  const handleAddGoal = (goal: AcquisitionGoal) => {
    persistData({
      ...appData,
      goals: [goal, ...appData.goals],
    });
  };

  const handleUpdateGoalSaved = (goalId: string, newSavedAmount: number) => {
    persistData({
      ...appData,
      goals: appData.goals.map((g) =>
        g.id === goalId ? { ...g, savedAmount: newSavedAmount } : g
      ),
    });
  };

  const handleDeleteGoal = (goalId: string) => {
    persistData({
      ...appData,
      goals: appData.goals.filter((g) => g.id !== goalId),
    });
  };

  const handleUpdateProfile = (profile: CoupleProfile) => {
    persistData({
      ...appData,
      profile,
    });
  };

  const handleUpdateCategories = (categories: CategoryBudget[]) => {
    persistData({
      ...appData,
      categories,
    });
  };

  const handleUpdateProfileAndCategories = (
    profile: CoupleProfile,
    categories: CategoryBudget[]
  ) => {
    persistData({
      ...appData,
      profile,
      categories,
    });
  };

  const handleSaveCloudConfig = (newCfg: CloudConfig) => {
    saveCloudConfig(newCfg);
    setCloudConfig(newCfg);
  };

  const handleManualSyncNow = async () => {
    await persistData(appData, cloudConfig);
  };

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(appData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nossa-linha-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (imported: AppStateData) => {
    persistData(imported);
  };

  const handleResetToEmpty = (currentDraftProfile?: CoupleProfile) => {
    const empty = getEmptyData(currentDraftProfile || appData.profile);
    persistData(empty);
  };

  const handleRestoreDemoData = () => {
    const demo = buildDemoSeedData();
    persistData(demo);
  };

  // Show LoginScreen if not authenticated
  if (!authSession) {
    return (
      <LoginScreen
        profile={appData.profile}
        cloudConfig={cloudConfig}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  const loggedUserName =
    authSession.loggedUser === 'partner1'
      ? appData.profile.partner1Name
      : appData.profile.partner2Name;

  // Count how many fixed bills are still pending in the selectedMonth
  const paidFixedBillIds = new Set(
    appData.transactions
      .filter((t) => t.monthKey === selectedMonth && t.fixedBillId)
      .map((t) => t.fixedBillId)
  );
  const pendingBillsCount = (appData.fixedBills || []).filter(
    (b) => b.active && !paidFixedBillIds.has(b.id)
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 md:pb-12">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Nomes do Casal */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  Nossa Linha
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-900 border border-slate-800 text-emerald-300">
                  <Sparkles className="w-3 h-3" /> {appData.profile.partner1Name} &{' '}
                  {appData.profile.partner2Name}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Controle Mensal, Contas Fixas & Planejador de Conquistas
              </p>
            </div>
          </div>

          {/* Seletor de Mês Central */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setSelectedMonth(addMonthsToMonthKey(selectedMonth, -1))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 text-xs sm:text-sm font-bold text-white min-w-[130px] text-center">
              {formatMonthLabel(selectedMonth)}
            </div>
            <button
              onClick={() => setSelectedMonth(addMonthsToMonthKey(selectedMonth, 1))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Usuário Logado + Status Nuvem + Botão Novo Gasto */}
          <div className="flex items-center gap-2">
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Olá, <strong>{loggedUserName}</strong>
              </span>
            </div>

            <button
              onClick={() => setActiveTab('settings')}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 transition"
            >
              <Cloud className="w-3.5 h-3.5 text-sky-400" />
              {syncStatus}
            </button>

            <button
              onClick={() => setIsNewTxOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Novo Gasto</span>
            </button>

            <button
              onClick={handleLogout}
              title={`Sair (${loggedUserName})`}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-300 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 hidden md:flex items-center gap-1 pt-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition ${
              activeTab === 'dashboard'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Radar & Visão do Mês
          </button>

          <button
            onClick={() => setActiveTab('fixed_bills')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition ${
              activeTab === 'fixed_bills'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-4 h-4" />
            Contas Fixas (Apto, Carro, Luz)
            {pendingBillsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950">
                {pendingBillsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition ${
              activeTab === 'transactions'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Extrato & Lançamentos
          </button>

          <button
            onClick={() => setActiveTab('installments')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition ${
              activeTab === 'installments'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Cartões & Parcelas Futuras
          </button>

          <button
            onClick={() => setActiveTab('goals')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition ${
              activeTab === 'goals'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="w-4 h-4" />
            Simulador de Aquisições & Metas
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition ${
              activeTab === 'settings'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Limites & Nuvem
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            transactions={appData.transactions}
            categories={appData.categories}
            profile={appData.profile}
            selectedMonth={selectedMonth}
            onNavigateTab={setActiveTab}
            onOpenNewTx={() => setIsNewTxOpen(true)}
          />
        )}

        {activeTab === 'fixed_bills' && (
          <FixedBillsChecklist
            fixedBills={appData.fixedBills || []}
            transactions={appData.transactions}
            categories={appData.categories}
            profile={appData.profile}
            selectedMonth={selectedMonth}
            onPayFixedBill={handlePayFixedBill}
            onUnpayFixedBill={handleUnpayFixedBill}
            onAddFixedBillTemplate={handleAddFixedBillTemplate}
            onUpdateFixedBillTemplate={handleUpdateFixedBillTemplate}
            onDeleteFixedBillTemplate={handleDeleteFixedBillTemplate}
            onLaunchAllPendingBills={handleLaunchAllPendingBills}
          />
        )}

        {activeTab === 'transactions' && (
          <Transactions
            transactions={appData.transactions}
            categories={appData.categories}
            profile={appData.profile}
            selectedMonth={selectedMonth}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenNewTx={() => setIsNewTxOpen(true)}
          />
        )}

        {activeTab === 'installments' && (
          <InstallmentsTimeline
            transactions={appData.transactions}
            categories={appData.categories}
            profile={appData.profile}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            onOpenNewTx={() => setIsNewTxOpen(true)}
          />
        )}

        {activeTab === 'goals' && (
          <AcquisitionPlanner
            goals={appData.goals}
            transactions={appData.transactions}
            profile={appData.profile}
            selectedMonth={selectedMonth}
            onAddGoal={handleAddGoal}
            onUpdateGoalSaved={handleUpdateGoalSaved}
            onDeleteGoal={handleDeleteGoal}
          />
        )}

        {activeTab === 'settings' && (
          <BudgetLimitsAndCloud
            profile={appData.profile}
            categories={appData.categories}
            cloudConfig={cloudConfig}
            syncStatus={syncStatus}
            onUpdateProfile={handleUpdateProfile}
            onUpdateCategories={handleUpdateCategories}
            onUpdateProfileAndCategories={handleUpdateProfileAndCategories}
            onSaveCloudConfig={handleSaveCloudConfig}
            onManualSyncNow={handleManualSyncNow}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onResetToEmpty={handleResetToEmpty}
            onRestoreDemoData={handleRestoreDemoData}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-1 py-1.5 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold ${
            activeTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Radar</span>
        </button>

        <button
          onClick={() => setActiveTab('fixed_bills')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold relative ${
            activeTab === 'fixed_bills' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Contas Fixas</span>
          {pendingBillsCount > 0 && (
            <span className="absolute top-0.5 right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-bold flex items-center justify-center">
              {pendingBillsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold ${
            activeTab === 'transactions' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span>Extrato</span>
        </button>

        <button
          onClick={() => setActiveTab('installments')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold ${
            activeTab === 'installments' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span>Parcelas</span>
        </button>

        <button
          onClick={() => setActiveTab('goals')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold ${
            activeTab === 'goals' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <Target className="w-5 h-5" />
          <span>Aquisições</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-semibold ${
            activeTab === 'settings' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <Sliders className="w-5 h-5" />
          <span>Ajustes</span>
        </button>
      </nav>

      {/* Modal de Novo Lançamento */}
      <NewTransactionModal
        isOpen={isNewTxOpen}
        onClose={() => setIsNewTxOpen(false)}
        onSaveTransactions={handleAddTransactions}
        categories={appData.categories}
        profile={appData.profile}
        selectedMonth={selectedMonth}
        defaultOwner={authSession.loggedUser}
      />
    </div>
  );
}
export default App;
