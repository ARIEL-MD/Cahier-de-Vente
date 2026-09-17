import React, { useState, useMemo } from 'react';
import { Category, Product, Sale, StoreSettings } from '../types';
import { formatFCFA, formatShortF } from '../utils/formatters';
import {
  Plus,
  Search,
  AlertTriangle,
  XCircle,
  Edit2,
  Trash2,
  PackagePlus,
  Boxes,
  TrendingUp,
  Filter,
  Lightbulb,
} from 'lucide-react';
import { CategoryIcon } from '../utils/categoryIcons';

interface StockViewProps {
  products: Product[];
  categories: Category[];
  sales: Sale[];
  settings: StoreSettings;
  onOpenAddModal: () => void;
  onOpenEditModal: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onQuickRestock: (productId: string, amount: number) => void;
}

export const StockView: React.FC<StockViewProps> = ({
  products,
  categories,
  sales,
  settings,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteProduct,
  onQuickRestock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'low' | 'out'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [restockModalProduct, setRestockModalProduct] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);

  // Calcul des quantités vendues par produit depuis l'historique complet des ventes
  const salesStatsByProductId = useMemo(() => {
    const stats: Record<string, { quantitySold: number; totalProfit: number; totalRevenue: number }> = {};

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!stats[item.productId]) {
          stats[item.productId] = { quantitySold: 0, totalProfit: 0, totalRevenue: 0 };
        }
        stats[item.productId].quantitySold += item.quantity;
        stats[item.productId].totalProfit += item.profit;
        stats[item.productId].totalRevenue += item.subtotal;
      });
    });

    return stats;
  }, [sales]);

  // Valeurs globales du stock
  const totalStockValueCost = products.reduce((sum, p) => sum + p.stock * p.purchasePrice, 0);
  const totalStockValueRetail = products.reduce((sum, p) => sum + p.stock * p.sellingPrice, 0);
  const totalPotentialProfit = totalStockValueRetail - totalStockValueCost;

  // Filtrage
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      // Filtre catégorie
      if (selectedCategory !== 'all' && product.categoryId !== selectedCategory) {
        return false;
      }

      // Filtre statut stock
      if (filterType === 'out' && product.stock > 0) return false;
      if (filterType === 'low' && (product.stock <= 0 || product.stock > settings.lowStockThreshold)) return false;

      // Filtre recherche
      if (query) {
        const matchesName = product.name.toLowerCase().includes(query);
        const cat = categories.find((c) => c.id === product.categoryId);
        const matchesCat = cat ? cat.name.toLowerCase().includes(query) : false;
        return matchesName || matchesCat;
      }

      return true;
    });
  }, [products, categories, searchQuery, filterType, selectedCategory, settings.lowStockThreshold]);

  const lowStockCount = products.filter(
    (p) => p.stock > 0 && p.stock <= settings.lowStockThreshold
  ).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  const handleConfirmRestock = () => {
    if (restockModalProduct && restockAmount > 0) {
      onQuickRestock(restockModalProduct.id, restockAmount);
      setRestockModalProduct(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Bouton "+ Ajouter un produit" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">Gestion du stock</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Suivi des entrées, sorties, prix d'achat/vente et bénéfices réalisés
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95"
        >
          <Plus className="h-5 w-5" />
          <span>+ Ajouter un produit</span>
        </button>
      </div>

      {/* Bannière explicative pour la modification des prix */}
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900">
        <Lightbulb className="h-5 w-5 shrink-0 text-emerald-600" />
        <div className="flex-1">
          <p className="font-bold">Comment modifier vos prix ou vos stocks ?</p>
          <p className="text-emerald-800">
            Cliquez sur le bouton <strong>« Modifier »</strong> sur n'importe quel produit pour ajuster son prix de vente, son prix d'achat ou sa quantité disponible. Vous pouvez aussi créer de nouveaux produits avec le bouton vert <strong>« Ajouter un produit »</strong> ci-dessus.
          </p>
        </div>
      </div>

      {/* Cartes de synthèse de valeur du stock */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total références
          </span>
          <p className="mt-1 text-xl sm:text-2xl font-black text-slate-900">
            {products.length} articles
          </p>
          <span className="text-[11px] text-slate-500">en catalogue actif</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Valeur du stock (Achat)
          </span>
          <p className="mt-1 text-xl sm:text-2xl font-black text-slate-900">
            {formatFCFA(totalStockValueCost)}
          </p>
          <span className="text-[11px] text-slate-500">capital investi</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Valeur du stock (Vente)
          </span>
          <p className="mt-1 text-xl sm:text-2xl font-black text-emerald-700">
            {formatFCFA(totalStockValueRetail)}
          </p>
          <span className="text-[11px] text-slate-500">valeur marchande</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Bénéfice potentiel
          </span>
          <p className="mt-1 text-xl sm:text-2xl font-black text-teal-700">
            +{formatFCFA(totalPotentialProfit)}
          </p>
          <span className="text-[11px] text-slate-500">si tout est vendu</span>
        </div>
      </div>

      {/* Barres d'actions & Filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Chercher un produit dans le stock..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium focus:border-emerald-500 focus:outline-hidden"
          />
        </div>

        {/* Filtres d'état */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterType('all')}
            className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              filterType === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Tous ({products.length})
          </button>

          <button
            onClick={() => setFilterType('low')}
            className={`flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              filterType === 'low'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Faibles ({lowStockCount})</span>
          </button>

          <button
            onClick={() => setFilterType('out')}
            className={`flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
              filterType === 'out'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
            }`}
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>Ruptures ({outOfStockCount})</span>
          </button>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-hidden"
          >
            <option value="all">Toutes catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. Liste / Cartes de Stock (Conforme à l'exemple demandé) */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.map((product) => {
          const stats = salesStatsByProductId[product.id] || {
            quantitySold: 0,
            totalProfit: 0,
            totalRevenue: 0,
          };
          const unitProfit = product.sellingPrice - product.purchasePrice;
          const category = categories.find((c) => c.id === product.categoryId);
          const isOut = product.stock <= 0;
          const isLow = product.stock > 0 && product.stock <= settings.lowStockThreshold;

          return (
            <div
              key={product.id}
              className={`flex flex-col justify-between rounded-2xl border p-4 shadow-xs transition-all ${
                isOut
                  ? 'border-rose-300 bg-rose-50/20'
                  : isLow
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-slate-200 bg-white hover:border-emerald-300'
              }`}
            >
              <div>
                {/* En-tête de la carte */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                      <CategoryIcon icon={category?.icon} className="h-3.5 w-3.5" />
                      {category?.name || 'Général'}
                    </span>
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      {product.name}
                    </h3>
                  </div>

                  {/* Badge d'alerte stock */}
                  {isOut ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-rose-100 px-2 py-0.5 text-[11px] font-black text-rose-800">
                      <XCircle className="h-3 w-3" /> RUPTURE
                    </span>
                  ) : isLow ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-900">
                      <AlertTriangle className="h-3 w-3" /> FAIBLE ({product.stock})
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-lg bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                      {product.stock} en stock
                    </span>
                  )}
                </div>

                {/* Grille des valeurs financières & Stocks demandées par l'exemple */}
                <div
                  onClick={() => onOpenEditModal(product)}
                  className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs cursor-pointer hover:bg-slate-100 transition-colors"
                  title="Cliquez pour modifier les prix ou le stock"
                >
                  <div>
                    <span className="text-slate-500">Prix achat :</span>{' '}
                    <strong className="text-slate-800">{formatShortF(product.purchasePrice)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Prix vente :</span>{' '}
                    <strong className="text-emerald-700">{formatShortF(product.sellingPrice)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Stock restant :</span>{' '}
                    <strong className={isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-900'}>
                      {product.stock}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Vendus :</span>{' '}
                    <strong className="text-blue-700">{stats.quantitySold}</strong>
                  </div>
                  <div className="border-t border-slate-200/60 pt-1.5">
                    <span className="text-slate-500">Bénéfice/unité :</span>{' '}
                    <strong className="text-emerald-700">+{formatShortF(unitProfit)}</strong>
                  </div>
                  <div className="border-t border-slate-200/60 pt-1.5">
                    <span className="text-slate-500">Bénéfice total :</span>{' '}
                    <strong className="text-emerald-700">+{formatFCFA(stats.totalProfit)}</strong>
                  </div>
                </div>
              </div>

              {/* Barre d'action : Réapprovisionner, Modifier, Supprimer */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <button
                  onClick={() => {
                    setRestockModalProduct(product);
                    setRestockAmount(10);
                  }}
                  className="flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 active:scale-95"
                >
                  <PackagePlus className="h-4 w-4 text-emerald-600" />
                  <span>Réapprovisionner</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenEditModal(product)}
                    className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-xs active:scale-95"
                    title="Modifier le prix de vente, le prix d'achat ou le stock"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Modifier</span>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Supprimer définitivement "${product.name}" du catalogue ?`)) {
                        onDeleteProduct(product.id);
                      }
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Supprimer ce produit"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de réapprovisionnement rapide */}
      {restockModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Réapprovisionner le stock
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Produit : <strong>{restockModalProduct.name}</strong>
              <br />
              Stock actuel : <strong>{restockModalProduct.stock}</strong>
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700">
                Quantité reçue à ajouter :
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-center text-lg font-bold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Raccourcis rapides de réapprovisionnement */}
              <div className="mt-2 flex gap-1.5">
                {[5, 10, 25, 50, 100].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setRestockAmount(qty)}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-1 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    +{qty}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => setRestockModalProduct(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmRestock}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
              >
                Valider (+{restockAmount})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
