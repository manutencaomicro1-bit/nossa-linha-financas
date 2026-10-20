import React, { useState } from 'react';
import {
  Cloud,
  CheckCircle2,
  Download,
  Upload,
  RefreshCw,
  Sliders,
  Users,
  Trash2,
  Sparkles,
  Copy,
  Plus,
  Lock,
} from 'lucide-react';
import {
  AppStateData,
  CategoryBudget,
  CloudConfig,
  CoupleProfile,
  ExpenseNature,
} from '../types/finance';
import { buildCoupleSlug, formatBRL } from '../services/storage';
import { AVAILABLE_CATEGORY_ICONS, CategoryIcon } from './CategoryIcon';

interface BudgetLimitsAndCloudProps {
  profile: CoupleProfile;
  categories: CategoryBudget[];
  cloudConfig: CloudConfig;
  syncStatus: string;
  onUpdateProfile: (profile: CoupleProfile) => void;
  onUpdateCategories: (categories: CategoryBudget[]) => void;
  onUpdateProfileAndCategories: (profile: CoupleProfile, categories: CategoryBudget[]) => void;
  onSaveCloudConfig: (config: CloudConfig) => void;
  onManualSyncNow: () => void;
  onExportBackup: () => void;
  onImportBackup: (data: AppStateData) => void;
  onResetToEmpty: (currentDraftProfile: CoupleProfile) => void;
  onRestoreDemoData: () => void;
}

const SQL_SNIPPET = `create table if not exists public.couple_spaces (
  space_id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.couple_spaces enable row level security;
create policy "Acesso casal" on public.couple_spaces for all using (true) with check (true);
alter publication supabase_realtime add table public.couple_spaces;`;

export const BudgetLimitsAndCloud: React.FC<BudgetLimitsAndCloudProps> = ({
  profile,
  categories,
  cloudConfig,
  syncStatus,
  onUpdateProfile,
  onUpdateCategories,
  onUpdateProfileAndCategories,
  onSaveCloudConfig,
  onManualSyncNow,
  onExportBackup,
  onImportBackup,
  onResetToEmpty,
  onRestoreDemoData,
}) => {
  const [localProfile, setLocalProfile] = useState<CoupleProfile>(profile);
  const [localCategories, setLocalCategories] = useState<CategoryBudget[]>(categories);
  const [localCloud, setLocalCloud] = useState<CloudConfig>(cloudConfig);

  React.useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  React.useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  React.useEffect(() => {
    setLocalCloud(cloudConfig);
  }, [cloudConfig]);

  // Automatically keep the secret code synced with the couple names as they type
  React.useEffect(() => {
    const autoSlug = buildCoupleSlug(localProfile.partner1Name, localProfile.partner2Name);
    setLocalCloud((prev) => ({
      ...prev,
      coupleSpaceId: autoSlug,
    }));
  }, [localProfile.partner1Name, localProfile.partner2Name]);
  const [savedBanner, setSavedBanner] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Nova Categoria personalizada
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState('500');
  const [newCatNature, setNewCatNature] = useState<ExpenseNature>('essential');
  const [newCatIcon, setNewCatIcon] = useState('FileText');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');

  const handleSaveProfileAndBudgets = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfileAndCategories(localProfile, localCategories);
    onSaveCloudConfig(localCloud);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  const handleCategoryLimitChange = (id: string, val: number) => {
    setLocalCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, monthlyLimit: val } : c))
    );
  };

  const handleAddCustomCategory = () => {
    if (!newCatName.trim()) return;
    const created: CategoryBudget = {
      id: `cat_${Date.now()}`,
      name: newCatName.trim(),
      icon: newCatIcon,
      color: newCatColor,
      monthlyLimit: Number(newCatLimit) || 500,
      defaultNature: newCatNature,
    };
    const next = [...localCategories, created];
    setLocalCategories(next);
    onUpdateCategories(next);
    setNewCatName('');
    setShowAddCat(false);
  };

  const handleDeleteCategory = (id: string) => {
    if (localCategories.length <= 2) return;
    const next = localCategories.filter((c) => c.id !== id);
    setLocalCategories(next);
    onUpdateCategories(next);
  };

  const totalBudgetPlanned = localCategories.reduce((a, b) => a + b.monthlyLimit, 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result)) as AppStateData;
        if (parsed && parsed.transactions && parsed.categories) {
          onImportBackup(parsed);
          alert('Backup importado com sucesso!');
        }
      } catch {
        alert('Arquivo JSON inválido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* FORMULÁRIO: PERFIL DO CASAL, SENHA DE LOGIN & TETOS DE GASTO POR CATEGORIA */}
      <form
        onSubmit={handleSaveProfileAndBudgets}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Limites Mensais, Categorias & Acesso do Casal
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Personalize os nomes, a senha de login e defina o teto máximo para cada categoria (Parcela Apto, Condomínio, Carro, Luz, iFood e mais)
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="self-start sm:self-center px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
          >
            Salvar Alterações
          </button>
        </div>

        {savedBanner && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Configurações, senha e limites atualizados com sucesso!
          </div>
        )}

        {/* Dados do Casal + PIN de Login */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Seu Nome (Parceiro 1)
            </label>
            <input
              type="text"
              value={localProfile.partner1Name}
              onChange={(e) =>
                setLocalProfile({ ...localProfile, partner1Name: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Nome da Esposa (Parceiro 2)
            </label>
            <input
              type="text"
              value={localProfile.partner2Name}
              onChange={(e) =>
                setLocalProfile({ ...localProfile, partner2Name: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Renda Mensal Base do Casal (R$)
            </label>
            <input
              type="number"
              value={localProfile.monthlyIncomeTarget}
              onChange={(e) =>
                setLocalProfile({
                  ...localProfile,
                  monthlyIncomeTarget: Number(e.target.value),
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-bold text-emerald-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Teto Ideal p/ Supérfluos (%)
            </label>
            <input
              type="number"
              min="5"
              max="60"
              value={localProfile.superfluousWarningPercent}
              onChange={(e) =>
                setLocalProfile({
                  ...localProfile,
                  superfluousWarningPercent: Number(e.target.value),
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-amber-300 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" /> Senha / PIN de Login
            </label>
            <input
              type="text"
              value={localProfile.accessPin || '25102020'}
              onChange={(e) =>
                setLocalProfile({
                  ...localProfile,
                  accessPin: e.target.value,
                })
              }
              placeholder="Ex: 25102020"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm font-bold text-sky-300"
            />
          </div>
        </div>

        {/* Limites por Categoria */}
        <div className="pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Tetos Mensais por Categoria ({localCategories.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCat(!showAddCat)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" /> + Criar Nova Categoria
              </button>
            </div>
            <span className="text-xs text-slate-400">
              Soma dos limites planejados:{' '}
              <strong className="text-white">{formatBRL(totalBudgetPlanned)}</strong> / Renda:{' '}
              <strong className="text-emerald-300">
                {formatBRL(localProfile.monthlyIncomeTarget)}
              </strong>
            </span>
          </div>

          {/* Box de Criar Nova Categoria */}
          {showAddCat && (
            <div className="mb-4 p-4 rounded-xl bg-slate-950 border border-emerald-500/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">
                  Nome da Nova Categoria
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pets, Escola, Reforma, Impostos..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Limite Mensal (R$)
                </label>
                <input
                  type="number"
                  value={newCatLimit}
                  onChange={(e) => setNewCatLimit(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Ícone & Natureza
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    className="w-1/2 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                  >
                    {AVAILABLE_CATEGORY_ICONS.map((ic) => (
                      <option key={ic.id} value={ic.id}>
                        {ic.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newCatNature}
                    onChange={(e) => setNewCatNature(e.target.value as ExpenseNature)}
                    className="w-1/2 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                  >
                    <option value="essential">Essencial</option>
                    <option value="lifestyle">Supérfluo</option>
                    <option value="savings">Meta</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddCustomCategory}
                className="py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
              >
                Adicionar Categoria
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {localCategories.map((cat) => (
              <div
                key={cat.id}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="p-2 rounded-lg shrink-0"
                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-white truncate">
                      {cat.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Padrão:{' '}
                      {cat.defaultNature === 'essential'
                        ? 'Essencial'
                        : cat.defaultNature === 'lifestyle'
                        ? 'Supérfluo'
                        : 'Meta/Reserva'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={cat.monthlyLimit}
                    onChange={(e) =>
                      handleCategoryLimitChange(cat.id, Number(e.target.value))
                    }
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-right text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id)}
                    title="Remover categoria"
                    className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>

      {/* SINCRONIZAÇÃO EM NUVEM (SUPABASE) + BACKUP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Sincronização na Nuvem (Supabase Gratuito)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Conecte para que o seu celular e o da sua esposa sincronizem em tempo real de qualquer lugar
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300">
              {syncStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Código Secreto do Casal (Mesmo código no seu celular e no dela)
              </label>
              <input
                type="text"
                value={localCloud.coupleSpaceId}
                onChange={(e) =>
                  setLocalCloud({ ...localCloud, coupleSpaceId: e.target.value })
                }
                placeholder="Ex: familia-dias-2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-emerald-300"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={localCloud.supabaseUrl}
                onChange={(e) =>
                  setLocalCloud({ ...localCloud, supabaseUrl: e.target.value })
                }
                placeholder="https://xxxx.supabase.co"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Supabase Anon Public Key
              </label>
              <input
                type="password"
                value={localCloud.supabaseAnonKey}
                onChange={(e) =>
                  setLocalCloud({ ...localCloud, supabaseAnonKey: e.target.value })
                }
                placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={localCloud.enabled}
                onChange={(e) =>
                  setLocalCloud({ ...localCloud, enabled: e.target.checked })
                }
                className="rounded border-slate-700 bg-slate-950 text-emerald-500"
              />
              Ativar sincronização automática na nuvem
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onSaveCloudConfig(localCloud)}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition"
              >
                Salvar Conexão Nuvem
              </button>
              {cloudConfig.enabled && (
                <button
                  type="button"
                  onClick={onManualSyncNow}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Sincronizar Agora
                </button>
              )}
            </div>
          </div>

          {/* Passo a passo SQL rápido */}
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300">
                Script SQL (cole no SQL Editor do Supabase uma única vez):
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(SQL_SNIPPET);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2000);
                }}
                className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                <Copy className="w-3 h-3" />
                {copiedSql ? 'Copiado!' : 'Copiar SQL'}
              </button>
            </div>
            <pre className="text-[10px] text-slate-400 font-mono overflow-x-auto p-2 bg-slate-900 rounded-lg">
              {SQL_SNIPPET}
            </pre>
          </div>
        </div>

        {/* Gerenciamento de Dados & Backup */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">
              Gestão de Dados & Começar do Zero
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              O sistema vem preenchido com exemplos realistas para você e sua esposa testarem o Radar e o Simulador. Quando quiserem começar a lançar os dados reais de vocês, basta clicar em <strong>"Zerar Lançamentos de Exemplo"</strong> abaixo.
            </p>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      'Deseja ZERAR TUDO de todas as abas (Extrato, Contas Fixas, Parcelas, Metas, Renda e Limites) para começar 100% do zero? Seus nomes digitados acima serão mantidos!'
                    )
                  ) {
                    onResetToEmpty(localProfile);
                    setSavedBanner(true);
                    setTimeout(() => setSavedBanner(false), 3000);
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Zerar Tudo de Todas as Abas (Começar do Zero)
              </button>

              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      'Deseja restaurar os dados de demonstração originais?'
                    )
                  ) {
                    onRestoreDemoData();
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" /> Restaurar Dados de Demonstração
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            <span className="block text-xs font-semibold text-slate-300">
              Backup Manual em Arquivo (.JSON)
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onExportBackup}
                className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" /> Exportar Backup
              </button>

              <label className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition">
                <Upload className="w-3.5 h-3.5 text-sky-400" /> Importar Backup
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
