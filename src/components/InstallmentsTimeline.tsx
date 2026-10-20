import React from 'react';
import {
  CreditCard,
  Layers,
  Calendar,
  Sparkles,
  CheckCircle2,
  Plus,
  TrendingDown,
} from 'lucide-react';
import {
  CategoryBudget,
  CoupleProfile,
  Transaction,
} from '../types/finance';
import {
  addMonthsToMonthKey,
  formatBRL,
  formatMonthLabel,
  formatShortMonthLabel,
} from '../services/storage';

interface InstallmentsTimelineProps {
  transactions: Transaction[];
  categories: CategoryBudget[];
  profile: CoupleProfile;
  selectedMonth: string;
  onOpenNewTx: () => void;
}

export const InstallmentsTimeline: React.FC<InstallmentsTimelineProps> = ({
  transactions,
  categories,
  profile,
  selectedMonth,
  onOpenNewTx,
}) => {
  // Build next 8 months projection starting at selectedMonth
  const monthsWindow = Array.from({ length: 8 }, (_, idx) =>
    addMonthsToMonthKey(selectedMonth, idx)
  );

  // Calculate fixed/recurring expenses in selectedMonth
  const currentFixedExpenses = transactions
    .filter((t) => t.monthKey === selectedMonth && t.type === 'expense' && t.isRecurring)
    .reduce((a, b) => a + b.amount, 0);

  const projection = monthsWindow.map((mKey) => {
    const mTxs = transactions.filter((t) => t.monthKey === mKey && t.type === 'expense');
    const installmentsOnly = mTxs.filter(
      (t) => t.installmentTotal && t.installmentTotal > 1
    );
    const installmentSum = installmentsOnly.reduce((a, b) => a + b.amount, 0);

    // Cards breakdown
    const byCard: Record<string, number> = {};
    mTxs
      .filter((t) => t.paymentMethod === 'credit_card')
      .forEach((t) => {
        const card = t.cardName || 'Cartão';
        byCard[card] = (byCard[card] || 0) + t.amount;
      });

    return {
      monthKey: mKey,
      shortLabel: formatShortMonthLabel(mKey),
      fullLabel: formatMonthLabel(mKey),
      installmentSum,
      installmentCount: installmentsOnly.length,
      installmentsList: installmentsOnly,
      totalCommitted: installmentSum + currentFixedExpenses,
      byCard,
    };
  });

  const maxInstallmentSum = Math.max(
    ...projection.map((p) => p.installmentSum),
    1000
  );

  // Active installments in selectedMonth
  const activeInstallmentsThisMonth = projection[0]?.installmentsList || [];

  // Calculate how much frees up next month and in 2 months
  const currentInstSum = projection[0]?.installmentSum || 0;
  const nextMonthFreed = Math.max(0, currentInstSum - (projection[1]?.installmentSum || 0));
  const twoMonthsFreed = Math.max(0, currentInstSum - (projection[2]?.installmentSum || 0));

  // Cards summary for current selectedMonth
  const currentCards = projection[0]?.byCard || {};

  return (
    <div className="space-y-6">
      {/* Header & Resumo de Alívio */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/30 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-violet-500/15 border border-violet-500/30 text-violet-300">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Controle de Cartões & Comprometimento Futuro
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Veja quanto da renda dos próximos meses já está comprometido com parcelas e quando o orçamento vai aliviar
              </p>
            </div>
          </div>

          <button
            onClick={onOpenNewTx}
            className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-semibold text-xs shadow-lg shadow-violet-500/20 transition"
          >
            <Plus className="w-4 h-4" /> Lançar Compra Parcelada
          </button>
        </div>

        {/* 3 KPIs de Parcelas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400">Parcelas Ativas Neste Mês</span>
            <div className="text-2xl font-extrabold text-violet-300 mt-1">
              {formatBRL(currentInstSum)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Distribuídas em {activeInstallmentsThisMonth.length} compra(s) parcelada(s)
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400">Alívio no Próximo Mês</span>
            <div className="text-2xl font-extrabold text-emerald-300 mt-1">
              + {formatBRL(nextMonthFreed)}/mês
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Valor que deixa de ser cobrado em {projection[1]?.shortLabel}
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400">Alívio Acumulado em 60 Dias</span>
            <div className="text-2xl font-extrabold text-teal-300 mt-1">
              + {formatBRL(twoMonthsFreed)}/mês
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Folga aberta no orçamento até {projection[2]?.shortLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico de Linha do Tempo (Próximos 8 Meses) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-400" />
              Curva de Descomprometimento (Próximos 8 Meses)
            </h3>
            <p className="text-xs text-slate-400">
              Quanto menor a barra, mais dinheiro livre vocês terão naquele mês para novas conquistas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 items-end pt-4">
          {projection.map((item, idx) => {
            const heightPercent =
              maxInstallmentSum > 0
                ? Math.max(10, (item.installmentSum / maxInstallmentSum) * 100)
                : 10;

            return (
              <div
                key={item.monthKey}
                className={`flex flex-col items-center p-3 rounded-xl border ${
                  idx === 0
                    ? 'bg-violet-950/25 border-violet-500/40'
                    : 'bg-slate-950/60 border-slate-800/80'
                }`}
              >
                <span className="text-[11px] font-bold text-white mb-1">
                  {formatBRL(item.installmentSum)}
                </span>
                <span className="text-[10px] text-slate-400 mb-3">
                  {item.installmentCount} parc.
                </span>

                <div className="w-full h-32 bg-slate-900 rounded-lg flex items-end p-1 border border-slate-800/70">
                  <div
                    className={`w-full rounded-md transition-all duration-500 ${
                      idx === 0
                        ? 'bg-gradient-to-t from-violet-600 to-fuchsia-400'
                        : item.installmentSum === 0
                        ? 'bg-emerald-500/30'
                        : 'bg-gradient-to-t from-indigo-600/80 to-violet-400/80'
                    }`}
                    style={{ height: `${item.installmentSum === 0 ? 6 : heightPercent}%` }}
                  />
                </div>

                <span
                  className={`mt-2.5 text-xs font-bold ${
                    idx === 0 ? 'text-violet-300' : 'text-slate-300'
                  }`}
                >
                  {item.shortLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de Parcelamentos Ativos + Resumo por Cartão */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            Compras Parceladas Ativas em {formatMonthLabel(selectedMonth)}
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Acompanhe quantas parcelas faltam para cada compra sair da fatura
          </p>

          {activeInstallmentsThisMonth.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">
                Nenhuma parcela ativa neste mês!
              </p>
              <p className="text-xs text-slate-400 mt-1">
                A renda do casal está 100% livre de parcelamentos neste período.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeInstallmentsThisMonth.map((inst) => {
                const current = inst.installmentCurrent || 1;
                const total = inst.installmentTotal || 1;
                const remaining = total - current;
                const progress = (current / total) * 100;
                const cat = categories.find((c) => c.id === inst.categoryId);

                return (
                  <div
                    key={inst.id}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {inst.description}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                            Parcela {current} de {total}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Cartão: <strong className="text-slate-200">{inst.cardName || 'Cartão'}</strong> •{' '}
                          {cat?.name || 'Geral'} •{' '}
                          {inst.owner === 'partner1'
                            ? profile.partner1Name
                            : inst.owner === 'partner2'
                            ? profile.partner2Name
                            : profile.coupleLabel}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-extrabold text-white">
                          {formatBRL(inst.amount)}/mês
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {remaining === 0 ? (
                            <span className="text-emerald-400 font-semibold">
                              🎉 Última parcela neste mês!
                            </span>
                          ) : (
                            `Restam ${remaining}x (${formatBRL(remaining * inst.amount)})`
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-emerald-400 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Fatura Total por Cartão no Mês */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-base font-bold text-white mb-1">
            Faturas por Cartão no Mês
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Soma de compras à vista no crédito + parcelas do mês
          </p>

          {Object.keys(currentCards).length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Nenhum gasto no cartão de crédito registrado neste mês.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(currentCards).map(([card, total]) => (
                <div
                  key={card}
                  className="p-4 rounded-xl bg-gradient-to-r from-slate-950 to-violet-950/30 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-violet-500/20 text-violet-300">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{card}</div>
                      <div className="text-[11px] text-slate-400">Fatura estimada do mês</div>
                    </div>
                  </div>
                  <div className="text-base font-extrabold text-white">
                    {formatBRL(total)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
              <Sparkles className="w-4 h-4" /> Regra de Ouro do Casal
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Evitem criar novas parcelas enquanto o total de parcelamentos passar de{' '}
              <strong>15% da renda do casal</strong> ({formatBRL(profile.monthlyIncomeTarget * 0.15)}/mês).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
