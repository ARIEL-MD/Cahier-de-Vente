export interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  purchasePrice: number; // Prix d'achat en FCFA (optionnel / pour info)
  sellingPrice: number;  // Prix de vente en FCFA
  stock?: number;        // Optionnel, plus de blocage de stock
  initialStock?: number;
  isQuickSale?: boolean;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  categoryId?: string;
  quantity: number;
  purchasePrice?: number;
  sellingPrice: number;
  subtotal: number;      // sellingPrice * quantity
  profit?: number;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  date: string;          // ISO timestamp
  items: SaleItem[];
  totalAmount: number;   // Somme des sous-totaux
  totalProfit?: number;
  totalCost?: number;
  itemCount: number;
  paymentMethod: 'especes' | 'wave' | 'orange_money' | 'mtn_money' | 'moov';
  note?: string;
}

export interface CartItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  categoryId?: string;
}

export interface StoreSettings {
  storeName: string;
  city: string;
  phone: string;
  currency: string;
  lowStockThreshold?: number;
  receiptFooter: string;
}

export type ActiveTab = 'today' | 'products' | 'history' | 'settings' | 'dashboard' | 'sales' | 'stock' | 'reports';

export type HistoryDateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'all';
