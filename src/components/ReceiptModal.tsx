import React from 'react';
import { Sale, StoreSettings } from '../types';
import { formatFCFA, formatDateTime } from '../utils/formatters';
import { Printer, Share2, X, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale | null;
  settings: StoreSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, settings, onClose }) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    let text = `*${settings.storeName}*\n`;
    text += `Reçu N°: ${sale.receiptNumber}\n`;
    text += `Date: ${formatDateTime(sale.date)}\n`;
    text += `------------------------\n`;
    sale.items.forEach((item) => {
      text += `${item.quantity}x ${item.productName} = ${formatFCFA(item.subtotal)}\n`;
    });
    text += `------------------------\n`;
    text += `*TOTAL: ${formatFCFA(sale.totalAmount)}*\n`;
    text += `Paiement: ${sale.paymentMethod.toUpperCase()}\n`;
    text += `${settings.receiptFooter}\n`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-[#E5DFD5]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-[#8E877B] hover:bg-[#F3EFE6] hover:text-[#181614] cursor-pointer"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Printable Ticket Area */}
        <div id="thermal-receipt" className="border-b border-dashed border-[#D5CDC0] pb-4 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#E9F1ED] text-[#1B4D3E]">
            <CheckCircle2 className="h-7 w-7 stroke-[2.5]" />
          </div>
          <h3 className="font-display text-lg font-extrabold text-[#181614]">{settings.storeName}</h3>
          <p className="text-xs text-[#6B655B]">{settings.city}</p>
          {settings.phone && <p className="text-xs text-[#6B655B]">Tél : {settings.phone}</p>}

          <div className="mt-3 inline-block rounded-md bg-[#F3EFE6] border border-[#E5DFD5] px-3 py-1 font-mono text-xs font-bold text-[#181614] tabular-nums">
            Reçu {sale.receiptNumber}
          </div>
          <p className="mt-1 text-xs text-[#8E877B] tabular-nums">{formatDateTime(sale.date)}</p>
        </div>

        {/* Items list */}
        <div className="my-4 max-h-60 space-y-2.5 overflow-y-auto pr-1 divide-y divide-[#E5DFD5]">
          {sale.items.map((item, idx) => (
            <div key={idx} className="pt-2 first:pt-0 flex items-start justify-between text-xs sm:text-sm">
              <div className="pr-2">
                <p className="font-bold text-[#181614]">{item.productName}</p>
                <p className="text-[11px] text-[#6B655B] tabular-nums">
                  {item.quantity} × {formatFCFA(item.sellingPrice, false)} F
                </p>
              </div>
              <span className="font-display font-extrabold text-[#181614] whitespace-nowrap tabular-nums">
                {formatFCFA(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-dashed border-[#D5CDC0] pt-3">
          <div className="flex items-center justify-between text-xs text-[#6B655B]">
            <span>Articles :</span>
            <span className="font-bold text-[#181614] tabular-nums">{sale.itemCount}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-[#6B655B]">
            <span>Règlement :</span>
            <span className="font-bold uppercase text-[#181614]">{sale.paymentMethod}</span>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-[#1B4D3E] p-3 text-white shadow-xs">
            <span className="text-xs font-bold tracking-wider uppercase text-[#E9F1ED]">TOTAL ENCAISSÉ</span>
            <span className="font-display text-xl font-black text-white tabular-nums">
              {formatFCFA(sale.totalAmount)}
            </span>
          </div>

          <p className="mt-3 text-center text-xs text-[#8E877B] italic">
            {settings.receiptFooter}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#1B4D3E]/30 bg-[#E9F1ED] py-2.5 text-xs font-bold text-[#1B4D3E] hover:bg-[#D4E5DC] active:scale-95 transition-all cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
            WhatsApp
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#181614] py-2.5 text-xs font-bold text-white hover:bg-black active:scale-95 transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </button>
        </div>
      </div>
    </div>
  );
};
