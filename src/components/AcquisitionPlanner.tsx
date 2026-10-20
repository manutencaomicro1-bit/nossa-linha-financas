import React, { useState } from 'react';
import {
  Target,
  Calculator,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  PiggyBank,
  CreditCard,
  Banknote,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import {
  AcquisitionGoal,
  CoupleProfile,
  Transaction,
} from '../types/finance';
import {
  addMonthsToMonthKey,
  formatBRL,
  formatShortMonthLabel,
} from '../services/storage';

interface AcquisitionPlannerProps {
  goals: AcquisitionGoal[];
  transactions: Transaction[];
  profile: CoupleProfile;
  selectedMonth: string;
  onAddGoal: (goal: AcquisitionGoal) => void;
  onUpdateGoalSaved: (goalId: string, newSavedAmount: number) => void;
  onDeleteGoal: (goalId: string) => void;
}

export const AcquisitionPlanner: React.FC<AcquisitionPlannerProps> = ({
  goals,
  transactions,
  profile,
  selectedMonth,
  onAddGoal,
  onUpdateGoalSaved,
  onDeleteGoal,
}) => {
  // Simulator state
  const [simTitle, setSimTitle] = useState('Geladeira Inverter / Eletrodoméstico');
  const [simPriceStr, setSimPriceStr] = useState('4200');
  const [simSavedStr, setSimSavedStr] = useState('800');
  const [simDiscountStr, setSimDiscountStr] = useState('10');
  const [simInstallments, setSimInstallments] = useState(10);
  const [simPriority, setSimPriority] = useState<'alta' | 'media' | 'baixa'>('alta');
  const [simCategory, setSimCategory] = useState<AcquisitionGoal['category']>('casa');

  const [depositInputs, setDepositInputs] = useState<Record<string, string>>({});

  // Calculate current month surplus and future installment relief
  const monthTxs = transactions.filter((t) => t.monthKey === selectedMonth);
  const monthIncome =
    monthTxs.filter((t) => t.type === 'income').reduce((a, b) => a + b.amount, 0) ||
    profile.monthlyIncomeTarget;

  const monthExpensesExcludingSavings = monthTxs
    .filter((t) => t.type === 'expense' && t.nature !== 'savings')
    .reduce((a, b) => a + b.amount, 0);

  const monthLifestyleExpenses = monthTxs
    .filter((t) => t.type === 'expense' && t.nature === 'lifestyle')
    .reduce((a, b) => a + b.amount, 0);

  // Free monthly cashflow available for goals/installments
  const monthlyFreeCashflow = Math.max(0, monthIncome - monthExpensesExcludingSavings);
  // Safe commitment limit (60% of free cashflow so the couple still has breathing room)
  const safeMonthlyCapacity = monthlyFreeCashflow * 0.65;

  // Check installment relief in +1 and +2 months
  const instThisMonth = monthTxs
    .filter((t) => t.type === 'expense' && t.installmentTotal && t.installmentTotal > 1)
    .reduce((a, b) => a + b.amount, 0);

  const next1Key = addMonthsToMonthKey(selectedMonth, 1);
  const next2Key = addMonthsToMonthKey(selectedMonth, 2);

  const instNext1 = transactions
    .filter(
      (t) =>
        t.monthKey === next1Key &&
        t.type === 'expense' &&
        t.installmentTotal &&
        t.installmentTotal > 1
    )
    .reduce((a, b) => a + b.amount, 0);

  const instNext2 = transactions
    .filter(
      (t) =>
        t.monthKey === next2Key &&
        t.type === 'expense' &&
        t.installmentTotal &&
        t.installmentTotal > 1
    )
    .reduce((a, b) => a + b.amount, 0);

  const reliefIn2Months = Math.max(0, instThisMonth - instNext2);

  // Simulator calculations
  const simPrice = parseFloat(simPriceStr.replace(',', '.')) || 0;
  const simSaved = parseFloat(simSavedStr.replace(',', '.')) || 0;
  const simDiscount = parseFloat(simDiscountStr.replace(',', '.')) || 0;

  const cashPriceWithDiscount = simPrice * (1 - simDiscount / 100);
  const remainingForCash = Math.max(0, cashPriceWithDiscount - simSaved);
  const discountMoneySaved = simPrice - cashPriceWithDiscount;

  // Option A: Save monthly to buy in cash
  const monthlySaveRecommended = Math.max(200, safeMonthlyCapacity);
  const monthsToSaveForCash =
    remainingForCash > 0 ? Math.ceil(remainingForCash / monthlySaveRecommended) : 0;

  // Option B: Buy now in installments (using saved amount as down payment if desired, or full price)
  const financedAmount = Math.max(0, simPrice - simSaved);
  const installmentValue =
    simInstallments > 0 ? financedAmount / simInstallments : financedAmount;

  const fitsNowComfortably = installmentValue <= safeMonthlyCapacity;
  const fitsNowTight =
    installmentValue > safeMonthlyCapacity && installmentValue <= monthlyFreeCashflow;
  const fitsIn2Months = installmentValue <= safeMonthlyCapacity + reliefIn2Months;

  const handleCreateGoalFromSimulator = () => {
    if (!simTitle.trim() || simPrice <= 0) return;
    const newGoal: AcquisitionGoal = {
      id: `goal_${Date.now()}`,
      title: simTitle.trim(),
      category: simCategory,
      targetAmount: simPrice,
      savedAmount: simSaved,
      cashDiscountPercent: simDiscount,
      maxInstallmentsInterestFree: simInstallments,
      priority: simPriority,
      targetDate: addMonthsToMonthKey(selectedMonth, Math.max(1, monthsToSaveForCash)),
      createdAt: new Date().toISOString(),
    };
    onAddGoal(newGoal);
  };

  const loadGoalIntoSimulator = (g: AcquisitionGoal) => {
    setSimTitle(g.title);
    setSimPriceStr(String(g.targetAmount));
    setSimSavedStr(String(g.savedAmount));
    setSimDiscountStr(String(g.cashDiscountPercent));
    setSimInstallments(g.maxInstallmentsInterestFree || 10);
    setSimPriority(g.priority);
    setSimCategory(g.category);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* SIMULADOR INTERATIVO "CABE NO BOLSO?" */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Simulador de Aquisição: "Cabe no Nosso Bolso?"
                </h2>
                <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Planejamento Inteligente
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Teste qualquer compra antes de passar o cartão: compare comprar à vista com desconto vs. parcelar sem apertar o mês
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Formulário do Simulador (5 colunas) */}
          <div className="lg:col-span-5 space-y-4 bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                O que vocês querem comprar / conquistar?
              </label>
              <input
                type="text"
                value={simTitle}
                onChange={(e) => setSimTitle(e.target.value)}
                placeholder="Ex: Sofá Novo, Troca de Celular, Viagem..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Preço Total (R$)
                </label>
                <input
                  type="number"
                  value={simPriceStr}
                  onChange={(e) => setSimPriceStr(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Já temos guardado (R$)
                </label>
                <input
                  type="number"
                  value={simSavedStr}
                  onChange={(e) => setSimSavedStr(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Desconto à Vista / PIX (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={simDiscountStr}
                  onChange={(e) => setSimDiscountStr(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Parcelamento Sem Juros
                </label>
                <select
                  value={simInstallments}
                  onChange={(e) => setSimInstallments(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {[2, 3, 4, 5, 6, 8, 10, 12, 18, 24].map((n) => (
                    <option key={n} value={n}>
                      Em {n}x no cartão
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Categoria do Desejo
                </label>
                <select
                  value={simCategory}
                  onChange={(e) => setSimCategory(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="casa">🏠 Casa & Móveis</option>
                  <option value="eletronico">💻 Eletrônicos</option>
                  <option value="viagem">✈️ Viagem & Lazer</option>
                  <option value="veiculo">🚗 Veículo</option>
                  <option value="outro">✨ Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Prioridade do Casal
                </label>
                <select
                  value={simPriority}
                  onChange={(e) => setSimPriority(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="alta">🔥 Alta Prioridade</option>
                  <option value="media">⭐ Média Prioridade</option>
                  <option value="baixa">🌱 Baixa Prioridade</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateGoalFromSimulator}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Salvar na Lista de Metas do Casal
            </button>
          </div>

          {/* Resultado do Diagnóstico de Compra (7 colunas) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Barra de Fôlego Atual do Casal */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400">
                  Fôlego Mensal Seguro do Casal (65% da sobra antes de reservas):
                </span>
                <div className="text-lg font-extrabold text-emerald-300">
                  {formatBRL(safeMonthlyCapacity)} / mês
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">
                  Alívio de parcelas em {formatShortMonthLabel(next2Key)}:
                </span>
                <div className="text-sm font-bold text-violet-300">
                  + {formatBRL(reliefIn2Months)}/mês liberados
                </div>
              </div>
            </div>

            {/* Comparativo Lado a Lado: Opção 1 (À Vista Planejado) vs Opção 2 (Parcelado) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Estratégia 1: Comprar à Vista com Desconto */}
              <div className="bg-slate-950/90 border border-emerald-500/40 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <Banknote className="w-4 h-4" /> Caminho 1: Juntar & Comprar à Vista
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                    Economia de {formatBRL(discountMoneySaved)}
                  </span>
                </div>

                <div>
                  <div className="text-2xl font-extrabold text-white">
                    {formatBRL(cashPriceWithDiscount)}
                  </div>
                  <div className="text-xs text-slate-400">
                    Faltam juntar <strong className="text-emerald-300">{formatBRL(remainingForCash)}</strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Guardando por mês:</span>
                    <strong className="text-white">{formatBRL(monthlySaveRecommended)}/mês</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tempo até a compra:</span>
                    <strong className="text-emerald-300">
                      {monthsToSaveForCash === 0
                        ? 'Já podem comprar hoje!'
                        : `${monthsToSaveForCash} ${monthsToSaveForCash === 1 ? 'mês' : 'meses'}`}
                    </strong>
                  </div>
                </div>

                {monthLifestyleExpenses > 0 && remainingForCash > 0 && (
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    💡 Se cortarem <strong>25% dos supérfluos</strong> deste mês (+
                    {formatBRL(monthLifestyleExpenses * 0.25)}), vocês chegam na meta ainda mais rápido e ganham{' '}
                    <strong className="text-emerald-300">{formatBRL(discountMoneySaved)}</strong> de desconto!
                  </p>
                )}
              </div>

              {/* Estratégia 2: Comprar Parcelado no Cartão */}
              <div
                className={`bg-slate-950/90 border rounded-2xl p-5 space-y-3 ${
                  fitsNowComfortably
                    ? 'border-violet-500/40'
                    : fitsNowTight
                    ? 'border-amber-500/40'
                    : 'border-rose-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-300">
                    <CreditCard className="w-4 h-4" /> Caminho 2: Parcelar em {simInstallments}x
                  </span>
                  {fitsNowComfortably ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      Cabe com folga
                    </span>
                  ) : fitsNowTight ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                      Aperta o mês
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300">
                      Acima do limite seguro
                    </span>
                  )}
                </div>

                <div>
                  <div className="text-2xl font-extrabold text-white">
                    {simInstallments}x de {formatBRL(installmentValue)}
                  </div>
                  <div className="text-xs text-slate-400">
                    {simSaved > 0
                      ? `Dando ${formatBRL(simSaved)} de entrada + ${formatBRL(financedAmount)} no cartão`
                      : `Valor total de ${formatBRL(simPrice)} no cartão`}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                  {fitsNowComfortably ? (
                    <div className="flex items-start gap-2 text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        A parcela de <strong>{formatBRL(installmentValue)}</strong> cabe tranquilamente dentro da margem segura de {formatBRL(safeMonthlyCapacity)}/mês!
                      </span>
                    </div>
                  ) : fitsIn2Months ? (
                    <div className="flex items-start gap-2 text-amber-300">
                      <Calendar className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        Hoje ficaria pesado, mas <strong>daqui a 2 meses</strong> ({formatShortMonthLabel(next2Key)}) acabam parcelas atuais e liberam{' '}
                        <strong>{formatBRL(reliefIn2Months)}/mês</strong> — aí cabe sem sufoco!
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-rose-300">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        Cuidado: essa parcela consome quase toda a sobra do mês. Recomendado juntar uma entrada maior primeiro.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LISTA DE METAS E DESEJOS DE AQUISIÇÃO DO CASAL */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              Nossas Metas de Aquisição ({goals.length})
            </h3>
            <p className="text-xs text-slate-400">
              Clique em "Simular Compra" em qualquer meta para testar cenários ou adicione valores guardados na caixinha
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal) => {
            const cashTarget = goal.targetAmount * (1 - goal.cashDiscountPercent / 100);
            const percent =
              goal.targetAmount > 0
                ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100)
                : 0;
            const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
            const remainingCashDiscount = Math.max(0, cashTarget - goal.savedAmount);

            return (
              <div
                key={goal.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mb-1.5 ${
                          goal.priority === 'alta'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : goal.priority === 'media'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        Prioridade {goal.priority}
                      </span>
                      <h4 className="text-base font-bold text-white leading-snug">
                        {goal.title}
                      </h4>
                    </div>
                    <button
                      onClick={() => onDeleteGoal(goal.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Excluir meta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {goal.notes && (
                    <p className="text-xs text-slate-400 line-clamp-2">{goal.notes}</p>
                  )}

                  {/* Valores e Barra */}
                  <div className="pt-1 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block">Já guardado</span>
                        <span className="text-lg font-extrabold text-emerald-400">
                          {formatBRL(goal.savedAmount)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Valor Tabela</span>
                        <span className="text-sm font-bold text-white">
                          {formatBRL(goal.targetAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-300 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{percent.toFixed(0)}% concluído</span>
                      <span>
                        À vista ({goal.cashDiscountPercent}% off):{' '}
                        <strong className="text-emerald-300">{formatBRL(cashTarget)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Resumo de quanto falta */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Falta p/ comprar no PIX:</span>
                      <strong className="text-emerald-300">
                        {formatBRL(remainingCashDiscount)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Ou saldo em {goal.maxInstallmentsInterestFree}x:
                      </span>
                      <strong className="text-violet-300">
                        {goal.maxInstallmentsInterestFree}x de{' '}
                        {formatBRL(remaining / (goal.maxInstallmentsInterestFree || 1))}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Ações do Card: Guardar mais ou Simular */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="+ Guardar R$"
                      value={depositInputs[goal.id] || ''}
                      onChange={(e) =>
                        setDepositInputs((prev) => ({ ...prev, [goal.id]: e.target.value }))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const addVal =
                          parseFloat((depositInputs[goal.id] || '').replace(',', '.')) || 0;
                        if (addVal > 0) {
                          onUpdateGoalSaved(goal.id, goal.savedAmount + addVal);
                          setDepositInputs((prev) => ({ ...prev, [goal.id]: '' }));
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold whitespace-nowrap transition flex items-center gap-1"
                    >
                      <PiggyBank className="w-3.5 h-3.5" /> Somar
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => loadGoalIntoSimulator(goal)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    Testar no Simulador Acima <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
