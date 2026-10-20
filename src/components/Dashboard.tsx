import React, { useState } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Wallet,
  Flame,
  ShieldCheck,
  Sparkles,
  PiggyBank,
  User,
  Users,
  CheckCircle2,
  ArrowUpRight,
  CreditCard,
} from 'lucide-react';
import {
  CategoryBudget,
  CoupleProfile,
  OwnerTag,
  Transaction,
} from '../types/finance';
import { formatBRL } from '../services/storage';
import { CategoryIcon } from './CategoryIcon';

interface DashboardProps {
  transactions: Transaction[];
  categories: CategoryBudget[];
  profile: CoupleProfile;
  selectedMonth: string;
  onNavigateTab: (tab: 'dashboard' | 'fixed_bills' | 'transactions' | 'installments' | 'goals' | 'settings') => void;
  onOpenNewTx: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  categories,
  profile,
  selectedMonth,
  onNavigateTab,
  onOpenNewTx,
}) => {
  const [ownerFilter, setOwnerFilter] = useState<'all' | OwnerTag>('all');

  const monthTxs = transactions.filter((t) => t.monthKey === selectedMonth);
  const filteredTxs =
    ownerFilter === 'all' ? monthTxs : monthTxs.filter((t) => t.owner === ownerFilter);

  const totalIncome = monthTxs
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const effectiveIncome = totalIncome > 0 ? totalIncome : profile.monthlyIncomeTarget;

  const expenses = filteredTxs.filter((t) => t.type === 'expense');
  const totalExpense = expenses.reduce((acc, t) => acc + t.amount, 0);

  const allMonthExpenses = monthTxs
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = effectiveIncome - allMonthExpenses;

  // Nature breakdown (Essencial vs Supérfluo vs Metas)
  const essentialTotal = expenses
    .filter((t) => t.nature === 'essential')
    .reduce((acc, t) => acc + t.amount, 0);

  const lifestyleTotal = expenses
    .filter((t) => t.nature === 'lifestyle')
    .reduce((acc, t) => acc + t.amount, 0);

  const savingsTotal = expenses
    .filter((t) => t.nature === 'savings')
    .reduce((acc, t) => acc + t.amount, 0);

  const lifestylePercentOfIncome =
    effectiveIncome > 0 ? (lifestyleTotal / effectiveIncome) * 100 : 0;

  // Division by owner across the whole month
  const allMonthExpenseItems = monthTxs.filter((t) => t.type === 'expense');
  const partner1Spent = allMonthExpenseItems
    .filter((t) => t.owner === 'partner1')
    .reduce((a, b) => a + b.amount, 0);
  const partner2Spent = allMonthExpenseItems
    .filter((t) => t.owner === 'partner2')
    .reduce((a, b) => a + b.amount, 0);
  const coupleSpent = allMonthExpenseItems
    .filter((t) => t.owner === 'couple')
    .reduce((a, b) => a + b.amount, 0);

  // Category thermometers
  const categoryStats = categories
    .map((cat) => {
      const spent = expenses
        .filter((t) => t.categoryId === cat.id)
        .reduce((acc, t) => acc + t.amount, 0);
      const percent = cat.monthlyLimit > 0 ? (spent / cat.monthlyLimit) * 100 : 0;
      const diff = cat.monthlyLimit - spent;
      return {
        ...cat,
        spent,
        percent,
        diff,
        status:
          percent >= 100
            ? 'exceeded'
            : percent >= 80
            ? 'warning'
            : 'safe',
      };
    })
    .sort((a, b) => b.percent - a.percent);

  const exceededCategories = categoryStats.filter((c) => c.status === 'exceeded');
  const warningCategories = categoryStats.filter((c) => c.status === 'warning');

  // Installments active this month
  const installmentExpenses = expenses.filter(
    (t) => t.installmentTotal && t.installmentTotal > 1
  );
  const installmentSum = installmentExpenses.reduce((a, b) => a + b.amount, 0);

  return (
    <div className="space-y-6">
      {/* Filtro rápido de Quem Gastou */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-2xl">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Visualizando gastos de:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setOwnerFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              ownerFilter === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Visão Completa (Todos)
          </button>
          <button
            onClick={() => setOwnerFilter('couple')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              ownerFilter === 'couple'
                ? 'bg-indigo-500 text-white shadow'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            🏠 {profile.coupleLabel} ({formatBRL(coupleSpent)})
          </button>
          <button
            onClick={() => setOwnerFilter('partner1')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              ownerFilter === 'partner1'
                ? 'bg-sky-500 text-slate-950 shadow'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            👤 {profile.partner1Name} ({formatBRL(partner1Spent)})
          </button>
          <button
            onClick={() => setOwnerFilter('partner2')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              ownerFilter === 'partner2'
                ? 'bg-pink-500 text-white shadow'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            👤 {profile.partner2Name} ({formatBRL(partner2Spent)})
          </button>
        </div>
      </div>

      {/* Cards KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Renda do Casal no Mês
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{formatBRL(effectiveIncome)}</div>
          <p className="text-xs text-slate-400 mt-1.5">
            {totalIncome > 0
              ? 'Baseado nas receitas lançadas no mês'
              : 'Usando meta de renda padrão do casal'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {ownerFilter === 'all' ? 'Saídas Totais do Mês' : 'Saídas (Filtro Atual)'}
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{formatBRL(totalExpense)}</div>
          <p className="text-xs text-slate-400 mt-1.5">
            {effectiveIncome > 0
              ? `${((totalExpense / effectiveIncome) * 100).toFixed(0)}% da renda mensal`
              : 'Sem renda base'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Gastos Supérfluos / Lazer
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-300">{formatBRL(lifestyleTotal)}</div>
          <p className="text-xs text-slate-400 mt-1.5">
            {lifestylePercentOfIncome.toFixed(1)}% da renda (Teto ideal: {profile.superfluousWarningPercent}%)
          </p>
        </div>

        <div
          className={`border rounded-2xl p-5 relative overflow-hidden ${
            balance >= 0
              ? 'bg-emerald-950/25 border-emerald-500/30'
              : 'bg-rose-950/30 border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">
              Sobra Livre do Mês
            </span>
            <div
              className={`p-2 rounded-xl ${
                balance >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-extrabold ${
              balance >= 0 ? 'text-emerald-300' : 'text-rose-300'
            }`}
          >
            {formatBRL(balance)}
          </div>
          <p className="text-xs text-slate-300/80 mt-1.5">
            {balance >= 0
              ? `Mais ${formatBRL(savingsTotal)} já separados em metas`
              : 'Atenção: despesas superaram as entradas!'}
          </p>
        </div>
      </div>

      {/* RADAR: ONDE ESTAMOS PERDENDO A LINHA */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/25 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 mt-0.5">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Radar: Onde Estamos Perdendo a Linha?
                </h2>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Diagnóstico Automático
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Análise em tempo real dos excessos de orçamento, compras por impulso e peso das parcelas no mês.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('settings')}
            className="self-start sm:self-center text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            Ajustar Limites Mensais <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Insights automáticos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {/* Alerta 1: Categorias Estouradas ou em Alerta */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-400" />
                Tetos de Categoria
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-400">
                {exceededCategories.length} estourada(s)
              </span>
            </div>
            {exceededCategories.length > 0 ? (
              <div className="space-y-2 text-xs text-slate-300">
                <p>
                  Vocês ultrapassaram o limite planejado em{' '}
                  <strong className="text-rose-300">
                    {exceededCategories.map((c) => c.name).join(', ')}
                  </strong>
                  .
                </p>
                {exceededCategories.slice(0, 2).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between bg-rose-500/10 border border-rose-500/30 px-2.5 py-1.5 rounded-lg"
                  >
                    <span className="truncate pr-2 font-medium text-rose-200">{c.name}</span>
                    <span className="text-rose-300 font-bold whitespace-nowrap">
                      +{formatBRL(Math.abs(c.diff))} acima
                    </span>
                  </div>
                ))}
              </div>
            ) : warningCategories.length > 0 ? (
              <div className="space-y-2 text-xs text-slate-300">
                <p>
                  Nenhuma categoria estourou ainda, mas{' '}
                  <strong className="text-amber-300">
                    {warningCategories.map((c) => c.name).join(', ')}
                  </strong>{' '}
                  já passou de 80% do limite!
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-emerald-300 py-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Parabéns! Todas as categorias estão abaixo de 80% do limite definido.</span>
              </div>
            )}
          </div>

          {/* Alerta 2: Proporção Essencial vs Supérfluo */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Termômetro de Supérfluos
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-400">
                {formatBRL(lifestyleTotal)}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Gastos marcados como <strong>Supérfluo / Estilo de Vida</strong> somam{' '}
              <strong className="text-amber-300">{formatBRL(lifestyleTotal)}</strong> (
              {lifestylePercentOfIncome.toFixed(1)}% da renda).
            </p>
            <div className="mt-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
              💡 Se reduzirem <strong>30%</strong> dos supérfluos deste mês, sobram mais{' '}
              <strong className="text-emerald-400">{formatBRL(lifestyleTotal * 0.3)}/mês</strong>{' '}
              para acelerar as metas do casal!
            </div>
          </div>

          {/* Alerta 3: Peso dos Parcelamentos no Cartão */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-violet-400" />
                Fôlego de Parcelas
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-400">
                {installmentExpenses.length} ativa(s)
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Neste mês, <strong className="text-violet-300">{formatBRL(installmentSum)}</strong> já
              estavam comprometidos com compras parceladas no cartão.
            </p>
            <button
              onClick={() => onNavigateTab('installments')}
              className="mt-3 w-full py-1.5 px-3 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-200 text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              Ver quando as parcelas acabam <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Termômetros por Categoria + Balanço 50/30/20 & Divisão Casal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Termômetro de Categorias (2 colunas) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-white">
                Termômetro de Orçamento por Categoria
              </h3>
              <p className="text-xs text-slate-400">
                Acompanhe quanto do limite mensal de cada área já foi consumido
              </p>
            </div>
            <button
              onClick={onOpenNewTx}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/25 transition"
            >
              + Lançar Gasto
            </button>
          </div>

          <div className="space-y-4">
            {categoryStats.map((cat) => {
              const barWidth = Math.min(100, Math.max(2, cat.percent));
              const isOver = cat.status === 'exceeded';
              const isWarn = cat.status === 'warning';

              return (
                <div
                  key={cat.id}
                  className={`p-3.5 rounded-xl border transition ${
                    isOver
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : isWarn
                      ? 'bg-amber-950/15 border-amber-500/30'
                      : 'bg-slate-950/50 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="p-2 rounded-lg shrink-0"
                        style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                      >
                        <CategoryIcon name={cat.icon} className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white truncate">
                            {cat.name}
                          </span>
                          {isOver && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-rose-500 text-white">
                              Estourou!
                            </span>
                          )}
                          {isWarn && (
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-500 text-slate-950">
                              Atenção {cat.percent.toFixed(0)}%
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {cat.diff >= 0
                            ? `Restam ${formatBRL(cat.diff)} do limite`
                            : `Passou ${formatBRL(Math.abs(cat.diff))} do limite planejado`}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-white">
                        {formatBRL(cat.spent)}{' '}
                        <span className="text-xs font-normal text-slate-400">
                          / {formatBRL(cat.monthlyLimit)}
                        </span>
                      </div>
                      <div
                        className={`text-[11px] font-semibold ${
                          isOver
                            ? 'text-rose-400'
                            : isWarn
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {cat.percent.toFixed(0)}% usado
                      </div>
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver
                          ? 'bg-gradient-to-r from-rose-500 to-red-400'
                          : isWarn
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna Lateral: Raio-X Essencial vs Supérfluo e Divisão do Casal */}
        <div className="space-y-6">
          {/* Card Essencial vs Supérfluo vs Metas */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">
              Qualidade do Gasto
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Para onde está indo o dinheiro de vocês neste mês
            </p>

            {/* Barra empilhada */}
            <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex mb-5 border border-slate-800">
              {totalExpense > 0 ? (
                <>
                  <div
                    style={{ width: `${(essentialTotal / totalExpense) * 100}%` }}
                    className="bg-emerald-500 h-full"
                    title="Essencial"
                  />
                  <div
                    style={{ width: `${(lifestyleTotal / totalExpense) * 100}%` }}
                    className="bg-amber-500 h-full"
                    title="Supérfluo / Estilo de Vida"
                  />
                  <div
                    style={{ width: `${(savingsTotal / totalExpense) * 100}%` }}
                    className="bg-teal-400 h-full"
                    title="Metas & Reserva"
                  />
                </>
              ) : (
                <div className="w-full bg-slate-800 h-full" />
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">Essenciais & Fixos</div>
                    <div className="text-[11px] text-slate-400">Casa, mercado, saúde</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">{formatBRL(essentialTotal)}</div>
                  <div className="text-[11px] text-emerald-400">
                    {totalExpense > 0 ? ((essentialTotal / totalExpense) * 100).toFixed(0) : 0}% dos gastos
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">Supérfluos & Lazer</div>
                    <div className="text-[11px] text-slate-400">Delivery, compras, saídas</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-amber-300">{formatBRL(lifestyleTotal)}</div>
                  <div className="text-[11px] text-amber-400">
                    {totalExpense > 0 ? ((lifestyleTotal / totalExpense) * 100).toFixed(0) : 0}% dos gastos
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <PiggyBank className="w-4 h-4 text-teal-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">Metas & Reservas</div>
                    <div className="text-[11px] text-slate-400">Guardado para conquistas</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-teal-300">{formatBRL(savingsTotal)}</div>
                  <div className="text-[11px] text-teal-400">
                    {totalExpense > 0 ? ((savingsTotal / totalExpense) * 100).toFixed(0) : 0}% dos gastos
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Divisão por Quem Gastou */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1">
              Divisão entre o Casal
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Visão transparente de gastos conjuntos e individuais no mês
            </p>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> {profile.coupleLabel}
                  </span>
                  <span className="font-bold text-white">{formatBRL(coupleSpent)}</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full"
                    style={{
                      width: `${allMonthExpenses > 0 ? (coupleSpent / allMonthExpenses) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-sky-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> {profile.partner1Name}
                  </span>
                  <span className="font-bold text-white">{formatBRL(partner1Spent)}</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-500 h-full rounded-full"
                    style={{
                      width: `${allMonthExpenses > 0 ? (partner1Spent / allMonthExpenses) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-pink-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> {profile.partner2Name}
                  </span>
                  <span className="font-bold text-white">{formatBRL(partner2Spent)}</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="bg-pink-500 h-full rounded-full"
                    style={{
                      width: `${allMonthExpenses > 0 ? (partner2Spent / allMonthExpenses) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
