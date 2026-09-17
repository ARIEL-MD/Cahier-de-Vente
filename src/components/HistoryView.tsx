import React, { useState, useMemo } from 'react';
import { Sale, StoreSettings } from '../types';
import {
  formatFCFA,
  formatShortF,
  formatDateTime,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
} from '../utils/formatters';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  RotateCcw,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  FileDown,
  Share2,
} from 'lucide-react';
import {
  buildWhatsAppSummaryText,
  generateDailyReportPDF,
} from '../utils/reportExport';

interface HistoryViewProps {
  sales: Sale[];
  settings: StoreSettings;
  onViewReceipt: (sale: Sale) => void;
  onCancelSale: (saleId: string) => void;
}

type FilterPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'custom' | 'all';

export const HistoryView: React.FC<HistoryViewProps> = ({
  sales,
  settings,
  onViewReceipt,
  onCancelSale,
}) => {
  const [period, setPeriod] = useState<FilterPeriod>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Filtrage des ventes
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = new Date(sale.date);

      // Filtre Période
      let matchesPeriod = true;
      if (period === 'today') {
        matchesPeriod = isToday(sale.date);
      } else if (period === 'yesterday') {
        matchesPeriod = isYesterday(sale.date);
      } else if (period === 'week') {
        matchesPeriod = isThisWeek(sale.date);
      } else if (period === 'month') {
        matchesPeriod = isThisMonth(sale.date);
      } else if (period === 'custom') {
        if (customStartDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          if (saleDate < start) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (saleDate > end) return false;
        }
      }

      if (!matchesPeriod) return false;

      // Filtre Recherche
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesReceipt = sale.receiptNumber.toLowerCase().includes(query);
        const matchesProduct = sale.items.some((it) =>
          it.productName.toLowerCase().includes(query)
        );
        return matchesReceipt || matchesProduct;
      }

      return true;
    });
  }, [sales, period, searchQuery, customStartDate, customEndDate]);

  // Totaux période filtrée
  const totalAmount = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalProfit = filteredSales.reduce((sum, s) => sum + s.totalProfit, 0);
  const totalItemsCount = filteredSales.reduce((sum, s) => sum + s.itemCount, 0);

  const getPaymentBadge = (method: string) => {
    const dot = (color: string) => <span className={`h-1.5 w-1.5 rounded-full ${color}`} />;
    switch (method) {
      case 'wave':
        return <span className="inline-flex items-center gap-1 rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-900">{dot('bg-sky-500')} WAVE</span>;
      case 'orange_money':
        return <span className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-950">{dot('bg-orange-500')} ORANGE</span>;
      case 'mtn_money':
        return <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-950">{dot('bg-amber-500')} MTN</span>;
      case 'moov':
        return <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-950">{dot('bg-blue-500')} MOOV</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-md bg-[#E9F1ED] px-2 py-0.5 text-[10px] font-bold text-[#1B4D3E]"><Banknote className="h-3 w-3" /> ESPÈCES</span>;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#181614]">Historique des ventes</h2>
        <p className="text-xs sm:text-sm text-[#6B655B]">
          Consultez vos transactions passées, éditez les tickets ou annulez une ligne
        </p>
      </div>

      {/* Barre de filtres de période */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'today', label: "Aujourd'hui" },
            { id: 'yesterday', label: 'Hier' },
            { id: 'week', label: 'Cette semaine' },
            { id: 'month', label: 'Ce mois' },
            { id: 'custom', label: 'Période personnalisée' },
            { id: 'all', label: 'Toutes' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id as FilterPeriod)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                period === item.id
                  ? 'bg-[#1B4D3E] text-white shadow-xs'
                  : 'bg-white text-[#6B655B] border border-[#E5DFD5] hover:text-[#181614] hover:bg-[#F8F5EE]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Champs de date personnalisée si sélectionné */}
        {period === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 border border-[#E5DFD5]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#6B655B]">Du :</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded-lg border border-[#E5DFD5] bg-[#F8F5EE] px-2.5 py-1 text-xs font-medium text-[#181614] focus:border-[#1B4D3E]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#6B655B]">Au :</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-lg border border-[#E5DFD5] bg-[#F8F5EE] px-2.5 py-1 text-xs font-medium text-[#181614] focus:border-[#1B4D3E]"
              />
            </div>
          </div>
        )}

        {/* Barre de recherche dans l'historique */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E877B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par n° de ticket (ex: TK-1042) ou par fourniture..."
            className="w-full rounded-xl border border-[#E5DFD5] bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium text-[#181614] focus:border-[#1B4D3E] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Résumé de la sélection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-[#181614] p-4 sm:p-5 text-white shadow-md border border-black/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2C2825] text-[#D5CDC0]">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#D5CDC0] block">
              Total période sélectionnée
            </span>
            <p className="font-display text-2xl sm:text-3xl font-black text-white tabular-nums">
              {formatFCFA(totalAmount)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs pt-2 sm:pt-0 border-t sm:border-t-0 border-[#2C2825]">
          <div>
            <span className="text-[#D5CDC0] block text-[11px]">Bénéfice estimé</span>
            <p className="font-display font-extrabold text-[#E9F1ED] tabular-nums">+{formatFCFA(totalProfit)}</p>
          </div>
          <div className="border-l border-[#2C2825] pl-4">
            <span className="text-[#D5CDC0] block text-[11px]">Ventes</span>
            <p className="font-display font-extrabold text-white tabular-nums">{filteredSales.length} tickets</p>
          </div>
          <div className="border-l border-[#2C2825] pl-4">
            <span className="text-[#D5CDC0] block text-[11px]">Articles</span>
            <p className="font-display font-extrabold text-white tabular-nums">{totalItemsCount} unités</p>
          </div>

          {/* Boutons d'export rapide */}
          {filteredSales.length > 0 && (
            <div className="flex items-center gap-1.5 border-l border-[#2C2825] pl-4">
              <button
                type="button"
                onClick={() => {
                  generateDailyReportPDF({
                    todayTotal: totalAmount,
                    todaySales: filteredSales,
                    todayItemCount: totalItemsCount,
                    storeName: settings.storeName,
                  });
                }}
                className="flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
                title="Télécharger la sélection en PDF"
              >
                <FileDown className="h-3.5 w-3.5" />
                <span>PDF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const text = buildWhatsAppSummaryText({
                    todayTotal: totalAmount,
                    todaySales: filteredSales,
                    todayItemCount: totalItemsCount,
                    storeName: settings.storeName,
                  });
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="flex items-center gap-1 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] px-2.5 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
                title="Partager le bilan sélectionné sur WhatsApp"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Liste détaillée des ventes */}
      {filteredSales.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5DFD5] bg-white py-12 text-center">
          <Receipt className="mx-auto h-12 w-12 text-[#D5CDC0] stroke-1" />
          <p className="mt-3 text-base font-bold text-[#6B655B]">Aucune vente trouvée</p>
          <p className="text-xs text-[#8E877B] mt-1">
            Aucune vente ne correspond à ces critères de recherche ou de dates.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSales.map((sale) => (
            <div
              key={sale.id}
              className="rounded-xl border border-[#E5DFD5] bg-white p-4 shadow-xs transition-all hover:border-[#D5CDC0]"
            >
              {/* Ligne 1 : Date, Heure, N° de ticket, Paiement */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5DFD5] pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-[#181614] tabular-nums">
                    {sale.receiptNumber}
                  </span>
                  <span className="text-xs text-[#8E877B]">•</span>
                  <span className="text-xs font-semibold text-[#6B655B]">
                    {formatDateTime(sale.date)}
                  </span>
                  {getPaymentBadge(sale.paymentMethod)}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewReceipt(sale)}
                    className="flex items-center gap-1 rounded-lg bg-[#F3EFE6] px-3 py-1.5 text-xs font-bold text-[#181614] hover:bg-[#EAE4D9] active:scale-95 transition-colors cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5 text-[#1B4D3E]" />
                    <span>Reçu</span>
                  </button>

                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Annuler et effacer la vente ${sale.receiptNumber} du cahier ?`
                        )
                      ) {
                        onCancelSale(sale.id);
                      }
                    }}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#C34B22] hover:bg-[#FBF0EB] transition-colors cursor-pointer"
                    title="Annuler cette vente"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Annuler</span>
                  </button>
                </div>
              </div>

              {/* Ligne 2 : Liste des articles */}
              <div className="py-3">
                <div className="space-y-1">
                  {sale.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-[#181614]">
                        <strong className="text-[#181614] font-bold">{item.quantity}×</strong> {item.productName}
                      </span>
                      <span className="font-display font-bold text-[#181614] tabular-nums">
                        {formatShortF(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ligne 3 : Totaux & Bénéfice */}
              <div className="flex items-center justify-between border-t border-[#E5DFD5] pt-2.5 text-xs">
                <span className="text-[#6B655B]">
                  Bénéfice estimé :{' '}
                  <strong className="text-[#1B4D3E] font-bold tabular-nums">+{formatFCFA(sale.totalProfit)}</strong>
                </span>
                <div className="text-right">
                  <span className="text-[10px] text-[#8E877B] uppercase font-bold block tracking-wider">
                    Total encaissé
                  </span>
                  <span className="font-display text-base sm:text-lg font-black text-[#1B4D3E] tabular-nums">
                    {formatFCFA(sale.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
