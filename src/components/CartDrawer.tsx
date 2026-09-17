import React, { useState } from 'react';
import { Product } from '../types';
import { formatFCFA, formatShortF } from '../utils/formatters';
import { X, Trash2, Plus, Minus, CheckCircle, ShoppingBag, CreditCard, Banknote, Smartphone } from 'lucide-react';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onValidateSale: (paymentMethod: 'especes' | 'wave' | 'orange_money' | 'mtn_money' | 'moov') => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onValidateSale,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<
    'especes' | 'wave' | 'orange_money' | 'mtn_money' | 'moov'
  >('especes');

  if (!isOpen) return null;

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );

  const totalProfit = cartItems.reduce(
    (sum, item) =>
      sum + (item.product.sellingPrice - item.product.purchasePrice) * item.quantity,
    0
  );

  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const paymentOptions: {
    id: 'especes' | 'wave' | 'orange_money' | 'mtn_money' | 'moov';
    label: string;
    dotColor: string;
    color: string;
  }[] = [
    { id: 'especes', label: 'Espèces', dotColor: '', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
    { id: 'wave', label: 'Wave', dotColor: 'bg-sky-500', color: 'bg-sky-50 text-sky-800 border-sky-300' },
    { id: 'orange_money', label: 'Orange', dotColor: 'bg-orange-500', color: 'bg-orange-50 text-orange-800 border-orange-300' },
    { id: 'mtn_money', label: 'MTN MoMo', dotColor: 'bg-yellow-500', color: 'bg-yellow-50 text-yellow-800 border-yellow-300' },
    { id: 'moov', label: 'Moov', dotColor: 'bg-blue-500', color: 'bg-blue-50 text-blue-800 border-blue-300' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <div className="flex w-screen max-w-md flex-col bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Vente en cours</h2>
                <p className="text-xs text-slate-500">
                  {cartItems.length} référence{cartItems.length > 1 ? 's' : ''} ({totalCount} article{totalCount > 1 ? 's' : ''})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {cartItems.length > 0 && (
                <button
                  onClick={onClearCart}
                  className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  title="Vider le panier"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Cart List */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {cartItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-800">Le panier est vide</h3>
                <p className="mt-1 max-w-xs text-xs text-slate-500">
                  Cliquez sur les articles dans la page Ventes ou Vente rapide pour composer le ticket du client.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const subtotal = item.product.sellingPrice * item.quantity;
                  const isStockMax = item.quantity >= item.product.stock;

                  return (
                    <div
                      key={item.product.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 transition-all hover:bg-white hover:border-emerald-200"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">
                            {item.product.name}
                          </h4>
                          <p className="mt-0.5 text-xs text-slate-500">
                            Prix unitaire :{' '}
                            <span className="font-semibold text-slate-700">
                              {formatShortF(item.product.sellingPrice)}
                            </span>
                            <span className="mx-1.5 text-slate-300">•</span>
                            Stock dispo :{' '}
                            <span
                              className={`font-semibold ${
                                item.product.stock <= 5 ? 'text-amber-600' : 'text-slate-600'
                              }`}
                            >
                              {item.product.stock}
                            </span>
                          </p>
                        </div>

                        {/* Subtotal */}
                        <div className="text-right">
                          <span className="block text-xs text-slate-400 uppercase tracking-wider font-semibold">
                            Sous-total
                          </span>
                          <span className="text-sm font-extrabold text-slate-900">
                            {formatShortF(subtotal)}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Selector Stepper */}
                      <div className="mt-3 flex items-center justify-between border-t border-slate-200/80 pt-2.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 active:scale-90"
                            aria-label="Diminuer"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>

                          <input
                            type="number"
                            min="1"
                            max={item.product.stock}
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val > 0) {
                                onUpdateQuantity(item.product.id, Math.min(val, item.product.stock));
                              }
                            }}
                            className="h-8 w-14 rounded-lg border border-slate-300 bg-white text-center font-bold text-slate-900 text-sm focus:border-emerald-500 focus:outline-hidden"
                          />

                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            disabled={isStockMax}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-700 active:scale-90 ${
                              isStockMax
                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                : 'bg-white hover:bg-slate-100'
                            }`}
                            aria-label="Augmenter"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>

                          {isStockMax && (
                            <span className="ml-1 text-[11px] font-medium text-amber-600">
                              Max stock
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer with Calculation & Validation Button */}
          {cartItems.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50 p-5">
              {/* Payment Mode Selector */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Mode de règlement :
                </label>
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                  {paymentOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPaymentMethod(opt.id)}
                      className={`flex flex-col items-center justify-center rounded-xl p-2 text-center text-xs font-bold border transition-all ${
                        paymentMethod === opt.id
                          ? `${opt.color} ring-2 ring-emerald-500 shadow-xs scale-102`
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {opt.id === 'especes' ? (
                        <Banknote className="h-4 w-4" />
                      ) : (
                        <span className="flex items-center gap-1">
                          <Smartphone className="h-3.5 w-3.5" />
                          <span className={`h-1.5 w-1.5 rounded-full ${opt.dotColor}`} />
                        </span>
                      )}
                      <span className="mt-1 text-[11px] truncate w-full">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-1.5 rounded-2xl bg-white p-3.5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Sous-total articles ({totalCount})</span>
                  <span className="font-semibold text-slate-700">{formatFCFA(totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Bénéfice estimé</span>
                  <span className="font-semibold text-emerald-600">+{formatFCFA(totalProfit)}</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-slate-100 pt-2">
                  <span className="text-sm font-bold text-slate-900">TOTAL</span>
                  <span className="text-xl font-black text-emerald-700">
                    {formatFCFA(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Big Validation Button */}
              <button
                onClick={() => onValidateSale(paymentMethod)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-base font-extrabold text-white shadow-lg shadow-emerald-600/30 transition-all hover:bg-emerald-700 active:scale-98"
              >
                <CheckCircle className="h-6 w-6" />
                <span>VALIDER LA VENTE ({formatShortF(totalAmount)})</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
