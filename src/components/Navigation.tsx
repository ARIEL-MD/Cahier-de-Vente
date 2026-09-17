import React from 'react';
import { ActiveTab, StoreSettings } from '../types';
import {
  BookOpen,
  Tag,
  Calendar,
  Settings,
  Store,
} from 'lucide-react';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  settings: StoreSettings;
  todaySalesCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  settings,
  todaySalesCount,
}) => {
  const isTodayActive =
    activeTab === 'today' || activeTab === 'dashboard' || activeTab === 'sales';
  const isProductsActive = activeTab === 'products' || activeTab === 'stock';

  const navItems = [
    {
      id: 'today' as ActiveTab,
      label: 'Cahier du jour',
      shortLabel: 'Aujourd’hui',
      icon: <BookOpen className="h-5 w-5" />,
      badge: todaySalesCount > 0 ? todaySalesCount : undefined,
      isActive: isTodayActive,
    },
    {
      id: 'products' as ActiveTab,
      label: 'Mes Articles & Prix',
      shortLabel: 'Mes Prix',
      icon: <Tag className="h-5 w-5" />,
      isActive: isProductsActive,
    },
    {
      id: 'history' as ActiveTab,
      label: 'Historique',
      shortLabel: 'Historique',
      icon: <Calendar className="h-5 w-5" />,
      isActive: activeTab === 'history' || activeTab === 'reports',
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Paramètres',
      shortLabel: 'Réglages',
      icon: <Settings className="h-5 w-5" />,
      isActive: activeTab === 'settings',
    },
  ];

  return (
    <>
      {/* Barre supérieure épurée */}
      <header className="sticky top-0 z-40 border-b border-[#E5DFD5] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-3.5 py-2.5 sm:px-6">
          {/* Logo et Nom de la boutique */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B4D3E] text-white shadow-xs">
              <Store className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div>
              <h1 className="font-display text-sm font-extrabold text-[#181614] sm:text-base leading-tight tracking-tight">
                {settings.storeName}
              </h1>
              <p className="text-[11px] font-medium text-[#6B655B]">
                Cahier de caisse • <strong className="font-bold text-[#1B4D3E]">F CFA</strong>
              </p>
            </div>
          </div>

          {/* Navigation Ordinateur / Tablette */}
          <nav className="hidden md:flex items-center gap-1 rounded-xl bg-[#F3EFE6] border border-[#E5DFD5] p-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                  item.isActive
                    ? 'bg-white text-[#1B4D3E] shadow-xs border border-[#E5DFD5]'
                    : 'text-[#6B655B] hover:text-[#181614] hover:bg-black/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C34B22] px-1 text-[10px] font-black text-white tabular-nums">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Barre tactile inférieure pour téléphone Android (gros boutons pour les doigts) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 block md:hidden border-t border-[#E5DFD5] bg-white shadow-xl backdrop-blur-md">
        <div className="grid grid-cols-4 items-center px-1 py-1.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 transition-all ${
                item.isActive ? 'text-[#1B4D3E] font-extrabold' : 'text-[#6B655B] hover:text-[#181614]'
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                  item.isActive ? 'bg-[#E9F1ED] text-[#1B4D3E] scale-105' : ''
                }`}
              >
                {item.icon}
                {item.badge !== undefined && (
                  <span className="absolute top-1 right-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C34B22] px-1 text-[9px] font-black text-white tabular-nums">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="mt-0.5 text-[11px] truncate max-w-[70px] text-center leading-tight">
                {item.shortLabel}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
