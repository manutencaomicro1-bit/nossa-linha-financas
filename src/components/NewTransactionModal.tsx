import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Wallet,
  Sparkles,
  ShieldCheck,
  PiggyBank,
  User,
  Users,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  CategoryBudget,
  CoupleProfile,
  ExpenseNature,
  OwnerTag,
  PaymentMethod,
  Transaction,
  TransactionType,
} from '../types/finance';
import { addMonthsToMonthKey, formatBRL } from '../services/storage';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTransactions: (newTxs: Transaction[]) => void;
  categories: CategoryBudget[];
  profile: CoupleProfile;
  selectedMonth: string;
  defaultOwner?: OwnerTag;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  onSaveTransactions,
  categories,
  profile,
  selectedMonth,
  defaultOwner = 'couple',
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [categoryId, setCategoryId] = useState(categories[2]?.id || categories[0]?.id || '');
  const [owner, setOwner] = useState<OwnerTag>(defaultOwner);
  const [nature, setNature] = useState<ExpenseNature>('lifestyle');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [installments, setInstallments] = useState<number>(1);
  const [amountMode, setAmountMode] = useState<'total' | 'parcela'>('total');
  const [cardName, setCardName] = useState('Nubank');
  const [isRecurring, setIsRecurring] = useState(false);
  const [date, setDate] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return today.startsWith(selectedMonth) ? today : `${selectedMonth}-10`;
  });

  useEffect(() => {
    const cat = categories.find((c) => c.id === categoryId);
    if (cat && type === 'expense') {
      setNature(cat.defaultNature);
    }
  }, [categoryId, categories, type]);

  if (!isOpen) return null;

  const parsedValue = parseFloat(amountStr.replace(',', '.')) || 0;
  const isInstallment = type === 'expense' && paymentMethod === 'credit_card' && installments > 1;

  const monthlyAmount = isInstallment
    ? amountMode === 'total'
      ? parsedValue / installments
      : parsedValue
    : parsedValue;

  const totalPurchaseAmount = isInstallment
    ? amountMode === 'total'
      ? parsedValue
      : parsedValue * installments
    : parsedValue;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || parsedValue <= 0) return;

    const baseMonth = date.slice(0, 7);
    const created: Transaction[] = [];

    if (isInstallment) {
      const groupId = `grp_${Date.now()}`;
      for (let i = 0; i < installments; i++) {
        const targetMonth = addMonthsToMonthKey(baseMonth, i);
        created.push({
          id: `tx_${Date.now()}_${i}`,
          description: description.trim(),
          amount: Number(monthlyAmount.toFixed(2)),
          totalPurchaseAmount: Number(totalPurchaseAmount.toFixed(2)),
          date,
          monthKey: targetMonth,
          type: 'expense',
          categoryId,
          owner,
          nature,
          paymentMethod: 'credit_card',
          cardName: cardName.trim() || 'Cartão',
          installmentGroupId: groupId,
          installmentCurrent: i + 1,
          installmentTotal: installments,
        });
      }
    } else {
      created.push({
        id: `tx_${Date.now()}`,
        description: description.trim(),
        amount: Number(parsedValue.toFixed(2)),
        date,
        monthKey: baseMonth,
        type,
        categoryId,
        owner,
        nature: type === 'income' ? 'essential' : nature,
        paymentMethod,
        cardName: paymentMethod === 'credit_card' ? cardName.trim() || 'Cartão' : undefined,
        isRecurring,
      });
    }

    onSaveTransactions(created);
    setDescription('');
    setAmountStr('');
    setInstallments(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div>
            <h2 className="text-lg font-bold text-white">Novo Lançamento</h2>
            <p className="text-xs text-slate-400">
              Registre um gasto à vista, parcelado no cartão ou uma receita do casal
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Tipo: Despesa vs Receita */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2.5 text-sm font-semibold rounded-lg transition ${
                type === 'expense'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              💸 Despesa / Compra
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2.5 text-sm font-semibold rounded-lg transition ${
                type === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              💰 Receita / Entrada
            </button>
          </div>

          {/* Descrição e Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Descrição
              </label>
              <input
                type="text"
                required
                placeholder={
                  type === 'expense' ? 'Ex: iFood Sexta, Supermercado, Sofá...' : 'Ex: Salário, Freelance...'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Quem realizou (Renato, Esposa, Casal) */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {type === 'expense' ? 'Quem fez o gasto?' : 'De quem é a receita?'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setOwner('couple')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold border transition ${
                  owner === 'couple'
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                {profile.coupleLabel}
              </button>
              <button
                type="button"
                onClick={() => setOwner('partner1')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold border transition ${
                  owner === 'partner1'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                {profile.partner1Name}
              </button>
              <button
                type="button"
                onClick={() => setOwner('partner2')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold border transition ${
                  owner === 'partner2'
                    ? 'bg-pink-500/20 border-pink-500 text-pink-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                {profile.partner2Name}
              </button>
            </div>
          </div>

          {type === 'expense' && (
            <>
              {/* Categoria e Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Categoria do Orçamento
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Data da Compra
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Classificação Essencial vs Supérfluo */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Natureza do Gasto (Radar "Onde Estamos Perdendo a Linha")
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNature('essential')}
                    className={`flex flex-col items-center p-2.5 rounded-xl border text-xs transition ${
                      nature === 'essential'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 mb-1 text-emerald-400" />
                    <span className="font-semibold">Essencial</span>
                    <span className="text-[10px] opacity-75">Casa, Mercado, Saúde</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNature('lifestyle')}
                    className={`flex flex-col items-center p-2.5 rounded-xl border text-xs transition ${
                      nature === 'lifestyle'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 mb-1 text-amber-400" />
                    <span className="font-semibold">Supérfluo / Lazer</span>
                    <span className="text-[10px] opacity-75">iFood, Impulso, Bar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNature('savings')}
                    className={`flex flex-col items-center p-2.5 rounded-xl border text-xs transition ${
                      nature === 'savings'
                        ? 'bg-teal-500/15 border-teal-500 text-teal-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <PiggyBank className="w-4 h-4 mb-1 text-teal-400" />
                    <span className="font-semibold">Meta / Reserva</span>
                    <span className="text-[10px] opacity-75">Caixinha / Sonhos</span>
                  </button>
                </div>
              </div>

              {/* Forma de Pagamento & Parcelamento */}
              <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">Forma de Pagamento</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('credit_card');
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                      paymentMethod === 'credit_card'
                        ? 'bg-violet-500/20 border-violet-500 text-violet-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Cartão de Crédito
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('pix_debit');
                      setInstallments(1);
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                      paymentMethod !== 'credit_card'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    PIX / Débito / Boleto
                  </button>
                </div>

                {paymentMethod === 'credit_card' && (
                  <div className="pt-2 space-y-3 border-t border-slate-800/80">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Qual Cartão?
                        </label>
                        <input
                          type="text"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="Ex: Nubank, Itaú..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Nº de Parcelas
                        </label>
                        <select
                          value={installments}
                          onChange={(e) => setInstallments(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                        >
                          <option value={1}>1x à vista no cartão</option>
                          {[2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 24].map((n) => (
                            <option key={n} value={n}>
                              Parcelado em {n}x
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {installments > 1 && (
                      <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-violet-200 font-medium flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            O valor digitado acima é:
                          </span>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setAmountMode('total')}
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                amountMode === 'total'
                                  ? 'bg-violet-500 text-white'
                                  : 'bg-slate-900 text-slate-400'
                              }`}
                            >
                              Valor Total
                            </button>
                            <button
                              type="button"
                              onClick={() => setAmountMode('parcela')}
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                amountMode === 'parcela'
                                  ? 'bg-violet-500 text-white'
                                  : 'bg-slate-900 text-slate-400'
                              }`}
                            >
                              Valor da Parcela
                            </button>
                          </div>
                        </div>
                        {parsedValue > 0 && (
                          <p className="text-[11px] text-violet-300">
                            Serão criadas automaticamente <strong>{installments} parcelas</strong> de{' '}
                            <strong>{formatBRL(monthlyAmount)}/mês</strong> (Total:{' '}
                            {formatBRL(totalPurchaseAmount)}) nos próximos meses.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {type === 'income' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Data do Recebimento
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition"
            >
              Salvar Lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
