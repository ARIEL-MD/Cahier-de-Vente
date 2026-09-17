import React from 'react';
import { Product, Sale, StoreSettings, ActiveTab } from '../types';
import { formatFCFA, formatShortF, formatTime } from '../utils/formatters';
import {
  TrendingUp,
  ShoppingBag,
  Receipt,
  Coins,
  AlertTriangle,
  Calendar,
  Zap,
  ArrowRight,
  Plus,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';

interface DashboardViewProps {
  products: Product[];
  sales: Sale[];
  settings: StoreSettings;
  onQuickSell: (product: Product, quantity: number) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onViewReceipt: (sale: Sale) => void;
  setActiveTab: (tab: ActiveTab) => void;
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  sales,
  settings,
  onQuickSell,
  onAddToCart,
  onViewReceipt,
  setActiveTab,
  lowStockProducts,
  outOfStockProducts,
}) => {
  // Calculs statistiques
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  // Semaine en cours (depuis lundi)
  const currentDay = now.getDay();
  const diffDays = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
  const weekStart = new Date(now.getFullYear(), now.getMonth(), diffDays).getTime();

  // Mois en cours
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  // Ventes filtrées
  const todaySales = sales.filter((s) => new Date(s.date).getTime() >= todayStart);
  const weekSales = sales.filter((s) => new Date(s.date).getTime() >= weekStart);
  const monthSales = sales.filter((s) => new Date(s.date).getTime() >= monthStart);

  // Totaux Aujourd'hui
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
  const todayProfit = todaySales.reduce((acc, s) => acc + s.totalProfit, 0);
  const todayItemsSold = todaySales.reduce((acc, s) => acc + s.itemCount, 0);
  const todaySalesCount = todaySales.length;

  // Totaux Semaine et Mois
  const weekRevenue = weekSales.reduce((acc, s) => acc + s.totalAmount, 0);
  const monthRevenue = monthSales.reduce((acc, s) => acc + s.totalAmount, 0);

  // Total alertes
  const totalStockAlerts = lowStockProducts.length + outOfStockProducts.length;

  // Produits pour vente rapide : ceux marqués isQuickSale ou les 8 premiers avec du stock
  const quickSaleProducts = products.filter(
    (p) => p.isQuickSale || ['prod-cahier-100', 'prod-bic-bleu', 'prod-gomme', 'prod-gourde', 'prod-ensemble-geometrie'].includes(p.id)
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Salutation et Bannière boutique */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-3xl bg-emerald-700 p-5 sm:p-6 text-white shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-800/80 px-3 py-1 text-xs font-semibold text-emerald-100">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Papeterie & Fournitures Scolaires</span>
          </div>
          <h2 className="mt-2 text-xl sm:text-2xl font-black tracking-tight">
            {settings.storeName}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">
            Caisse commerciale • Devise en {settings.currency} • Côte d'Ivoire
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('sales')}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs sm:text-sm font-extrabold text-emerald-800 shadow-md transition-all hover:bg-emerald-50 active:scale-95"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Nouvelle vente</span>
          </button>
        </div>
      </div>

      {/* 1. Tableau de bord : Statistiques Principales (Affichage conforme à l'exemple) */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-500">
            Aujourd'hui en un coup d'œil
          </h3>
          <span className="text-xs font-medium text-slate-400">
            {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(now)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {/* Chiffre d'affaires du jour */}
          <div className="rounded-3xl border border-emerald-100 bg-linear-to-br from-emerald-50/90 to-white p-4 sm:p-5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                Chiffre d’affaires
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight block">
                {formatFCFA(todayRevenue)}
              </span>
              <p className="mt-0.5 text-[11px] font-medium text-emerald-600">
                Total encaissé aujourd'hui
              </p>
            </div>
          </div>

          {/* Bénéfice du jour */}
          <div className="rounded-3xl border border-teal-100 bg-linear-to-br from-teal-50/90 to-white p-4 sm:p-5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-teal-800">
                Bénéfice
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                <Coins className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight block">
                {formatFCFA(todayProfit)}
              </span>
              <p className="mt-0.5 text-[11px] font-medium text-teal-600">
                Marge brute réalisée
              </p>
            </div>
          </div>

          {/* Articles vendus aujourd'hui */}
          <div className="rounded-3xl border border-blue-100 bg-linear-to-br from-blue-50/90 to-white p-4 sm:p-5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-blue-800">
                Articles vendus
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <ShoppingBag className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight block">
                {todayItemsSold}
              </span>
              <p className="mt-0.5 text-[11px] font-medium text-blue-600">
                Unités sorties du stock
              </p>
            </div>
          </div>

          {/* Nombre de ventes aujourd'hui */}
          <div className="rounded-3xl border border-purple-100 bg-linear-to-br from-purple-50/90 to-white p-4 sm:p-5 shadow-xs transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-purple-800">
                Ventes
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight block">
                {todaySalesCount}
              </span>
              <p className="mt-0.5 text-[11px] font-medium text-purple-600">
                Clients servis aujourd'hui
              </p>
            </div>
          </div>
        </div>

        {/* Ligne secondaire : Ventes semaine, Ventes mois, Alertes de stock */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total semaine
                </span>
                <p className="text-base font-extrabold text-slate-900">
                  {formatFCFA(weekRevenue)}
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-400">Cette semaine</span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total mois
                </span>
                <p className="text-base font-extrabold text-slate-900">
                  {formatFCFA(monthRevenue)}
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-400">Ce mois</span>
          </div>

          <button
            onClick={() => setActiveTab('stock')}
            className={`flex items-center justify-between rounded-2xl border p-4 text-left transition-all hover:scale-101 ${
              totalStockAlerts > 0
                ? 'border-amber-300 bg-amber-50/70 text-amber-900 hover:bg-amber-100'
                : 'border-slate-200 bg-white text-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  totalStockAlerts > 0 ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Alertes stock
                </span>
                <p className="text-base font-extrabold">
                  {totalStockAlerts > 0
                    ? `${totalStockAlerts} produit${totalStockAlerts > 1 ? 's' : ''} faible/rupture`
                    : 'Stocks suffisants'}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </section>

      {/* 19. Section VENTE RAPIDE (Boutons géants tactiles pour vente en 1 seconde) */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Zap className="h-4 w-4 fill-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Vente rapide</h3>
              <p className="text-xs text-slate-500">
                Appuyez sur un produit pour l'ajouter immédiatement ou le vendre en 1 clic
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('sales')}
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            <span>Voir tout le catalogue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {quickSaleProducts.map((product) => {
            const isOut = product.stock <= 0;
            const isLow = product.stock > 0 && product.stock <= settings.lowStockThreshold;

            return (
              <div
                key={product.id}
                className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 transition-all ${
                  isOut
                    ? 'border-slate-200 bg-slate-50 opacity-60'
                    : 'border-slate-200 bg-slate-50/50 hover:border-emerald-500 hover:bg-emerald-50/40 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                      {product.name}
                    </span>
                    {isLow && (
                      <span className="rounded-md bg-amber-100 px-1 py-0.5 text-[9px] font-bold text-amber-800 shrink-0">
                        {product.stock} rest.
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-base font-black text-emerald-700">
                    {formatShortF(product.sellingPrice)}
                  </div>
                </div>

                {/* Bouton d'action direct tactile */}
                <div className="mt-3 flex gap-1.5">
                  <button
                    disabled={isOut}
                    onClick={() => onAddToCart(product, 1)}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold transition-all active:scale-95 ${
                      isOut
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                    }`}
                    title="Ajouter au ticket client"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Ticket</span>
                  </button>

                  <button
                    disabled={isOut}
                    onClick={() => onQuickSell(product, 1)}
                    className={`flex items-center justify-center rounded-xl px-2 py-2 text-xs font-bold border transition-all active:scale-90 ${
                      isOut
                        ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100'
                    }`}
                    title="Vendre 1 immédiatement en espèces"
                  >
                    Vendre
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dernières ventes récentes */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">Dernières ventes enregistrées</h3>
          </div>
          <button
            onClick={() => setActiveTab('history')}
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            Historique complet <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {todaySales.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">
            Aucune vente enregistrée pour le moment aujourd'hui.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {todaySales.slice(0, 4).map((sale) => (
              <div
                key={sale.id}
                onClick={() => onViewReceipt(sale)}
                className="flex cursor-pointer items-center justify-between py-3 transition-colors hover:bg-slate-50 rounded-xl px-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {sale.receiptNumber}
                    </span>
                    <span className="text-xs text-slate-400">• {formatTime(sale.date)}</span>
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 uppercase">
                      {sale.paymentMethod}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {sale.items.map((it) => `${it.quantity}x ${it.productName}`).join(', ')}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-sm font-extrabold text-slate-900">
                    {formatFCFA(sale.totalAmount)}
                  </span>
                  <span className="block text-[11px] font-semibold text-emerald-600">
                    +{formatFCFA(sale.totalProfit)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
