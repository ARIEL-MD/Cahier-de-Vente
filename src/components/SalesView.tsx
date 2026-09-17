import React, { useState, useMemo } from 'react';
import { Category, Product, StoreSettings } from '../types';
import { formatFCFA, formatShortF } from '../utils/formatters';
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShoppingBag,
  Edit2,
  Tags,
  ArrowRight,
} from 'lucide-react';
import { CategoryIcon } from '../utils/categoryIcons';

interface SalesViewProps {
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  onDirectSell: (product: Product, quantity: number) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  cartCount: number;
  openCart: () => void;
  onOpenEditModal?: (product: Product) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  products,
  categories,
  settings,
  onDirectSell,
  onAddToCart,
  cartCount,
  openCart,
  onOpenEditModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  // State for quantities per product id (default is 1)
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const getQty = (productId: string) => quantities[productId] || 1;

  const setQty = (productId: string, val: number, maxStock: number) => {
    const clamped = Math.max(1, Math.min(val, Math.max(maxStock, 1)));
    setQuantities((prev) => ({ ...prev, [productId]: clamped }));
  };

  // Filter products by category and search term
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'all' || product.categoryId === selectedCategory;

      if (!matchesCategory) return false;
      if (!query) return true;

      const matchesName = product.name.toLowerCase().includes(query);
      const cat = categories.find((c) => c.id === product.categoryId);
      const matchesCatName = cat ? cat.name.toLowerCase().includes(query) : false;

      return matchesName || matchesCatName;
    });
  }, [products, categories, selectedCategory, searchQuery]);

  return (
    <div className="space-y-4 pb-16">
      {/* 4. Barre de recherche très visible */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
          <Search className="h-5 w-5 text-emerald-600" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher : cahier, bic, gourde, géométrie, kit, crayon..."
          className="w-full rounded-2xl border-2 border-emerald-500/30 bg-white py-3.5 pl-12 pr-12 text-sm sm:text-base font-semibold text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden focus:ring-4 focus:ring-emerald-500/10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
          >
            <XCircle className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* 3. Onglets / Boutons de Catégories */}
      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex shrink-0 items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
            selectedCategory === 'all'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Tags className="h-3.5 w-3.5" /> Tous les articles
          </span>
          <span
            className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-black ${
              selectedCategory === 'all' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {products.length}
          </span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = products.filter((p) => p.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                isSelected
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <CategoryIcon icon={cat.icon} className="h-3.5 w-3.5" />
              <span>{cat.name}</span>
              <span
                className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                  isSelected ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Floating cart bar on mobile if items in cart */}
      {cartCount > 0 && (
        <div className="flex items-center justify-between rounded-2xl bg-emerald-700 p-3 text-white shadow-lg">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <span className="text-sm font-bold">
              {cartCount} article{cartCount > 1 ? 's' : ''} en attente dans le panier
            </span>
          </div>
          <button
            onClick={openCart}
            className="flex items-center gap-1 rounded-xl bg-white px-3.5 py-1.5 text-xs font-black text-emerald-800 shadow-xs hover:bg-emerald-50 active:scale-95"
          >
            Voir le panier <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 2. Liste des produits pour enregistrer les ventes */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-base font-bold text-slate-700">Aucun produit trouvé</p>
          <p className="mt-1 text-xs text-slate-400">
            Essayez de modifier votre recherche ou sélectionnez une autre catégorie.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredProducts.map((product) => {
            const currentQty = getQty(product.id);
            const isOutOfStock = product.stock <= 0;
            const isLowStock = product.stock > 0 && product.stock <= settings.lowStockThreshold;
            const subtotal = currentQty * product.sellingPrice;
            const category = categories.find((c) => c.id === product.categoryId);

            return (
              <div
                key={product.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all ${
                  isOutOfStock
                    ? 'border-slate-200 bg-slate-50/70 opacity-60'
                    : isLowStock
                    ? 'border-amber-200 bg-amber-50/30 hover:border-amber-400'
                    : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs'
                }`}
              >
                {/* Infos produit & Stock */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CategoryIcon icon={category?.icon} className="h-4 w-4 text-slate-500" />
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                      {product.name}
                    </h4>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {/* Prix unitaire */}
                    <button
                      type="button"
                      onClick={() => onOpenEditModal && onOpenEditModal(product)}
                      className="group flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-0.5 text-xs sm:text-sm font-black text-emerald-800 hover:bg-emerald-100 transition-colors"
                      title="Cliquez pour changer le prix de cet article"
                    >
                      <span>{formatShortF(product.sellingPrice)}</span>
                      {onOpenEditModal && (
                        <Edit2 className="h-3 w-3 text-emerald-600 opacity-60 group-hover:opacity-100" />
                      )}
                    </button>

                    {/* Statut du stock avec alertes visuelles */}
                    {isOutOfStock ? (
                      <span className="flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">
                        <XCircle className="h-3.5 w-3.5" />
                        RUPTURE DE STOCK
                      </span>
                    ) : isLowStock ? (
                      <span className="flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                        STOCK FAIBLE — {product.stock} restant{product.stock > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-500">
                        Stock dispo : <strong className="text-slate-700">{product.stock}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Section Contrôle de Quantité & Calcul du Total & Boutons Vendre */}
                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 border-t border-slate-100 sm:border-0 pt-2.5 sm:pt-0">
                  {/* Sélecteur de Quantité directe [20. Gestion de plusieurs quantités] */}
                  <div className="flex items-center gap-1">
                    <button
                      disabled={isOutOfStock || currentQty <= 1}
                      onClick={() => setQty(product.id, currentQty - 1, product.stock)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-90 disabled:opacity-40"
                      aria-label="Diminuer"
                    >
                      <Minus className="h-4 w-4" />
                    </button>

                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max={product.stock}
                        disabled={isOutOfStock}
                        value={currentQty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            setQty(product.id, val, product.stock);
                          }
                        }}
                        className="h-9 w-14 rounded-xl border border-slate-300 bg-white text-center text-sm font-black text-slate-900 focus:border-emerald-500 focus:outline-hidden disabled:bg-slate-100"
                      />
                    </div>

                    <button
                      disabled={isOutOfStock || currentQty >= product.stock}
                      onClick={() => setQty(product.id, currentQty + 1, product.stock)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-90 disabled:opacity-40"
                      aria-label="Augmenter"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Calcul dynamique sous-total (Ex: 3 x 2 500 = 7 500 F CFA) */}
                  <div className="min-w-[100px] text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                      {currentQty > 1 ? `${currentQty} × ${formatShortF(product.sellingPrice)} =` : 'Total'}
                    </span>
                    <span className="text-sm sm:text-base font-black text-slate-900 whitespace-nowrap">
                      {formatFCFA(subtotal)}
                    </span>
                  </div>

                  {/* Boutons d'Action : Panier + VENDRE immédiat */}
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <button
                      disabled={isOutOfStock}
                      onClick={() => {
                        onAddToCart(product, currentQty);
                        setQty(product.id, 1, product.stock);
                      }}
                      className="flex flex-1 sm:flex-initial items-center justify-center gap-1 rounded-xl border border-emerald-600 bg-white px-3 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 active:scale-95 disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-transparent"
                      title="Ajouter au ticket pour vente multiple"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">+ Panier</span>
                    </button>

                    <button
                      disabled={isOutOfStock}
                      onClick={() => {
                        onDirectSell(product, currentQty);
                        setQty(product.id, 1, product.stock);
                      }}
                      className={`flex flex-2 sm:flex-initial items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-black text-white shadow-xs transition-all active:scale-95 ${
                        isOutOfStock
                          ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                          : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>VENDRE</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
