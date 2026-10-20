import React from 'react';
import {
  Home,
  ShoppingCart,
  Utensils,
  Car,
  ShoppingBag,
  Tv,
  HeartPulse,
  Sparkles,
  PiggyBank,
  Wallet,
  Building2,
  Zap,
  Droplets,
  Wifi,
  Shield,
  GraduationCap,
  Wrench,
  FileText,
} from 'lucide-react';

export const AVAILABLE_CATEGORY_ICONS = [
  { id: 'Home', label: 'Casa / Apto' },
  { id: 'Building2', label: 'Condomínio / Prédio' },
  { id: 'Zap', label: 'Luz / Energia' },
  { id: 'Droplets', label: 'Água & Gás' },
  { id: 'Wifi', label: 'Internet & Celular' },
  { id: 'Car', label: 'Carro / Combustível' },
  { id: 'ShoppingCart', label: 'Supermercado' },
  { id: 'Utensils', label: 'iFood & Restaurantes' },
  { id: 'ShoppingBag', label: 'Compras & Roupas' },
  { id: 'Tv', label: 'Streaming & Assinaturas' },
  { id: 'HeartPulse', label: 'Saúde & Farmácia' },
  { id: 'Shield', label: 'Seguros & Impostos' },
  { id: 'GraduationCap', label: 'Educação & Cursos' },
  { id: 'Wrench', label: 'Manutenção & Reforma' },
  { id: 'Sparkles', label: 'Lazer & Passeios' },
  { id: 'PiggyBank', label: 'Reserva & Metas' },
  { id: 'FileText', label: 'Boletos & Contas' },
  { id: 'Wallet', label: 'Outros' },
];

export function CategoryIcon({ name, className = 'w-5 h-5' }: { name: string; className?: string }) {
  switch (name) {
    case 'Home':
      return <Home className={className} />;
    case 'Building2':
      return <Building2 className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'Droplets':
      return <Droplets className={className} />;
    case 'Wifi':
      return <Wifi className={className} />;
    case 'ShoppingCart':
      return <ShoppingCart className={className} />;
    case 'Utensils':
      return <Utensils className={className} />;
    case 'Car':
      return <Car className={className} />;
    case 'ShoppingBag':
      return <ShoppingBag className={className} />;
    case 'Tv':
      return <Tv className={className} />;
    case 'HeartPulse':
      return <HeartPulse className={className} />;
    case 'Shield':
      return <Shield className={className} />;
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    case 'Wrench':
      return <Wrench className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'PiggyBank':
      return <PiggyBank className={className} />;
    case 'FileText':
      return <FileText className={className} />;
    default:
      return <Wallet className={className} />;
  }
}
