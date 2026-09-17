import React, { useState, useEffect, useMemo } from 'react';
import {
  ActiveTab,
  Category,
  Product,
  Sale,
  SaleItem,
  StoreSettings,
} from './types';
import {
  loadCategories,
  loadProducts,
  loadSales,
  loadSettings,
  saveCategories,
  saveProducts,
  saveSales,
  saveSettings,
  resetToDefaults,
} from './utils/storage';
import { fetchRemoteData, pushRemoteData, isRemoteConfigured } from './utils/api';
import { formatFCFA, formatShortF, isToday } from './utils/formatters';
import { playSaleChime } from './utils/audio';

import { Navigation } from './components/Navigation';
import { TodayNotebookView } from './components/TodayNotebookView';
import { ProductCatalogView } from './components/ProductCatalogView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { ReceiptModal } from './components/ReceiptModal';
import { CheckCircle2, AlertCircle, Cloud, CloudOff, RefreshCw } from 'lucide-react';

export default function App() {
  // Application State with LocalStorage Persistence
  const [settings, setSettings] = useState<StoreSettings>(() => loadSettings());
  const [categories, setCategories] = useState<Category[]>(() => loadCategories());
  const [products, setProducts] = useState<Product[]>(() => loadProducts());
  const [sales, setSales] = useState<Sale[]>(() => loadSales());

  // Active view tab (Défaut : 'today' - Le Cahier de vente du jour)
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');

  // Modals state
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);

  // Instant notification toast with optional undo
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info';
    onUndo?: () => void;
  } | null>(null);

  const showToast = (
    text: string,
    type: 'success' | 'info' = 'success',
    onUndo?: () => void
  ) => {
    setToastMessage({ text, type, onUndo });
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Indique si le chargement initial (local + serveur) est terminé
  const [hydrated, setHydrated] = useState(false);
  // Statut de synchronisation avec le serveur, affiché discrètement dans l'UI
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'offline'>(
    isRemoteConfigured() ? 'syncing' : 'offline'
  );

  // Au démarrage : tente de récupérer les données depuis le serveur.
  // Si le serveur a des données, elles remplacent l'état local (source de vérité partagée).
  // Si le serveur est injoignable ou n'a rien, on garde les données locales.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isRemoteConfigured()) {
        const remote = await fetchRemoteData();
        if (!cancelled) {
          if (remote) {
            setSettings(remote.settings);
            setCategories(remote.categories);
            setProducts(remote.products);
            setSales(remote.sales);
            setSyncStatus('idle');
          } else {
            setSyncStatus('error');
          }
        }
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Synchronisation avec LocalStorage (instantanée, fonctionne hors-ligne)
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  useEffect(() => {
    saveSales(sales);
  }, [sales]);

  // Synchronisation avec le serveur (avec un léger délai pour regrouper les changements rapides)
  useEffect(() => {
    if (!hydrated || !isRemoteConfigured()) return;
    setSyncStatus('syncing');
    const timeout = setTimeout(async () => {
      const ok = await pushRemoteData({ settings, categories, products, sales });
      setSyncStatus(ok ? 'idle' : 'error');
    }, 800);
    return () => clearTimeout(timeout);
  }, [hydrated, settings, categories, products, sales]);

  // Ventes du jour pour le badge
  const todaySalesCount = useMemo(() => {
    return sales.filter((s) => isToday(s.date)).length;
  }, [sales]);

  // --- ACTIONS DU CAHIER DE VENTE (AUCUN BLOCAGE DE STOCK) ---

  // Enregistrement direct d'une vente (comme écrire sur un cahier)
  const handleDirectNotebookSale = (
    productName: string,
    amount: number,
    quantity: number = 1,
    categoryId?: string
  ) => {
    const nextReceiptNum = `TK-${1000 + sales.length + 1}`;

    const newSaleItem: SaleItem = {
      productId: `item-${Date.now()}`,
      productName,
      categoryId,
      quantity,
      sellingPrice: Math.round(amount / quantity),
      subtotal: amount,
    };

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      receiptNumber: nextReceiptNum,
      date: new Date().toISOString(),
      items: [newSaleItem],
      totalAmount: amount,
      itemCount: quantity,
      paymentMethod: 'especes',
    };

    // Ajout direct au cahier sans blocage ni contrainte de stock
    setSales((prev) => [newSale, ...prev]);

    // Son de confirmation et toast avec bouton Annuler
    playSaleChime();
    showToast(
      `Vente notée au cahier : ${quantity > 1 ? `${quantity}x ` : ''}${productName} (${formatShortF(amount)})`,
      'success',
      () => {
        setSales((prev) => prev.filter((s) => s.id !== newSale.id));
      }
    );
  };

  // Enregistrement d'une vente complète issue du panier
  const handleValidateCartSale = (
    cartItems: { id: string; name: string; unitPrice: number; quantity: number; categoryId?: string }[],
    paymentMethod: 'especes' | 'wave' | 'orange_money' | 'mtn_money' | 'moov' = 'especes'
  ) => {
    if (cartItems.length === 0) return;

    const nextReceiptNum = `TK-${1000 + sales.length + 1}`;
    const totalAmount = cartItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    const totalCount = cartItems.reduce((sum, it) => sum + it.quantity, 0);

    const saleItems: SaleItem[] = cartItems.map((it) => ({
      productId: it.id,
      productName: it.name,
      categoryId: it.categoryId,
      quantity: it.quantity,
      sellingPrice: it.unitPrice,
      subtotal: it.unitPrice * it.quantity,
    }));

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      receiptNumber: nextReceiptNum,
      date: new Date().toISOString(),
      items: saleItems,
      totalAmount,
      itemCount: totalCount,
      paymentMethod,
    };

    setSales((prev) => [newSale, ...prev]);
    playSaleChime();

    const summaryNames = cartItems
      .map((it) => `${it.quantity > 1 ? `${it.quantity}x ` : ''}${it.name}`)
      .join(', ');

    showToast(
      `Vente enregistrée (${formatShortF(totalAmount)}) : ${summaryNames}`,
      'success',
      () => {
        setSales((prev) => prev.filter((s) => s.id !== newSale.id));
      }
    );
  };

  // Suppression / Annulation d'une ligne du cahier
  const handleDeleteSale = (saleId: string) => {
    setSales((prev) => prev.filter((s) => s.id !== saleId));
    showToast('Ligne supprimée du cahier', 'info');
  };

  // Modification rapide d'un prix en 1 clic
  const handleQuickChangePrice = (product: Product, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, sellingPrice: newPrice } : p))
    );
    showToast(`Prix de "${product.name}" fixé à ${formatShortF(newPrice)}`);
  };

  // Ajout simple d'un nouvel article (sans demander de stock)
  const handleAddSimpleProduct = (newProd: {
    name: string;
    categoryId: string;
    sellingPrice: number;
  }) => {
    const product: Product = {
      id: `prod-${Date.now()}`,
      name: newProd.name,
      categoryId: newProd.categoryId,
      purchasePrice: 0,
      sellingPrice: newProd.sellingPrice,
      createdAt: new Date().toISOString(),
    };
    setProducts((prev) => [product, ...prev]);
    showToast(`Article "${product.name}" ajouté (${formatShortF(product.sellingPrice)})`);
  };

  // Mise à jour de prix par ID
  const handleUpdateProductPrice = (productId: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, sellingPrice: newPrice } : p))
    );
    showToast('Prix mis à jour');
  };

  // Suppression d'un article
  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    showToast('Article supprimé de la liste', 'info');
  };

  // Gestion des catégories
  const handleAddCategory = (newCat: { name: string; icon: string }) => {
    const id = `cat-${Date.now()}`;
    const newCategory: Category = {
      id,
      name: newCat.name,
      icon: newCat.icon,
      order: categories.length + 1,
    };
    setCategories((prev) => [...prev, newCategory]);
    showToast(`Catégorie "${newCat.name}" ajoutée`);
  };

  const handleUpdateCategory = (id: string, name: string, icon: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name, icon } : c))
    );
    showToast('Catégorie mise à jour');
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    showToast('Catégorie supprimée', 'info');
  };

  // Réinitialisation aux données d'origine
  const handleResetData = () => {
    const defaults = resetToDefaults();
    setSettings(defaults.settings);
    setCategories(defaults.categories);
    setProducts(defaults.products);
    setSales(defaults.sales);
    showToast('Application réinitialisée');
  };

  // Importation fichier JSON de sauvegarde
  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.products && json.categories) {
          if (json.settings) setSettings(json.settings);
          if (json.categories) setCategories(json.categories);
          if (json.products) setProducts(json.products);
          if (json.sales) setSales(json.sales);
          showToast('Données restaurées avec succès !');
        } else {
          alert('Le fichier importé ne semble pas être une sauvegarde valide.');
        }
      } catch (err) {
        alert('Erreur lors de la lecture du fichier JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Mapping des onglets vers la vue appropriée
  const isTodayView =
    activeTab === 'today' || activeTab === 'dashboard' || activeTab === 'sales';
  const isProductsView = activeTab === 'products' || activeTab === 'stock';
  const isHistoryView = activeTab === 'history' || activeTab === 'reports';
  const isSettingsView = activeTab === 'settings';

  return (
    <div className="min-h-screen bg-[#F8F5EE] text-[#181614] flex flex-col font-sans">
      {/* Barre de navigation simplifiée */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        todaySalesCount={todaySalesCount}
      />

      {/* Conteneur principal épuré et centré */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-3.5 py-4 sm:px-6 sm:py-6">
        {/* VUE 1 : CAHIER DU JOUR (Ventes du jour, Total du jour, boutons rapides) */}
        {isTodayView && (
          <TodayNotebookView
            products={products}
            categories={categories}
            sales={sales}
            storeName={settings.storeName}
            onDirectSale={handleDirectNotebookSale}
            onValidateCartSale={handleValidateCartSale}
            onDeleteSale={handleDeleteSale}
            onViewReceipt={(sale) => setSelectedReceiptSale(sale)}
            onQuickChangePrice={handleQuickChangePrice}
            onOpenAddProduct={() => setActiveTab('products')}
            onOpenProductList={() => setActiveTab('products')}
          />
        )}

        {/* VUE 2 : MES ARTICLES & PRIX (Modifier et fixer ses prix sans stock) */}
        {isProductsView && (
          <ProductCatalogView
            products={products}
            categories={categories}
            onAddProduct={handleAddSimpleProduct}
            onUpdateProductPrice={handleUpdateProductPrice}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {/* VUE 3 : HISTORIQUE (Pour consulter les jours passés) */}
        {isHistoryView && (
          <HistoryView
            sales={sales}
            settings={settings}
            onViewReceipt={(sale) => setSelectedReceiptSale(sale)}
            onCancelSale={handleDeleteSale}
          />
        )}

        {/* VUE 4 : PARAMÈTRES (Nom de boutique, sauvegarde) */}
        {isSettingsView && (
          <SettingsView
            settings={settings}
            onSaveSettings={setSettings}
            categories={categories}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onResetData={handleResetData}
            onImportData={handleImportData}
          />
        )}
      </main>

      {/* Modal Reçu / Ticket de caisse imprimable ou partageable */}
      <ReceiptModal
        sale={selectedReceiptSale}
        settings={settings}
        onClose={() => setSelectedReceiptSale(null)}
      />

      {/* Indicateur discret de synchronisation avec le serveur */}
      {isRemoteConfigured() && (
        <div
          className={`fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-40 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm backdrop-blur-xs transition-colors ${
            syncStatus === 'error'
              ? 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FCA5A5]'
              : syncStatus === 'syncing'
              ? 'bg-white/90 text-[#6B655B] border border-[#E5DFD5]'
              : 'bg-[#E9F1ED] text-[#1B4D3E] border border-[#1B4D3E]/20'
          }`}
        >
          {syncStatus === 'syncing' && <RefreshCw className="h-3 w-3 animate-spin" />}
          {syncStatus === 'idle' && <Cloud className="h-3 w-3" />}
          {syncStatus === 'error' && <CloudOff className="h-3 w-3" />}
          <span>
            {syncStatus === 'syncing'
              ? 'Synchronisation…'
              : syncStatus === 'error'
              ? 'Hors-ligne'
              : 'Sauvegardé'}
          </span>
        </div>
      )}

      {/* Toast de confirmation instantanée */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-xl bg-[#181614] border border-white/10 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-2xl backdrop-blur-xs transition-all animate-in fade-in slide-in-from-bottom-3">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-[#246552] shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-[#B45309] shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          {toastMessage.onUndo && (
            <button
              onClick={() => {
                toastMessage.onUndo?.();
                setToastMessage(null);
              }}
              className="ml-2 rounded-lg bg-[#C34B22] px-2.5 py-1 text-xs font-black text-white hover:bg-[#A83E1B] active:scale-95 transition-colors"
            >
              Annuler
            </button>
          )}
        </div>
      )}
    </div>
  );
}
