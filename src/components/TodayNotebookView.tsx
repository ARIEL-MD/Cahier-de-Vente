import React, { useState, useMemo, useEffect } from 'react';
import { Category, Product, Sale, CartItem } from '../types';
import { formatFCFA, formatShortF, isToday, formatTime } from '../utils/formatters';
import { CategoryIcon } from '../utils/categoryIcons';
import {
  Plus,
  Trash2,
  Receipt,
  Share2,
  Check,
  Edit2,
  Search,
  ShoppingCart,
  ShoppingBag,
  X,
  NotebookText,
  FileDown,
  MessageSquare,
  Eye,
  Copy,
} from 'lucide-react';
import {
  buildWhatsAppSummaryText,
  generateDailyReportPDF,
} from '../utils/reportExport';

interface TodayNotebookViewProps {
  products: Product[];
  categories: Category[];
  sales: Sale[];
  storeName: string;
  onDirectSale: (productName: string, amount: number, quantity: number, categoryId?: string) => void;
  onValidateCartSale?: (
    items: CartItem[],
    paymentMethod?: 'especes' | 'wave' | 'orange_money' | 'mtn_money' | 'moov'
  ) => void;
  onDeleteSale: (saleId: string) => void;
  onViewReceipt: (sale: Sale) => void;
  onQuickChangePrice: (product: Product, newPrice: number) => void;
  onOpenAddProduct: () => void;
  onOpenProductList: () => void;
}

export const TodayNotebookView: React.FC<TodayNotebookViewProps> = ({
  products,
  categories,
  sales,
  storeName,
  onDirectSale,
  onValidateCartSale,
  onDeleteSale,
  onViewReceipt,
  onQuickChangePrice,
  onOpenAddProduct,
  onOpenProductList,
}) => {
  // Filtre des ventes d'aujourd'hui
  const todaySales = useMemo(() => {
    return sales.filter((s) => isToday(s.date));
  }, [sales]);

  // Total encaissé aujourd'hui
  const todayTotal = useMemo(() => {
    return todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
  }, [todaySales]);

  const todayItemCount = useMemo(() => {
    return todaySales.reduce((sum, s) => sum + s.itemCount, 0);
  }, [todaySales]);

  // --- ÉTAT DU PANIER CLIENT ---
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('caisse_current_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sauvegarde automatique du panier dans localStorage
  useEffect(() => {
    try {
      localStorage.setItem('caisse_current_cart', JSON.stringify(cartItems));
    } catch (e) {
      // ignore
    }
  }, [cartItems]);

  // Calcul du prix total du panier
  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  }, [cartItems]);

  // Nombre total d'articles dans le panier
  const cartTotalCount = useMemo(() => {
    return cartItems.reduce((sum, it) => sum + it.quantity, 0);
  }, [cartItems]);

  // Actions sur le panier
  const addToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          unitPrice: product.sellingPrice,
          quantity: 1,
          categoryId: product.categoryId,
        },
      ];
    });
  };

  const updateCartItemQty = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Validation complète du panier et enregistrement dans le cahier
  const handleValidateCart = () => {
    if (cartItems.length === 0) return;

    if (onValidateCartSale) {
      onValidateCartSale(cartItems, 'especes');
    } else {
      // Repli
      const summaryNames = cartItems
        .map((it) => `${it.quantity > 1 ? `${it.quantity}x ` : ''}${it.name}`)
        .join(', ');
      onDirectSale(summaryNames, cartTotal, cartTotalCount);
    }

    // Réinitialiser le panier
    setCartItems([]);
  };

  // Recherche et filtres par rayon
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modification rapide de prix en direct
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editPriceValue, setEditPriceValue] = useState<number>(0);

  // Filtrage des fournitures pour la sélection
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

  // Modale Bilan / Export (WhatsApp & PDF)
  const [showReportModal, setShowReportModal] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // Téléchargement direct en PDF
  const handleDownloadPDF = () => {
    generateDailyReportPDF({
      todayTotal,
      todaySales,
      todayItemCount,
      storeName,
    });
  };

  // Envoi direct vers WhatsApp
  const handleSendWhatsApp = () => {
    const text = buildWhatsAppSummaryText({
      todayTotal,
      todaySales,
      todayItemCount,
      storeName,
    });
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Copier le texte formaté
  const handleCopyWhatsAppText = () => {
    const text = buildWhatsAppSummaryText({
      todayTotal,
      todaySales,
      todayItemCount,
      storeName,
    });
    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  return (
    <div className="space-y-5 pb-10">
      {/* 1. GROS BANDEAU PRINCIPAL : TOTAL DU JOUR (VERT REGISTRE COMPTABLE) */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1B4D3E] p-5 sm:p-6 text-white shadow-lg border border-[#13392E]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block rounded-md bg-[#246552] border border-white/10 px-2.5 py-1 text-[11px] font-extrabold tracking-wider uppercase text-[#E9F1ED]">
              Aujourd'hui • Cahier de caisse
            </span>
            <div className="mt-2.5">
              <span className="text-xs sm:text-sm font-semibold text-[#E9F1ED]/80 tracking-wide block uppercase">
                Total des ventes du jour
              </span>
              <p className="font-display text-3xl sm:text-5xl font-black tracking-tight text-white mt-1 tabular-nums">
                {formatFCFA(todayTotal)}
              </p>
            </div>
            <p className="mt-2.5 text-xs sm:text-sm text-[#E9F1ED]/90 font-medium">
              <strong className="text-white font-bold">{todaySales.length}</strong> vente{todaySales.length > 1 ? 's' : ''} enregistrée{todaySales.length > 1 ? 's' : ''} •{' '}
              <strong className="text-white font-bold">{todayItemCount}</strong> article{todayItemCount > 1 ? 's' : ''}
            </p>
          </div>

          {/* Actions : Exporter le bilan en WhatsApp ou PDF */}
          {todaySales.length > 0 && (
            <div className="flex flex-wrap sm:flex-col gap-2">
              <button
                onClick={handleSendWhatsApp}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#20bd5a] active:scale-95 transition-all cursor-pointer"
                title="Envoyer le bilan mis en page sur WhatsApp"
              >
                <Share2 className="h-4 w-4 text-white" />
                <span>Bilan WhatsApp</span>
              </button>

              <button
                onClick={handleDownloadPDF}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-[#1B4D3E] shadow-sm hover:bg-[#F8F5EE] active:scale-95 transition-all cursor-pointer"
                title="Télécharger le document PDF propre et certifié"
              >
                <FileDown className="h-4 w-4 text-[#1B4D3E]" />
                <span>Télécharger PDF</span>
              </button>

              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-[11px] font-bold text-[#E9F1ED] transition-colors cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Aperçu du texte</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. LE PANIER CLIENT DU VENDEUR */}
      <div
        id="panier-section"
        className={`rounded-2xl border transition-all ${
          cartItems.length > 0
            ? 'border-2 border-[#1B4D3E] bg-white p-4 sm:p-5 shadow-md ring-2 ring-[#1B4D3E]/10'
            : 'border-[#E5DFD5] bg-white p-4 sm:p-5 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-xs ${
                cartItems.length > 0 ? 'bg-[#1B4D3E]' : 'bg-[#6B655B]'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-sm sm:text-base font-extrabold text-[#181614] flex items-center gap-2">
                <span>Panier en cours</span>
                {cartItems.length > 0 && (
                  <span className="rounded-full bg-[#E9F1ED] px-2 py-0.5 text-[11px] font-bold text-[#1B4D3E] tabular-nums">
                    {cartTotalCount} art.
                  </span>
                )}
              </h2>
            </div>
          </div>

          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#C34B22] hover:bg-[#FBF0EB] active:scale-95 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Vider le panier</span>
            </button>
          )}
        </div>

        {/* CONTENU DU PANIER */}
        {cartItems.length === 0 ? (
          <div className="py-7 text-center">
            <ShoppingBag className="mx-auto h-8 w-8 text-[#8E877B] stroke-1" />
            <p className="mt-2 text-xs sm:text-sm font-bold text-[#6B655B]">
              Le panier est vide pour l'instant.
            </p>
            <p className="mt-0.5 text-[11px] text-[#8E877B]">
              Touchez les articles ci-dessous pour composer la commande du client.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Liste détaillée des articles choisis dans le panier */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 divide-y divide-[#E5DFD5]">
              {cartItems.map((item) => {
                const subtotal = item.unitPrice * item.quantity;
                return (
                  <div
                    key={item.id}
                    className="pt-2.5 first:pt-0 flex items-center justify-between gap-2"
                  >
                    {/* Nom et prix unitaire */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-[#181614] truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-[#6B655B] font-medium tabular-nums">
                        {formatShortF(item.unitPrice)} l'unité
                      </p>
                    </div>

                    {/* Contrôles de quantité (+ / -) */}
                    <div className="flex items-center gap-1 bg-[#F3EFE6] border border-[#E5DFD5] rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => updateCartItemQty(item.id, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-[#E5DFD5] font-black text-[#181614] shadow-xs hover:bg-[#F8F5EE] active:scale-90"
                        title="Diminuer"
                      >
                        -
                      </button>
                      <span className="w-7 text-center text-xs sm:text-sm font-black text-[#181614] tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartItemQty(item.id, item.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1B4D3E] font-black text-white shadow-xs hover:bg-[#246552] active:scale-90"
                        title="Augmenter"
                      >
                        +
                      </button>
                    </div>

                    {/* Sous-total de la ligne */}
                    <div className="text-right min-w-[70px]">
                      <span className="font-display text-xs sm:text-sm font-black text-[#181614] tabular-nums">
                        {formatShortF(subtotal)}
                      </span>
                    </div>

                    {/* Bouton pour retirer cet article du panier */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="rounded-lg p-1.5 text-[#8E877B] hover:text-[#C34B22] hover:bg-[#FBF0EB]"
                      title="Retirer cet article"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* BANDEAU D'ENCAISSEMENT : TOTAL DU PANIER & BOUTON ENCAISSER TERRE CUITE */}
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#181614] px-4 py-3 text-white shadow-md border border-black/10">
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D5CDC0] block">
                  Total à payer
                </span>
                <span className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white block truncate tabular-nums">
                  {formatFCFA(cartTotal)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleValidateCart}
                className="flex items-center gap-2 rounded-xl bg-[#C34B22] px-5 py-3 text-sm sm:text-base font-display font-extrabold text-white shadow-lg shadow-[#C34B22]/30 hover:bg-[#A83E1B] active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <Check className="h-5 w-5 stroke-[2.75]" />
                <span>Encaisser</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. FOURNITURES SCOLAIRES */}
      <div className="rounded-2xl border border-[#E5DFD5] bg-white p-4 sm:p-5 shadow-xs">
        {/* Filtres par catégories / rayons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#1B4D3E] text-white shadow-xs'
                : 'bg-[#F3EFE6] text-[#6B655B] border border-[#E5DFD5] hover:text-[#181614]'
            }`}
          >
            Tous les rayons ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#1B4D3E] text-white shadow-xs'
                  : 'bg-[#F3EFE6] text-[#6B655B] border border-[#E5DFD5] hover:text-[#181614]'
              }`}
            >
              <CategoryIcon icon={cat.icon} className="h-3.5 w-3.5" />
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Recherche rapide */}
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8E877B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une fourniture (ex: 200P, bic, ardoise, colle, casio, rame...)"
            className="w-full rounded-xl border border-[#E5DFD5] bg-[#F8F5EE] py-2.5 pl-8 pr-3 text-xs sm:text-sm font-medium text-[#181614] focus:border-[#1B4D3E] focus:bg-white focus:outline-hidden"
          />
        </div>

        {/* Grille d'articles scolaires */}
        {filteredProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E5DFD5] bg-[#F8F5EE] p-6 text-center">
            <p className="text-xs font-bold text-[#6B655B]">
              Aucun article trouvé pour ces critères de recherche.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => {
              const inCart = cartItems.find((it) => it.id === product.id);
              const inCartQty = inCart ? inCart.quantity : 0;

              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`group relative flex flex-col justify-between rounded-xl border p-3 cursor-pointer select-none transition-all active:scale-[0.98] ${
                    inCartQty > 0
                      ? 'border-[#1B4D3E] bg-[#E9F1ED]/70 shadow-xs ring-2 ring-[#1B4D3E]/20'
                      : 'border-[#E5DFD5] bg-[#F8F5EE]/70 hover:border-[#D5CDC0] hover:bg-white hover:shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-xs sm:text-sm font-bold text-[#181614] line-clamp-2 leading-tight">
                        {product.name}
                      </p>
                      {/* Crayon pour modifier le prix sans ajouter au panier */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProduct(product);
                          setEditPriceValue(product.sellingPrice);
                        }}
                        className="rounded-lg p-1 text-[#8E877B] hover:bg-[#EAE4D9] hover:text-[#1B4D3E]"
                        title="Modifier le prix"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-1.5 flex items-baseline justify-between">
                      <span className="font-display text-sm sm:text-base font-black text-[#1B4D3E] tabular-nums">
                        {formatShortF(product.sellingPrice)}
                      </span>
                      {inCartQty > 0 && (
                        <span className="rounded-full bg-[#1B4D3E] px-2 py-0.5 text-[10px] font-black text-white shadow-xs animate-in zoom-in-50 tabular-nums">
                          {inCartQty} au panier
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bouton d'ajout */}
                  <div className="mt-3 flex items-center justify-between border-t border-[#E5DFD5] pt-2">
                    <span className="text-[11px] font-bold text-[#1B4D3E] flex items-center gap-1">
                      <Plus className="h-3 w-3" />
                      <span>{inCartQty > 0 ? '+ 1 de plus' : 'Ajouter'}</span>
                    </span>

                    {inCartQty > 0 && (
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => updateCartItemQty(product.id, inCartQty - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-[#E5DFD5] text-xs font-black text-[#181614] hover:bg-[#F8F5EE]"
                          title="Retirer 1"
                        >
                          -
                        </button>
                        <span className="text-xs font-black text-[#1B4D3E] w-4 text-center tabular-nums">
                          {inCartQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1B4D3E] text-xs font-black text-white hover:bg-[#246552]"
                          title="Ajouter 1"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. LE CAHIER DU JOUR (JOURNAL DES VENTES D'AUJOURD'HUI) */}
      <div className="rounded-2xl border border-[#E5DFD5] bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
          <div>
            <h3 className="flex items-center gap-2 font-display text-base sm:text-lg font-extrabold text-[#181614]">
              <NotebookText className="h-5 w-5 text-[#1B4D3E]" />
              Cahier des ventes d'aujourd'hui
            </h3>
            <p className="text-xs text-[#6B655B]">
              Lignes de vente enregistrées aujourd'hui
            </p>
          </div>

          <span className="rounded-full bg-[#F3EFE6] border border-[#E5DFD5] px-3 py-1 text-xs font-bold text-[#6B655B] tabular-nums">
            {todaySales.length} ligne{todaySales.length > 1 ? 's' : ''}
          </span>
        </div>

        {todaySales.length === 0 ? (
          <div className="py-12 text-center text-[#8E877B]">
            <Receipt className="mx-auto h-12 w-12 text-[#D5CDC0] stroke-1" />
            <p className="mt-3 text-sm font-bold text-[#6B655B]">Le cahier est vierge pour l'instant</p>
            <p className="text-xs text-[#8E877B] mt-1">
              Touchez un article ou entrez un montant pour enregistrer votre première vente du jour !
            </p>
          </div>
        ) : (
          <div className="mt-2 divide-y divide-[#E5DFD5]">
            {todaySales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between py-3 hover:bg-[#F8F5EE] px-2 rounded-xl transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="rounded-lg bg-[#F3EFE6] border border-[#E5DFD5] px-2 py-1 font-mono text-xs font-bold text-[#6B655B] tabular-nums">
                    {formatTime(sale.date)}
                  </span>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[#181614] leading-tight">
                      {sale.items
                        .map((it) => `${it.quantity > 1 ? `${it.quantity}x ` : ''}${it.productName}`)
                        .join(', ')}
                    </p>
                    <span className="text-[11px] text-[#8E877B] font-mono">
                      Reçu n° {sale.receiptNumber}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                  <span className="font-display text-sm sm:text-base font-black text-[#1B4D3E] tabular-nums">
                    {formatFCFA(sale.totalAmount)}
                  </span>

                  {/* Bouton pour voir le ticket */}
                  <button
                    onClick={() => onViewReceipt(sale)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F3EFE6] text-[#181614] hover:bg-[#EAE4D9] transition-colors cursor-pointer"
                    title="Voir le reçu"
                  >
                    <Receipt className="h-4 w-4 text-[#1B4D3E]" />
                  </button>

                  {/* Bouton pour effacer la ligne si erreur */}
                  <button
                    onClick={() => {
                      if (window.confirm('Supprimer cette vente du cahier ?')) {
                        onDeleteSale(sale.id);
                      }
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-[#8E877B] hover:bg-[#FBF0EB] hover:text-[#C34B22] transition-colors cursor-pointer"
                    title="Annuler cette vente"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL RAPIDE DE MODIFICATION DE PRIX (QUAND ON CLIQUE SUR LE CRAYON) */}
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
                Nouveau prix de vente (en F CFA) :
              </label>
              <input
                type="number"
                min="25"
                step="25"
                value={editPriceValue}
                onChange={(e) => setEditPriceValue(Number(e.target.value) || 0)}
                className="mt-1.5 w-full rounded-xl border border-[#E5DFD5] px-4 py-3 text-center font-display text-2xl font-black text-[#1B4D3E] focus:border-[#1B4D3E] focus:outline-hidden tabular-nums"
              />

              {/* Raccourcis courants */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {[100, 200, 500, 1000, 1500, 2500].map((pr) => (
                  <button
                    key={pr}
                    type="button"
                    onClick={() => setEditPriceValue(pr)}
                    className="flex-1 rounded-lg border border-[#E5DFD5] bg-[#F3EFE6] py-1.5 text-xs font-bold text-[#181614] hover:bg-[#E9F1ED] hover:text-[#1B4D3E] hover:border-[#1B4D3E] tabular-nums cursor-pointer"
                  >
                    {formatShortF(pr)}
                  </button>
                ))}
              </div>
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
                  if (editPriceValue > 0) {
                    onQuickChangePrice(editingProduct, editPriceValue);
                    setEditingProduct(null);
                  }
                }}
                className="rounded-xl bg-[#1B4D3E] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#246552] cursor-pointer"
              >
                Enregistrer le prix
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE APERÇU BILAN / WHATSAPP & PDF */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-[#E5DFD5] max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1B4D3E] text-white">
                  <NotebookText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-extrabold text-[#181614]">
                    Bilan du jour • Export
                  </h3>
                  <p className="text-xs text-[#6B655B]">
                    Format clair pour WhatsApp ou document officiel PDF
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="rounded-lg p-1.5 text-[#8E877B] hover:bg-[#F3EFE6] hover:text-[#181614]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Aperçu du texte formaté */}
            <div className="mt-4 flex-1 overflow-y-auto">
              <label className="block text-xs font-bold text-[#6B655B] mb-1.5 uppercase tracking-wide">
                Message formaté pour WhatsApp :
              </label>
              <div className="rounded-xl border border-[#E5DFD5] bg-[#F8F5EE] p-3.5 font-mono text-xs text-[#181614] whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto select-all">
                {buildWhatsAppSummaryText({
                  todayTotal,
                  todaySales,
                  todayItemCount,
                  storeName,
                })}
              </div>
            </div>

            {/* Actions rapides */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#E5DFD5] pt-4">
              <button
                type="button"
                onClick={handleCopyWhatsAppText}
                className="flex items-center gap-1.5 rounded-xl border border-[#E5DFD5] bg-white px-3.5 py-2.5 text-xs font-bold text-[#181614] hover:bg-[#F8F5EE] cursor-pointer"
              >
                {copiedWhatsApp ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-700">Texte copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-[#6B655B]" />
                    <span>Copier le texte</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-1.5 rounded-xl border border-[#1B4D3E] bg-white px-4 py-2.5 text-xs font-bold text-[#1B4D3E] hover:bg-[#E9F1ED] cursor-pointer"
                >
                  <FileDown className="h-4 w-4" />
                  <span>Télécharger PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="flex items-center gap-1.5 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#20bd5a] cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Envoyer WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
