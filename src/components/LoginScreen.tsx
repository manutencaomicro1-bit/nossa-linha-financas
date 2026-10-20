import React, { useState } from 'react';
import {
  HeartHandshake,
  Lock,
  User,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cloud,
} from 'lucide-react';
import { AuthSession, CloudConfig, CoupleProfile } from '../types/finance';
import { buildCoupleSlug } from '../services/storage';

interface LoginScreenProps {
  profile: CoupleProfile;
  cloudConfig: CloudConfig;
  onLoginSuccess: (session: AuthSession, updatedCoupleSpaceId?: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  profile,
  cloudConfig,
  onLoginSuccess,
}) => {
  const [selectedUser, setSelectedUser] = useState<'partner1' | 'partner2'>('partner1');
  const [pin, setPin] = useState('');
  const [spaceCode, setSpaceCode] = useState(() =>
    cloudConfig.coupleSpaceId && cloudConfig.coupleSpaceId !== 'renato-e-esposa-2026'
      ? cloudConfig.coupleSpaceId
      : buildCoupleSlug(profile.partner1Name, profile.partner2Name)
  );
  const [showCloudField, setShowCloudField] = useState(false);
  const [error, setError] = useState('');

  const expectedPin = profile.accessPin || '25102020';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() !== expectedPin) {
      setError('Senha de acesso incorreta. Tente novamente.');
      return;
    }
    setError('');
    onLoginSuccess(
      {
        loggedUser: selectedUser,
        loggedAt: new Date().toISOString(),
      },
      spaceCode.trim()
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glows de fundo */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-7 sm:p-8 shadow-2xl relative z-10">
        {/* Cabeçalho */}
        <div className="flex flex-col items-center text-center space-y-3 mb-7">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/25">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 mb-2">
              <Sparkles className="w-3 h-3" /> Espaço Exclusivo do Casal
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Nossa Linha
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Controle de Gastos, Contas da Casa & Planejamento de Conquistas
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Seleção de Quem está Entrando */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 text-center">
              Quem está acessando agora?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedUser('partner1')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition ${
                  selectedUser === 'partner1'
                    ? 'bg-sky-500/15 border-sky-400 text-white shadow-lg shadow-sky-500/10'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    selectedUser === 'partner1'
                      ? 'bg-sky-400 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <User className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold">{profile.partner1Name}</span>
                <span className="text-[10px] opacity-75 mt-0.5">Perfil 1</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedUser('partner2')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition ${
                  selectedUser === 'partner2'
                    ? 'bg-pink-500/15 border-pink-400 text-white shadow-lg shadow-pink-500/10'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    selectedUser === 'partner2'
                      ? 'bg-pink-400 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <User className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold">{profile.partner2Name}</span>
                <span className="text-[10px] opacity-75 mt-0.5">Perfil 2</span>
              </button>
            </div>
          </div>

          {/* Senha / PIN de Acesso */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Senha de Acesso do Casal
              </label>
            </div>
            <input
              type="password"
              required
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError('');
              }}
              placeholder="Digite a senha do casal..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-base font-bold tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Atalho opcional para Código da Nuvem */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowCloudField(!showCloudField)}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1.5 mx-auto"
            >
              <Cloud className="w-3.5 h-3.5 text-sky-400" />
              {showCloudField
                ? 'Ocultar código da sala na nuvem'
                : `Sala do Casal: ${spaceCode} (alterar)`}
            </button>

            {showCloudField && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <label className="block text-[11px] text-slate-400 mb-1">
                  Código de Sincronização do Casal:
                </label>
                <input
                  type="text"
                  value={spaceCode}
                  onChange={(e) => setSpaceCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-300"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2"
          >
            <span>Entrar como {selectedUser === 'partner1' ? profile.partner1Name : profile.partner2Name}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Você pode alterar a senha do casal na aba Limites & Nuvem.</span>
        </div>
      </div>
    </div>
  );
};
