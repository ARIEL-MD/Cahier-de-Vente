import React, { useState, useMemo } from 'react';
import { Category, Product } from '../types';
import { formatFCFA, formatShortF } from '../utils/formatters';
import { CategoryIcon } from '../utils/categoryIcons';
import { Plus, Search, Edit2, Trash2, Tag, Check, X } from 'lucide-react';

interface ProductCatalogViewProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (product: { name: string; categoryId: string; sellingPrice: number }) => void;
  onUpdateProductPrice: (productId: string, newPrice: number) => void;
  onDeleteProduct: (productId: string) => void;
}

export const ProductCatalogView: React.FC<ProductCatalogViewProps> = ({
  products,
  categories,
  onAddProduct,
  onUpdateProductPrice,
  onDeleteProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal d'ajout de produit simplifié
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState(categories[0]?.id || '');
  const [newProductPrice, setNewProductPrice] = useState<string>('500');

  // Modal d'édition directe de prix
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);

  const filteredProducts = useMemo(() => {
    const normalize = (t: string) =>
      t
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/privillege/g, 'privilege')
        .replace(/preference/g, 'preference')
        .replace(/scotche/g, 'scotch');

    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = normalize(searchQuery);
        return normalize(p.name).includes(q);
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;
    const price = parseInt(newProductPrice.replace(/\D/g, ''), 10) || 0;
    if (price <= 0) return;

    onAddProduct({
      name: newProductName.trim(),
      categoryId: newProductCategory || categories[0]?.id || 'cat-cahiers',
      sellingPrice: price,
    });

    setNewProductName('');
    setNewProductPrice('500');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-5 pb-20">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#181614]">
            Mes Articles & Prix
          </h2>
          <p className="text-xs sm:text-sm text-[#6B655B]">
            Fixez et ajustez librement les prix de vente de vos fournitures
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#C34B22] px-5 py-3 text-xs sm:text-sm font-display font-bold text-white shadow-md shadow-[#C34B22]/20 hover:bg-[#A83E1B] active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          <span>+ Ajouter un article</span>
        </button>
      </div>

      {/* Recherche & Filtre par rayon */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E877B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une fourniture (ex: 200p, bic, ardoise, casio...)"
            className="w-full rounded-xl border border-[#E5DFD5] bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium text-[#181614] focus:border-[#1B4D3E] focus:outline-hidden"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-xl border border-[#E5DFD5] bg-white px-3 py-2.5 text-xs sm:text-sm font-bold text-[#181614] focus:border-[#1B4D3E] focus:outline-hidden cursor-pointer"
        >
          <option value="all">Tous les rayons ({products.length})</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Liste des articles avec modification de prix en 1 clic */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => {
          const category = categories.find((c) => c.id === product.categoryId);

          return (
            <div
              key={product.id}
              className="flex items-center justify-between rounded-xl border border-[#E5DFD5] bg-white p-3.5 shadow-xs transition-all hover:border-[#1B4D3E]"
            >
              <div className="min-w-0 flex-1 pr-2">
                <span className="flex items-center gap-1 text-[11px] font-bold text-[#B45309]">
                  {category && <CategoryIcon icon={category.icon} className="h-3 w-3" />}
                  <span>{category?.name || 'Fourniture'}</span>
                </span>
                <p className="truncate text-sm font-bold text-[#181614] leading-snug mt-0.5">
                  {product.name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(product);
                    setEditPrice(product.sellingPrice);
                  }}
                  className="group flex items-center gap-1.5 rounded-lg bg-[#E9F1ED] px-3 py-1.5 font-display text-xs sm:text-sm font-black text-[#1B4D3E] hover:bg-[#D4E5DC] transition-colors tabular-nums cursor-pointer"
                  title="Modifier le prix"
                >
                  <span>{formatShortF(product.sellingPrice)}</span>
                  <Edit2 className="h-3 w-3 text-[#1B4D3E] opacity-60 group-hover:opacity-100" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Supprimer l'article "${product.name}" ?`)) {
                      onDeleteProduct(product.id);
                    }
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8E877B] hover:bg-[#FBF0EB] hover:text-[#C34B22] cursor-pointer"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL AJOUT D'ARTICLE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-[#E5DFD5] animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
              <div>
                <h3 className="font-display text-lg font-extrabold text-[#181614]">
                  + Ajouter un article
                </h3>
                <p className="text-xs text-[#6B655B] mt-0.5">
                  Renseignez le nom et le prix de vente
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full p-1 text-[#8E877B] hover:bg-[#F3EFE6] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#181614]">
                  Nom de l'article :
                </label>
                <input
                  type="text"
                  required
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Ex: Cahier 200 pages, Gourde..."
                  className="mt-1 w-full rounded-xl border border-[#E5DFD5] px-3.5 py-2 text-sm font-bold text-[#181614] focus:border-[#1B4D3E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#181614]">
                  Catégorie / Rayon :
                </label>
                <select
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#E5DFD5] px-3 py-2 text-xs font-bold text-[#181614] focus:border-[#1B4D3E] focus:outline-hidden"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#181614]">
                  Prix de vente (en F CFA) :
                </label>
                <input
                  type="number"
                  required
                  min="25"
                  step="25"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#E5DFD5] px-3.5 py-2 text-center font-display text-xl font-black text-[#1B4D3E] focus:border-[#1B4D3E] focus:outline-hidden tabular-nums"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-[#E5DFD5] pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-[#6B655B] hover:bg-[#F3EFE6] cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#1B4D3E] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#246552] cursor-pointer"
                >
                  Ajouter l'article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MODIFICATION RAPIDE DE PRIX */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-[#E5DFD5] animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
              <h3 className="font-display text-base font-extrabold text-[#181614]">
                Modifier le prix de vente
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="rounded-full p-1 text-[#8E877B] hover:bg-[#F3EFE6] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-2 text-xs text-[#6B655B] font-medium">
              Article : <strong className="text-[#181614]">{editingProduct.name}</strong>
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-[#181614]">
                Prix de vente (en F CFA) :
              </label>
              <input
                type="number"
                min="25"
                step="25"
                value={editPrice}
                onChange={(e) => setEditPrice(Number(e.target.value) || 0)}
                className="mt-1.5 w-full rounded-xl border border-[#E5DFD5] px-4 py-3 text-center font-display text-2xl font-black text-[#1B4D3E] focus:border-[#1B4D3E] focus:outline-hidden tabular-nums"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-[#E5DFD5] pt-3">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-[#6B655B] hover:bg-[#F3EFE6] cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editPrice > 0) {
                    onUpdateProductPrice(editingProduct.id, editPrice);
                    setEditingProduct(null);
                  }
                }}
                className="rounded-xl bg-[#1B4D3E] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#246552] cursor-pointer"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
