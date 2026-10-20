import React from 'react';
import {
  CreditCard,
  Layers,
  Calendar,
  Sparkles,
  CheckCircle2,
  Plus,
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
  onSelectMonth?: (monthKey: string) => void;
  onOpenNewTx: () => void;
}

export const InstallmentsTimeline: React.FC<InstallmentsTimelineProps> = ({
  transactions,
  categories,
  profile,
  selectedMonth,
  onSelectMonth,
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

    // All credit card expenses in that month (1x invoice + installments)
    const creditCardOnly = mTxs.filter((t) => t.paymentMethod === 'credit_card');
    const creditCardSum = creditCardOnly.reduce((a, b) => a + b.amount, 0);

    // Multi-month installments
    const installmentsOnly = mTxs.filter(
      (t) => t.installmentTotal && t.installmentTotal > 1
    );
    const installmentSum = installmentsOnly.reduce((a, b) => a + b.amount, 0);

    // Cards breakdown
    const byCard: Record<string, number> = {};
    creditCardOnly.forEach((t) => {
      const card = t.cardName || 'Cartão';
      byCard[card] = (byCard[card] || 0) + t.amount;
    });

    return {
      monthKey: mKey,
      shortLabel: formatShortMonthLabel(mKey),
      fullLabel: formatMonthLabel(mKey),
      creditCardSum,
      creditCardCount: creditCardOnly.length,
      creditCardList: creditCardOnly,
      installmentSum,
      installmentCount: installmentsOnly.length,
      installmentsList: installmentsOnly,
      totalCommitted: creditCardSum + currentFixedExpenses,
      byCard,
    };
  });

  const maxCardSum = Math.max(
    ...projection.map((p) => p.creditCardSum),
    1000
  );

  // Active credit card items in selectedMonth
  const activeCardItemsThisMonth = projection[0]?.creditCardList || [];

  // Calculate how much frees up next month and in 2 months
  const currentCardSum = projection[0]?.creditCardSum || 0;
  const nextMonthFreed = Math.max(0, currentCardSum - (projection[1]?.creditCardSum || 0));
  const twoMonthsFreed = Math.max(0, currentCardSum - (projection[2]?.creditCardSum || 0));

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
                Veja as faturas e parcelas nos próximos 8 meses (clique em qualquer barra de mês para inspecionar a fatura daquele mês)
              </p>
            </div>
          </div>

          <button
            onClick={onOpenNewTx}
            className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-semibold text-xs shadow-lg shadow-violet-500/20 transition"
          >
            <Plus className="w-4 h-4" /> Lançar Compra / Fatura no Cartão
          </button>
        </div>

        {/* 3 KPIs de Cartão & Parcelas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400">
              Total em Cartões em {projection[0]?.shortLabel}
            </span>
            <div className="text-2xl font-extrabold text-violet-300 mt-1">
              {formatBRL(currentCardSum)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Soma de {activeCardItemsThisMonth.length} lançamento(s) na fatura deste mês
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400">
              Fatura Prevista para {projection[1]?.shortLabel}
            </span>
            <div className="text-2xl font-extrabold text-emerald-300 mt-1">
              {formatBRL(projection[1]?.creditCardSum || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {nextMonthFreed > 0
                ? `Alívio de +${formatBRL(nextMonthFreed)} em relação a este mês`
                : `${projection[1]?.creditCardCount || 0} lançamento(s) agendados p/ ${projection[1]?.shortLabel}`}
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400">
              Fatura Prevista para {projection[2]?.shortLabel}
            </span>
            <div className="text-2xl font-extrabold text-teal-300 mt-1">
              {formatBRL(projection[2]?.creditCardSum || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {twoMonthsFreed > 0
                ? `Folga de +${formatBRL(twoMonthsFreed)}/mês aberta até ${projection[2]?.shortLabel}`
                : `${projection[2]?.creditCardCount || 0} lançamento(s) agendados`}
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
              Curva de Faturas & Parcelamentos (Próximos 8 Meses)
            </h3>
            <p className="text-xs text-slate-400">
              Mostra o total de faturas e parcelas agendadas para cada mês. Clique em um mês para navegar até ele!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 items-end pt-4">
          {projection.map((item, idx) => {
            const heightPercent =
              maxCardSum > 0
                ? Math.max(10, (item.creditCardSum / maxCardSum) * 100)
                : 10;

            return (
              <button
                type="button"
                key={item.monthKey}
                onClick={() => onSelectMonth && onSelectMonth(item.monthKey)}
                className={`flex flex-col items-center p-3 rounded-xl border text-left transition ${
                  idx === 0
                    ? 'bg-violet-950/25 border-violet-500/50 shadow-lg shadow-violet-500/10'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-violet-500/40'
                }`}
              >
                <span className="text-[11px] font-bold text-white mb-1">
                  {formatBRL(item.creditCardSum)}
                </span>
                <span className="text-[10px] text-slate-400 mb-3">
                  {item.creditCardCount} item(ns)
                </span>

                <div className="w-full h-32 bg-slate-900 rounded-lg flex items-end p-1 border border-slate-800/70">
                  <div
                    className={`w-full rounded-md transition-all duration-500 ${
                      idx === 0
                        ? 'bg-gradient-to-t from-violet-600 to-fuchsia-400'
                        : item.creditCardSum === 0
                        ? 'bg-emerald-500/30'
                        : 'bg-gradient-to-t from-indigo-600/80 to-violet-400/80'
                    }`}
                    style={{ height: `${item.creditCardSum === 0 ? 6 : heightPercent}%` }}
                  />
                </div>

                <span
                  className={`mt-2.5 text-xs font-bold ${
                    idx === 0 ? 'text-violet-300' : 'text-slate-300'
                  }`}
                >
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Itens do Cartão no Mês + Resumo por Cartão */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            Lançamentos & Parcelas na Fatura de {formatMonthLabel(selectedMonth)}
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Acompanhe todas as compras no cartão e quantas parcelas faltam para cada uma terminar
          </p>

          {activeCardItemsThisMonth.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">
                Nenhuma fatura ou parcela ativa em {formatMonthLabel(selectedMonth)}!
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Se você agendou a fatura para o próximo mês, clique na barra de{' '}
                <strong>{projection[1]?.shortLabel}</strong> acima para visualizá-la.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeCardItemsThisMonth.map((inst) => {
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
                            {total > 1 ? `Parcela ${current} de ${total}` : 'Fatura do Mês (1x)'}
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
                          {formatBRL(inst.amount)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {remaining === 0 ? (
                            <span className="text-emerald-400 font-semibold">
                              🎉 Quitado neste mês!
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
            Faturas por Cartão em {formatMonthLabel(selectedMonth)}
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Soma de compras à vista no crédito + parcelas do mês
          </p>

          {Object.keys(currentCards).length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Nenhum gasto no cartão de crédito registrado para a fatura de {formatMonthLabel(selectedMonth)}.
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
