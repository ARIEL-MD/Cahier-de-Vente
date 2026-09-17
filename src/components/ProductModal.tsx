import React, { useState, useEffect } from 'react';
import { Category, Product } from '../types';
import { X, Plus, Check } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Partial<Product>) => void;
  productToEdit?: Product | null;
  categories: Category[];
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  categories,
}) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>('');
  const [isQuickSale, setIsQuickSale] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCategoryId(productToEdit.categoryId);
      setPurchasePrice(productToEdit.purchasePrice);
      setSellingPrice(productToEdit.sellingPrice);
      setStock(productToEdit.stock);
      setIsQuickSale(!!productToEdit.isQuickSale);
    } else {
      setName('');
      setCategoryId(categories[0]?.id || '');
      setPurchasePrice('');
      setSellingPrice('');
      setStock(20);
      setIsQuickSale(false);
    }
    setError('');
  }, [productToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Le nom du produit est obligatoire.');
      return;
    }
    if (!categoryId) {
      setError('Veuillez sélectionner une catégorie.');
      return;
    }
    const pPrice = Number(purchasePrice);
    const sPrice = Number(sellingPrice);
    const stk = Number(stock);

    if (isNaN(pPrice) || pPrice < 0) {
      setError("Le prix d'achat doit être un nombre valide.");
      return;
    }
    if (isNaN(sPrice) || sPrice < 0) {
      setError('Le prix de vente doit être un nombre valide.');
      return;
    }
    if (isNaN(stk) || stk < 0) {
      setError('La quantité en stock doit être un nombre positif.');
      return;
    }

    onSave({
      name: name.trim(),
      categoryId,
      purchasePrice: pPrice,
      sellingPrice: sPrice,
      stock: stk,
      initialStock: productToEdit ? productToEdit.initialStock : stk,
      isQuickSale,
    });
    onClose();
  };

  const calculatedMargin =
    typeof sellingPrice === 'number' && typeof purchasePrice === 'number'
      ? sellingPrice - purchasePrice
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {productToEdit ? 'Modifier le produit' : 'Ajouter un nouveau produit'}
              </h3>
              <p className="text-xs text-slate-500">
                {productToEdit
                  ? 'Mettre à jour les prix ou la quantité en stock'
                  : 'Remplir les détails pour ajouter au catalogue'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Nom du produit */}
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Nom du produit <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Cahier 100P Privilège, bic, Ardoise p, Gourdes..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Catégorie / Rayon */}
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Rayon / Catégorie <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Prix d'achat & Prix de vente */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Prix d'achat (F CFA) <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  placeholder="Ex: 350"
                  value={purchasePrice}
                  onChange={(e) =>
                    setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Prix de vente (F CFA) <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  placeholder="Ex: 500"
                  value={sellingPrice}
                  onChange={(e) =>
                    setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-700 focus:border-emerald-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          {/* Marge calculée en direct */}
          {Number(sellingPrice) > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2 text-xs">
              <span className="text-slate-500">Bénéfice estimé par unité :</span>
              <span
                className={`font-bold ${
                  calculatedMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {calculatedMargin.toLocaleString('fr-FR')} F CFA
              </span>
            </div>
          )}

          {/* Stock */}
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Quantité en stock disponible <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              required
              placeholder="Ex: 40"
              value={stock}
              onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Option Vente Rapide */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isQuickSale"
              checked={isQuickSale}
              onChange={(e) => setIsQuickSale(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="isQuickSale" className="cursor-pointer text-xs font-medium text-slate-700">
              Afficher dans les boutons de « Vente rapide » sur le tableau de bord
            </label>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95"
            >
              <Check className="h-4 w-4" />
              {productToEdit ? 'Enregistrer les modifications' : 'Ajouter le produit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
