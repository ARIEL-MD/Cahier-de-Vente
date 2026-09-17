import React, { useMemo } from 'react';
import { Category, Product, Sale, StoreSettings, ActiveTab } from '../types';
import { formatFCFA, formatShortF } from '../utils/formatters';
import {
  TrendingUp,
  Coins,
  BarChart3,
  Award,
  AlertTriangle,
  XCircle,
  Package,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ReportsViewProps {
  products: Product[];
  categories: Category[];
  sales: Sale[];
  settings: StoreSettings;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenEditModal: (product: Product) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  products,
  categories,
  sales,
  settings,
  setActiveTab,
}) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  // Semaine en cours (depuis lundi)
  const currentDay = now.getDay();
  const diffDays = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
  const weekStart = new Date(now.getFullYear(), now.getMonth(), diffDays).getTime();

  // Mois en cours
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  // Ventes par périodes
  const todaySales = sales.filter((s) => new Date(s.date).getTime() >= todayStart);
  const weekSales = sales.filter((s) => new Date(s.date).getTime() >= weekStart);
  const monthSales = sales.filter((s) => new Date(s.date).getTime() >= monthStart);

  // CA & Bénéfices
  const caDay = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
  const profitDay = todaySales.reduce((acc, s) => acc + s.totalProfit, 0);

  const caWeek = weekSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const profitWeek = weekSales.reduce((acc, s) => acc + s.totalProfit, 0);

  const caMonth = monthSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const profitMonth = monthSales.reduce((acc, s) => acc + s.totalProfit, 0);

  // Statistiques par produit (cumulées sur toutes les ventes)
  const productPerformance = useMemo(() => {
    const map: Record<
      string,
      { product: Product; quantitySold: number; revenue: number; profit: number }
    > = {};

    // Initialiser tous les produits
    products.forEach((p) => {
      map[p.id] = { product: p, quantitySold: 0, revenue: 0, profit: 0 };
    });

    sales.forEach((s) => {
      s.items.forEach((item) => {
        if (map[item.productId]) {
          map[item.productId].quantitySold += item.quantity;
          map[item.productId].revenue += item.subtotal;
          map[item.productId].profit += item.profit;
        }
      });
    });

    const list = Object.values(map);
    return {
      topSold: [...list].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 6),
      leastSold: [...list]
        .filter((item) => item.product.stock > 0) // ceux qui sont disponibles mais ne vendent pas
        .sort((a, b) => a.quantitySold - b.quantitySold)
        .slice(0, 6),
    };
  }, [products, sales]);

  // Graphique des 7 derniers jours
  const last7DaysData = useMemo(() => {
    const days: { label: string; dateStr: string; amount: number; profit: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const endOfDay = startOfDay + 24 * 3600 * 1000;

      const daySales = sales.filter((s) => {
        const t = new Date(s.date).getTime();
        return t >= startOfDay && t < endOfDay;
      });

      const amount = daySales.reduce((acc, s) => acc + s.totalAmount, 0);
      const profit = daySales.reduce((acc, s) => acc + s.totalProfit, 0);

      const dayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(d);
      const dateNum = d.getDate();

      days.push({
        label: `${dayName} ${dateNum}`,
        dateStr: d.toISOString().slice(0, 10),
        amount,
        profit,
      });
    }
    return days;
  }, [sales]);

  const maxDayAmount = Math.max(...last7DaysData.map((d) => d.amount), 1000);

  // Ventes par catégorie
  const categorySales = useMemo(() => {
    const catMap: Record<string, { category: Category; revenue: number; quantity: number }> = {};
    categories.forEach((c) => {
      catMap[c.id] = { category: c, revenue: 0, quantity: 0 };
    });

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (catMap[item.categoryId]) {
          catMap[item.categoryId].revenue += item.subtotal;
          catMap[item.categoryId].quantity += item.quantity;
        }
      });
    });

    return Object.values(catMap).sort((a, b) => b.revenue - a.revenue);
  }, [sales, categories]);

  const totalCatRevenue = categorySales.reduce((sum, c) => sum + c.revenue, 0) || 1;

  // Produits en rupture et presque en rupture
  const outOfStockProducts = products.filter((p) => p.stock <= 0);
  const lowStockProducts = products.filter(
    (p) => p.stock > 0 && p.stock <= settings.lowStockThreshold
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900">Rapports & Performance</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Analyse du chiffre d'affaires, des marges bénéficiaires et de la rotation des stocks
        </p>
      </div>

      {/* 11. Chiffre d'affaires & Bénéfice (Jour, Semaine, Mois) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Aujourd'hui */}
        <div className="rounded-3xl border border-emerald-200 bg-linear-to-br from-emerald-50/80 to-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-800 uppercase">
              Aujourd'hui
            </span>
            <Calendar className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-500">Chiffre d'affaires</span>
            <p className="text-xl font-black text-slate-900">{formatFCFA(caDay)}</p>
          </div>
          <div className="mt-2.5 border-t border-emerald-100 pt-2.5 flex items-baseline justify-between">
            <span className="text-xs font-semibold text-emerald-800">Bénéfice net</span>
            <span className="text-sm font-extrabold text-emerald-700">+{formatFCFA(profitDay)}</span>
          </div>
        </div>

        {/* Cette semaine */}
        <div className="rounded-3xl border border-teal-200 bg-linear-to-br from-teal-50/80 to-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-black text-teal-800 uppercase">
              Cette semaine
            </span>
            <TrendingUp className="h-5 w-5 text-teal-600" />
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-500">Chiffre d'affaires</span>
            <p className="text-xl font-black text-slate-900">{formatFCFA(caWeek)}</p>
          </div>
          <div className="mt-2.5 border-t border-teal-100 pt-2.5 flex items-baseline justify-between">
            <span className="text-xs font-semibold text-teal-800">Bénéfice net</span>
            <span className="text-sm font-extrabold text-teal-700">+{formatFCFA(profitWeek)}</span>
          </div>
        </div>

        {/* Ce mois */}
        <div className="rounded-3xl border border-sky-200 bg-linear-to-br from-sky-50/80 to-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-black text-sky-800 uppercase">
              Ce mois-ci
            </span>
            <Coins className="h-5 w-5 text-sky-600" />
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-500">Chiffre d'affaires</span>
            <p className="text-xl font-black text-slate-900">{formatFCFA(caMonth)}</p>
          </div>
          <div className="mt-2.5 border-t border-sky-100 pt-2.5 flex items-baseline justify-between">
            <span className="text-xs font-semibold text-sky-800">Bénéfice net</span>
            <span className="text-sm font-extrabold text-sky-700">+{formatFCFA(profitMonth)}</span>
          </div>
        </div>
      </div>

      {/* Graphique simple des ventes des 7 derniers jours */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Évolution des ventes (7 derniers jours)
              </h3>
              <p className="text-xs text-slate-500">Chiffre d'affaires journalier en F CFA</p>
            </div>
          </div>
        </div>

        {/* Bar chart visuel */}
        <div className="pt-6">
          <div className="flex items-end justify-between gap-2 sm:gap-4 h-48 border-b border-slate-200 pb-2">
            {last7DaysData.map((d, index) => {
              const heightPercent = Math.max(8, Math.round((d.amount / maxDayAmount) * 100));
              const isCurrentDay = index === 6;

              return (
                <div key={d.dateStr} className="flex flex-1 flex-col items-center h-full justify-end group">
                  <span className="mb-1 text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatShortF(d.amount)}
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[40px] rounded-t-xl transition-all ${
                      isCurrentDay
                        ? 'bg-emerald-600 shadow-md shadow-emerald-600/30'
                        : 'bg-emerald-400/80 hover:bg-emerald-500'
                    }`}
                  />
                  <span
                    className={`mt-2 text-[10px] sm:text-xs font-bold text-center capitalize ${
                      isCurrentDay ? 'text-emerald-700 font-extrabold' : 'text-slate-500'
                    }`}
                  >
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Répartition des ventes par Catégorie */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Ventes par catégorie</h3>
            <p className="text-xs text-slate-500">Part de chiffre d'affaires générée par rayon</p>
          </div>
        </div>

        <div className="space-y-3">
          {categorySales.map(({ category, revenue, quantity }) => {
            const percentage = Math.round((revenue / totalCatRevenue) * 100) || 0;
            return (
              <div key={category.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    {category.icon} {category.name}
                  </span>
                  <div className="space-x-2 text-right">
                    <span className="text-slate-500">({quantity} articles)</span>
                    <strong className="text-slate-900">{formatFCFA(revenue)}</strong>
                    <span className="font-bold text-emerald-700">({percentage}%)</span>
                  </div>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top 5 Produits les plus vendus / Produits les moins vendus */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Plus vendus */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Produits les plus vendus</h3>
              <p className="text-xs text-slate-500">Meilleures ventes en volume</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {productPerformance.topSold.map((item, index) => (
              <div key={item.product.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                      index === 0
                        ? 'bg-amber-100 text-amber-800'
                        : index === 1
                        ? 'bg-slate-200 text-slate-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                      {item.product.name}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      Prix : {formatShortF(item.product.sellingPrice)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-800">
                    {item.quantitySold} vendus
                  </span>
                  <span className="block text-[11px] font-semibold text-slate-600 mt-0.5">
                    {formatShortF(item.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Moins vendus */}
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Articles à faible rotation</h3>
              <p className="text-xs text-slate-500">Moins vendus mais en stock</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {productPerformance.leastSold.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                    {item.product.name}
                  </p>
                  <span className="text-[11px] text-slate-500">
                    Stock actuel : {item.product.stock}
                  </span>
                </div>

                <div className="text-right">
                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {item.quantitySold} vendu{item.quantitySold > 1 ? 's' : ''}
                  </span>
                  <span className="block text-[11px] font-bold text-slate-600 mt-0.5">
                    {formatShortF(item.product.sellingPrice)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Alertes de Stock (Ruptures & Presque en rupture) */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Alertes de réapprovisionnement
              </h3>
              <p className="text-xs text-slate-500">
                Produits nécessitant une commande fournisseur urgente
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('stock')}
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            <span>Gérer le stock</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Ruptures */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
              <XCircle className="h-4 w-4" />
              <span>En rupture totale ({outOfStockProducts.length})</span>
            </div>
            {outOfStockProducts.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">Aucun produit en rupture.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-xs">
                {outOfStockProducts.map((p) => (
                  <li key={p.id} className="flex justify-between font-medium text-slate-800">
                    <span>{p.name}</span>
                    <span className="font-bold text-rose-700">0 restant</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Stock faible */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>Stock critique (≤ {settings.lowStockThreshold})</span>
            </div>
            {lowStockProducts.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">Aucun produit en alerte faible.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-xs">
                {lowStockProducts.map((p) => (
                  <li key={p.id} className="flex justify-between font-medium text-slate-800">
                    <span>{p.name}</span>
                    <span className="font-bold text-amber-800">{p.stock} restants</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
