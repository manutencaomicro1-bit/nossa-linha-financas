import React, { useState } from 'react';
import {
  Search,
  Trash2,
  CreditCard,
  Wallet,
  ShieldCheck,
  Sparkles,
  PiggyBank,
  Plus,
  Layers,
  Filter,
  Pencil,
  X,
  Calendar,
} from 'lucide-react';
import {
  CategoryBudget,
  CoupleProfile,
  ExpenseNature,
  OwnerTag,
  Transaction,
} from '../types/finance';
import {
  addMonthsToMonthKey,
  formatBRL,
  formatMonthLabel,
} from '../services/storage';
import { CategoryIcon } from './CategoryIcon';

interface TransactionsProps {
  transactions: Transaction[];
  categories: CategoryBudget[];
  profile: CoupleProfile;
  selectedMonth: string;
  onUpdateTransaction: (updatedTx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction, deleteAllInstallments: boolean) => void;
  onOpenNewTx: () => void;
}

export const Transactions: React.FC<TransactionsProps> = ({
  transactions,
  categories,
  profile,
  selectedMonth,
  onUpdateTransaction,
  onDeleteTransaction,
  onOpenNewTx,
}) => {
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<'all' | OwnerTag>('all');
  const [natureFilter, setNatureFilter] = useState<'all' | ExpenseNature>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Inline editing state
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editMonthKey, setEditMonthKey] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editOwner, setEditOwner] = useState<OwnerTag>('couple');

  const monthTxs = transactions
    .filter((t) => t.monthKey === selectedMonth)
    .filter((t) => (ownerFilter === 'all' ? true : t.owner === ownerFilter))
    .filter((t) => (natureFilter === 'all' ? true : t.nature === natureFilter))
    .filter((t) => (categoryFilter === 'all' ? true : t.categoryId === categoryFilter))
    .filter((t) =>
      search.trim()
        ? t.description.toLowerCase().includes(search.trim().toLowerCase()) ||
          (t.cardName && t.cardName.toLowerCase().includes(search.trim().toLowerCase()))
        : true
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const startEditingTx = (tx: Transaction) => {
    setEditingTxId(tx.id);
    setEditDesc(tx.description);
    setEditAmount(String(tx.amount));
    setEditDate(tx.date);
    setEditMonthKey(tx.monthKey);
    setEditCategoryId(tx.categoryId);
    setEditOwner(tx.owner);
  };

  const saveEditTx = (tx: Transaction) => {
    const val = parseFloat(editAmount.replace(',', '.')) || tx.amount;
    onUpdateTransaction({
      ...tx,
      description: editDesc.trim() || tx.description,
      amount: Number(val.toFixed(2)),
      date: editDate || tx.date,
      monthKey: editMonthKey || tx.monthKey,
      categoryId: editCategoryId || tx.categoryId,
      owner: editOwner,
    });
    setEditingTxId(null);
  };

  const getOwnerBadge = (owner: OwnerTag) => {
    if (owner === 'partner1') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
          {profile.partner1Name}
        </span>
      );
    }
    if (owner === 'partner2') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-pink-500/15 text-pink-300 border border-pink-500/30">
          {profile.partner2Name}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
        {profile.coupleLabel}
      </span>
    );
  };

  const getNatureBadge = (nature: ExpenseNature) => {
    if (nature === 'essential') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
          <ShieldCheck className="w-3 h-3" /> Essencial
        </span>
      );
    }
    if (nature === 'lifestyle') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <Sparkles className="w-3 h-3" /> Supérfluo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-teal-500/15 text-teal-300 border border-teal-500/30">
        <PiggyBank className="w-3 h-3" /> Meta/Reserva
      </span>
    );
  };

  const filteredExpenseTotal = monthTxs
    .filter((t) => t.type === 'expense')
    .reduce((a, b) => a + b.amount, 0);

  const monthOptionsForMove = [-1, 0, 1, 2, 3].map((off) =>
    addMonthsToMonthKey(selectedMonth, off)
  );

  return (
    <div className="space-y-5">
      {/* Barra de Filtros e Busca */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Extrato Detalhado do Mês</h2>
            <p className="text-xs text-slate-400">
              Filtre por pessoa, categoria ou clique no ícone de lápis (✏️) para editar um lançamento ou mudar o mês da fatura
            </p>
          </div>
          <button
            onClick={onOpenNewTx}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs shadow-lg shadow-emerald-500/20 transition"
          >
            <Plus className="w-4 h-4" /> Novo Lançamento
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Busca */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar descrição ou cartão..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filtro Quem Gastou */}
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">👥 Todos os Responsáveis</option>
            <option value="couple">🏠 {profile.coupleLabel}</option>
            <option value="partner1">👤 {profile.partner1Name}</option>
            <option value="partner2">👤 {profile.partner2Name}</option>
          </select>

          {/* Filtro Natureza */}
          <select
            value={natureFilter}
            onChange={(e) => setNatureFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">🎯 Todas as Naturezas</option>
            <option value="lifestyle">✨ Apenas Supérfluos / Lazer</option>
            <option value="essential">🛡️ Apenas Essenciais</option>
            <option value="savings">🐷 Apenas Metas / Reserva</option>
          </select>

          {/* Filtro Categoria */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="all">📂 Todas as Categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Resumo do Filtro Atual */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            Exibindo <strong>{monthTxs.length}</strong> lançamento(s)
          </span>
          <span>
            Soma das despesas filtradas:{' '}
            <strong className="text-white text-sm">{formatBRL(filteredExpenseTotal)}</strong>
          </span>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {monthTxs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm text-slate-400">
              Nenhum lançamento encontrado para os filtros selecionados neste mês.
            </p>
            <button
              onClick={onOpenNewTx}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-300 transition"
            >
              + Adicionar Primeiro Lançamento
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {monthTxs.map((tx) => {
              const cat = categories.find((c) => c.id === tx.categoryId);
              const isInstallment = tx.installmentTotal && tx.installmentTotal > 1;
              const isEditingThis = editingTxId === tx.id;

              if (isEditingThis) {
                return (
                  <div
                    key={tx.id}
                    className="p-4 sm:px-6 bg-slate-950/90 border-l-4 border-emerald-500 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300">
                        Editando Lançamento / Mês de Competência (Fatura)
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingTxId(null)}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Cancelar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Descrição
                        </label>
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Valor (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-violet-300 font-bold mb-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Mês da Fatura / Extrato
                        </label>
                        <select
                          value={editMonthKey}
                          onChange={(e) => setEditMonthKey(e.target.value)}
                          className="w-full bg-slate-900 border border-violet-500 rounded-lg px-2.5 py-1.5 text-xs font-bold text-violet-200"
                        >
                          {monthOptionsForMove.map((mKey) => (
                            <option key={mKey} value={mKey}>
                              {formatMonthLabel(mKey)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => saveEditTx(tx)}
                          className="w-full py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                        >
                          Salvar Alteração
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Data da Compra
                        </label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Categoria
                        </label>
                        <select
                          value={editCategoryId}
                          onChange={(e) => setEditCategoryId(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Responsável
                        </label>
                        <select
                          value={editOwner}
                          onChange={(e) => setEditOwner(e.target.value as OwnerTag)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="couple">🏠 {profile.coupleLabel}</option>
                          <option value="partner1">👤 {profile.partner1Name}</option>
                          <option value="partner2">👤 {profile.partner2Name}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={tx.id}
                  className="p-4 hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div
                      className="p-2.5 rounded-xl shrink-0 mt-0.5 sm:mt-0"
                      style={{
                        backgroundColor:
                          tx.type === 'income'
                            ? '#10b98120'
                            : `${cat?.color || '#64748b'}20`,
                        color: tx.type === 'income' ? '#10b981' : cat?.color || '#94a3b8',
                      }}
                    >
                      <CategoryIcon name={cat?.icon || 'Wallet'} className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">
                          {tx.description}
                        </span>
                        {isInstallment && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                            <Layers className="w-3 h-3" />
                            Parcela {tx.installmentCurrent}/{tx.installmentTotal}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span>Compra: {tx.date.split('-').reverse().join('/')}</span>
                        <span>•</span>
                        <span className="text-slate-300">{cat?.name || 'Geral'}</span>
                        <span>•</span>
                        {getOwnerBadge(tx.owner)}
                        {tx.type === 'expense' && getNatureBadge(tx.nature)}
                        {tx.paymentMethod === 'credit_card' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-violet-300">
                            <CreditCard className="w-3 h-3" /> {tx.cardName || 'Cartão'} (Fatura {formatMonthLabel(tx.monthKey)})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                            <Wallet className="w-3 h-3" /> PIX/À vista
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                    <div className="text-left sm:text-right">
                      <div
                        className={`text-base font-extrabold ${
                          tx.type === 'income' ? 'text-emerald-400' : 'text-white'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'} {formatBRL(tx.amount)}
                      </div>
                      {isInstallment && tx.totalPurchaseAmount && (
                        <div className="text-[11px] text-slate-400">
                          Total da compra: {formatBRL(tx.totalPurchaseAmount)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEditingTx(tx)}
                        title="Editar lançamento ou mover para fatura de outro mês"
                        className="p-2 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (isInstallment) {
                            const all = window.confirm(
                              'Deseja excluir TODAS as parcelas desta compra em todos os meses? (Clique em Cancelar para excluir apenas a parcela deste mês)'
                            );
                            onDeleteTransaction(tx, all);
                          } else {
                            onDeleteTransaction(tx, false);
                          }
                        }}
                        title="Excluir lançamento"
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
