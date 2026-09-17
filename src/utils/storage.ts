import { Category, Product, Sale, StoreSettings } from '../types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_SETTINGS, getInitialSales } from '../data/initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'caisse_scolaire_products_v9',
  CATEGORIES: 'caisse_scolaire_categories_v9',
  SALES: 'caisse_scolaire_sales_v6',
  SETTINGS: 'caisse_scolaire_settings_v5',
};

// Set d'IDs d'articles officiels autorisés
const VALID_PRODUCT_IDS = new Set(INITIAL_PRODUCTS.map((p) => p.id));
const VALID_CATEGORY_IDS = new Set(INITIAL_CATEGORIES.map((c) => c.id));

export function loadSettings(): StoreSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      saveSettings(INITIAL_SETTINGS);
      return INITIAL_SETTINGS;
    }
    return { ...INITIAL_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Erreur chargement paramètres:', err);
    return INITIAL_SETTINGS;
  }
}

export function saveSettings(settings: StoreSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Erreur sauvegarde paramètres:', err);
  }
}

export function loadCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      saveCategories(INITIAL_CATEGORIES);
      return INITIAL_CATEGORIES;
    }
    const parsed: Category[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveCategories(INITIAL_CATEGORIES);
      return INITIAL_CATEGORIES;
    }
    // Nettoie et ne garde que les catégories officielles demandées
    const validOnly = parsed.filter((c) => VALID_CATEGORY_IDS.has(c.id));
    const existingIds = new Set(validOnly.map((c) => c.id));
    const missing = INITIAL_CATEGORIES.filter((c) => !existingIds.has(c.id));
    const merged = missing.length > 0 ? [...missing, ...validOnly] : validOnly;
    saveCategories(merged);
    return merged;
  } catch (err) {
    console.error('Erreur chargement catégories:', err);
    return INITIAL_CATEGORIES;
  }
}

export function saveCategories(categories: Category[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  } catch (err) {
    console.error('Erreur sauvegarde catégories:', err);
  }
}

export function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!raw) {
      saveProducts(INITIAL_PRODUCTS);
      return INITIAL_PRODUCTS;
    }
    const parsed: Product[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveProducts(INITIAL_PRODUCTS);
      return INITIAL_PRODUCTS;
    }
    // Nettoie strictement : élimine tous les anciens articles non demandés
    const validOnly = parsed.filter((p) => VALID_PRODUCT_IDS.has(p.id));
    const existingIds = new Set(validOnly.map((p) => p.id));
    const missing = INITIAL_PRODUCTS.filter((p) => !existingIds.has(p.id));
    const merged = missing.length > 0 ? [...missing, ...validOnly] : validOnly;
    saveProducts(merged);
    return merged;
  } catch (err) {
    console.error('Erreur chargement produits:', err);
    return INITIAL_PRODUCTS;
  }
}

export function saveProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (err) {
    console.error('Erreur sauvegarde produits:', err);
  }
}

export function loadSales(): Sale[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES);
    if (!raw) {
      const initialSales = getInitialSales();
      saveSales(initialSales);
      return initialSales;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Erreur chargement ventes:', err);
    return [];
  }
}

export function saveSales(sales: Sale[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  } catch (err) {
    console.error('Erreur sauvegarde ventes:', err);
  }
}

/**
 * Exporte toutes les données sous forme de fichier JSON téléchargeable
 */
export function exportDataBackup(): void {
  const data = {
    exportDate: new Date().toISOString(),
    version: '2.0',
    settings: loadSettings(),
    categories: loadCategories(),
    products: loadProducts(),
    sales: loadSales(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `sauvegarde_caisse_scolaire_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Réinitialise aux données d'origine
 */
export function resetToDefaults(): {
  settings: StoreSettings;
  categories: Category[];
  products: Product[];
  sales: Sale[];
} {
  const initialSales = getInitialSales();
  saveSettings(INITIAL_SETTINGS);
  saveCategories(INITIAL_CATEGORIES);
  saveProducts(INITIAL_PRODUCTS);
  saveSales(initialSales);

  return {
    settings: INITIAL_SETTINGS,
    categories: INITIAL_CATEGORIES,
    products: INITIAL_PRODUCTS,
    sales: initialSales,
  };
}
