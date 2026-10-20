import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Home,
  Sparkles,
  Check,
  Pencil,
  X,
} from 'lucide-react';
import {
  CategoryBudget,
  CoupleProfile,
  ExpenseNature,
  FixedBillTemplate,
  OwnerTag,
  PaymentMethod,
  Transaction,
} from '../types/finance';
import { formatBRL, formatMonthLabel } from '../services/storage';
import { CategoryIcon } from './CategoryIcon';

interface FixedBillsChecklistProps {
  fixedBills: FixedBillTemplate[];
  transactions: Transaction[];
  categories: CategoryBudget[];
  profile: CoupleProfile;
  selectedMonth: string;
  onPayFixedBill: (bill: FixedBillTemplate, actualAmount: number) => void;
  onUnpayFixedBill: (txId: string) => void;
  onAddFixedBillTemplate: (bill: FixedBillTemplate) => void;
  onUpdateFixedBillTemplate: (bill: FixedBillTemplate) => void;
  onDeleteFixedBillTemplate: (billId: string) => void;
  onLaunchAllPendingBills: () => void;
}

export const FixedBillsChecklist: React.FC<FixedBillsChecklistProps> = ({
  fixedBills,
  transactions,
  categories,
  profile,
  selectedMonth,
  onPayFixedBill,
  onUnpayFixedBill,
  onAddFixedBillTemplate,
  onUpdateFixedBillTemplate,
  onDeleteFixedBillTemplate,
  onLaunchAllPendingBills,
}) => {
  const [showNewForm, setShowNewForm] = useState(false);

  // Edit mode state for an existing FixedBillTemplate
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editExpectedAmount, setEditExpectedAmount] = useState('');
  const [editDueDay, setEditDueDay] = useState('');
  const [editOwner, setEditOwner] = useState<OwnerTag>('couple');

  // New Fixed Bill state
  const [newName, setNewName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState(categories[0]?.id || '');
  const [newExpectedAmount, setNewExpectedAmount] = useState('');
  const [newDueDay, setNewDueDay] = useState('10');
  const [newOwner, setNewOwner] = useState<OwnerTag>('couple');
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>('boleto');
  const [newNature, setNewNature] = useState<ExpenseNature>('essential');

  const monthTxs = transactions.filter(
    (t) => t.monthKey === selectedMonth && t.type === 'expense'
  );

  const billsWithStatus = fixedBills
    .filter((b) => b.active)
    .sort((a, b) => a.dueDay - b.dueDay)
    .map((bill) => {
      const matchedTx = monthTxs.find((t) => t.fixedBillId === bill.id);
      return {
        bill,
        matchedTx,
        isPaid: Boolean(matchedTx),
      };
    });

  const totalExpected = billsWithStatus.reduce(
    (acc, item) => acc + (item.matchedTx ? item.matchedTx.amount : item.bill.expectedAmount),
    0
  );
  const totalPaid = billsWithStatus
    .filter((item) => item.isPaid)
    .reduce((acc, item) => acc + (item.matchedTx?.amount || 0), 0);
  const totalPending = Math.max(0, totalExpected - totalPaid);
  const paidCount = billsWithStatus.filter((i) => i.isPaid).length;

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newExpectedAmount.replace(',', '.')) || 0;
    if (!newName.trim() || val <= 0) return;

    const created: FixedBillTemplate = {
      id: `fb_${Date.now()}`,
      name: newName.trim(),
      categoryId: newCategoryId,
      expectedAmount: val,
      dueDay: Math.min(31, Math.max(1, Number(newDueDay) || 10)),
      owner: newOwner,
      paymentMethod: newPaymentMethod,
      nature: newNature,
      active: true,
    };

    onAddFixedBillTemplate(created);
    setNewName('');
    setNewExpectedAmount('');
    setShowNewForm(false);
  };

  const startEditing = (bill: FixedBillTemplate) => {
    setEditingBillId(bill.id);
    setEditName(bill.name);
    setEditCategoryId(bill.categoryId);
    setEditExpectedAmount(String(bill.expectedAmount));
    setEditDueDay(String(bill.dueDay));
    setEditOwner(bill.owner);
  };

  const saveEdit = (bill: FixedBillTemplate) => {
    const val = parseFloat(editExpectedAmount.replace(',', '.')) || bill.expectedAmount;
    const day = Math.min(31, Math.max(1, Number(editDueDay) || bill.dueDay));
    onUpdateFixedBillTemplate({
      ...bill,
      name: editName.trim() || bill.name,
      categoryId: editCategoryId || bill.categoryId,
      expectedAmount: val,
      dueDay: day,
      owner: editOwner,
    });
    setEditingBillId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header da Central de Compromissos Fixos */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/30 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Compromissos & Contas Fixas de {formatMonthLabel(selectedMonth)}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {paidCount}/{billsWithStatus.length} quitadas
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Parcela do Apto, Condomínio, Parcela do Carro, Luz, Água, Internet e outros compromissos mensais em um só lugar
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {totalPending > 0 && (
              <button
                type="button"
                onClick={onLaunchAllPendingBills}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition"
              >
                <CheckCircle2 className="w-4 h-4" /> Dar Baixa nas Pendentes
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowNewForm(!showNewForm)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition"
            >
              <Plus className="w-4 h-4" /> + Nova Conta Fixa
            </button>
          </div>
        </div>

        {/* 3 KPIs de Contas Fixas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400">Total de Compromissos Fixos</span>
            <div className="text-2xl font-extrabold text-white mt-1">
              {formatBRL(totalExpected)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {profile.monthlyIncomeTarget > 0
                ? `${((totalExpected / profile.monthlyIncomeTarget) * 100).toFixed(0)}% da renda base do casal`
                : 'Compromissos mensais cadastrados'}
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400">Já Pago / Lançado no Mês</span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">
              {formatBRL(totalPaid)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {paidCount} de {billsWithStatus.length} contas confirmadas no extrato
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400">Ainda Falta Pagar neste Mês</span>
            <div className="text-2xl font-extrabold text-amber-300 mt-1">
              {formatBRL(totalPending)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Clique no ícone de lápis ✏️ ao lado da conta se precisar editar dia ou valor
            </p>
          </div>
        </div>
      </div>

      {/* Formulário para Adicionar Nova Conta Fixa */}
      {showNewForm && (
        <form
          onSubmit={handleCreateTemplate}
          className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Cadastrar Novo Compromisso Mensal Fixo
            </h3>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">
                Nome da Conta / Parcela
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Financiamento do Carro, Condomínio, Luz..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Valor da Conta / Parcela (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                value={newExpectedAmount}
                onChange={(e) => setNewExpectedAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-white"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Dia de Vencimento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={newDueDay}
                onChange={(e) => setNewDueDay(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Categoria do Orçamento
              </label>
              <select
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Responsável
              </label>
              <select
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value as OwnerTag)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="couple">🏠 {profile.coupleLabel}</option>
                <option value="partner1">👤 {profile.partner1Name}</option>
                <option value="partner2">👤 {profile.partner2Name}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Natureza
              </label>
              <select
                value={newNature}
                onChange={(e) => setNewNature(e.target.value as ExpenseNature)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="essential">🛡️ Essencial / Fixo</option>
                <option value="lifestyle">✨ Estilo de Vida / Assinatura</option>
                <option value="savings">🐷 Reserva / Meta</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
            >
              Salvar na Checklist Mensal
            </button>
          </div>
        </form>
      )}

      {/* Checklist das Contas Fixas do Mês */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">
              Checklist de Contas & Financiamentos ({formatMonthLabel(selectedMonth)})
            </h3>
            <p className="text-xs text-slate-400">
              Valores travados por segurança. Caso precise corrigir o dia de vencimento, nome ou valor de uma conta, clique no botão <strong>Editar (✏️)</strong>.
            </p>
          </div>
        </div>

        {billsWithStatus.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm text-slate-400">
              Nenhuma conta fixa cadastrada ainda.
            </p>
            <button
              type="button"
              onClick={() => setShowNewForm(true)}
              className="px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition"
            >
              + Cadastrar Primeira Conta Fixa
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {billsWithStatus.map(({ bill, matchedTx, isPaid }) => {
              const cat = categories.find((c) => c.id === bill.categoryId);
              const isEditingThis = editingBillId === bill.id;

              if (isEditingThis) {
                return (
                  <div
                    key={bill.id}
                    className="p-4 sm:px-6 bg-slate-950/90 border-l-4 border-indigo-500 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300">
                        Editando Conta Fixa
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingBillId(null)}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Cancelar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Nome da Conta
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Dia de Vencimento
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={editDueDay}
                          onChange={(e) => setEditDueDay(e.target.value)}
                          className="w-full bg-slate-900 border border-indigo-500 rounded-lg px-3 py-1.5 text-xs font-bold text-amber-300"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Valor Fixo (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editExpectedAmount}
                          onChange={(e) => setEditExpectedAmount(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(bill)}
                          className="w-full py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                        >
                          Salvar Edição
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
                  key={bill.id}
                  className={`p-4 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition ${
                    isPaid ? 'bg-emerald-950/10' : 'hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div
                      className="p-2.5 rounded-xl shrink-0"
                      style={{
                        backgroundColor: isPaid
                          ? '#10b98125'
                          : `${cat?.color || '#6366f1'}20`,
                        color: isPaid ? '#10b981' : cat?.color || '#818cf8',
                      }}
                    >
                      <CategoryIcon name={cat?.icon || 'FileText'} className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-bold ${
                            isPaid ? 'text-emerald-200' : 'text-white'
                          }`}
                        >
                          {bill.name}
                        </span>
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <Check className="w-3 h-3" /> Pago no Mês
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditing(bill)}
                            title="Clique para editar o dia de vencimento"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition"
                          >
                            <Clock className="w-3 h-3" /> Vence dia {bill.dueDay} ✏️
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                        <span>{cat?.name || 'Contas Fixas'}</span>
                        <span>•</span>
                        <span>
                          {bill.owner === 'partner1'
                            ? profile.partner1Name
                            : bill.owner === 'partner2'
                            ? profile.partner2Name
                            : profile.coupleLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/60">
                    {isPaid && matchedTx ? (
                      <>
                        <div className="text-right">
                          <div className="text-sm font-extrabold text-emerald-400">
                            Pago: {formatBRL(matchedTx.amount)}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Confirmado no extrato
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onUnpayFixedBill(matchedTx.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                        >
                          Desfazer Baixa
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-3">
                        {/* Valor travado (somente leitura) */}
                        <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-extrabold text-white">
                          {formatBRL(bill.expectedAmount)}
                        </div>

                        <button
                          type="button"
                          onClick={() => onPayFixedBill(bill, bill.expectedAmount)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow shadow-emerald-500/20 transition flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar Pago
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEditing(bill)}
                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition"
                        title="Editar dia de vencimento, nome ou valor"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remover "${bill.name}" da lista de compromissos fixos mensais?`
                            )
                          ) {
                            onDeleteFixedBillTemplate(bill.id);
                          }
                        }}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Excluir conta fixa"
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
