import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sale } from '../types';
import { formatFCFA, formatShortF } from './formatters';

interface DailySummary {
  todayTotal: number;
  todaySales: Sale[];
  todayItemCount: number;
  storeName: string;
}

/**
 * Construit le récapitulatif cumulé des articles vendus dans la journée
 */
function getConsolidatedItems(sales: Sale[]): { name: string; quantity: number; total: number }[] {
  const map: Record<string, { quantity: number; total: number }> = {};

  sales.forEach((s) => {
    s.items.forEach((it) => {
      if (!map[it.productName]) {
        map[it.productName] = { quantity: 0, total: 0 };
      }
      map[it.productName].quantity += it.quantity;
      map[it.productName].total += it.subtotal;
    });
  });

  return Object.entries(map)
    .map(([name, data]) => ({
      name,
      quantity: data.quantity,
      total: data.total,
    }))
    .sort((a, b) => b.quantity - a.quantity || b.total - a.total);
}

/**
 * Formatage du bilan WhatsApp :
 * - Pas d'heures
 * - Pas de section "règlement"
 * - Pas de section "dernières transactions"
 * - Récapitulatif clair de TOUT ce qui a été acheté dans la journée avec les totaux
 */
export function buildWhatsAppSummaryText({
  todayTotal,
  todaySales,
  todayItemCount,
  storeName,
}: DailySummary): string {
  const todayStr = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const items = getConsolidatedItems(todaySales);

  let msg = `*BILAN DES VENTES DU JOUR*\n`;
  msg += `*${storeName.toUpperCase()}*\n`;
  msg += `Date : *${todayStr}*\n`;
  msg += `------------------------------------\n\n`;

  msg += `*TOTAL ENCAISSÉ : ${formatFCFA(todayTotal)}*\n`;
  msg += `Articles vendus : *${todayItemCount}*\n`;
  msg += `Nombre de clients/tickets : *${todaySales.length}*\n\n`;

  msg += `*DÉTAIL DES ARTICLES VENDUS :*\n`;
  if (items.length === 0) {
    msg += `(Aucune vente enregistrée)\n`;
  } else {
    items.forEach((item, index) => {
      msg += `${index + 1}. *${item.name}* : ${item.quantity} vendu${item.quantity > 1 ? 's' : ''} — *${formatShortF(item.total)}*\n`;
    });
  }

  msg += `\n------------------------------------\n`;
  msg += `*TOTAL GÉNÉRAL : ${formatFCFA(todayTotal)}*`;

  return msg;
}

/**
 * Génération du PDF officiel épuré :
 * - Liste complète et détaillée de tous les articles vendus dans la journée
 * - Pas d'heures, pas de modes de règlement superflus
 */
export function generateDailyReportPDF({
  todayTotal,
  todaySales,
  todayItemCount,
  storeName,
}: DailySummary): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const todayStr = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const items = getConsolidatedItems(todaySales);

  // Couleurs de thème (Vert Registre Comptable & Ardoise)
  const primaryColor = [27, 77, 62]; // #1B4D3E
  const darkTextColor = [24, 22, 20]; // #181614
  const lightBgColor = [248, 245, 238]; // #F8F5EE

  // Header bandeau principal
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(storeName.toUpperCase(), 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`BILAN JOURNALIER DES ARTICLES VENDUS • ${todayStr}`, 14, 22);

  // Bloc Synthèse
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.roundedRect(14, 36, 182, 24, 3, 3, 'F');

  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL ENCAISSÉ', 22, 44);
  doc.text('ARTICLES VENDUS', 100, 44);
  doc.text('NOMBRE DE VENTES', 155, 44);

  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(formatFCFA(todayTotal), 22, 53);

  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(`${todayItemCount} unité${todayItemCount > 1 ? 's' : ''}`, 100, 53);
  doc.text(`${todaySales.length} ticket${todaySales.length > 1 ? 's' : ''}`, 155, 53);

  // Tableau récapitulatif complet des articles achetés
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Détail des fournitures vendues aujourd\'hui', 14, 69);

  const tableRows = items.map((it, idx) => [
    `${idx + 1}`,
    it.name,
    `${it.quantity}`,
    formatFCFA(it.total),
  ]);

  autoTable(doc, {
    startY: 73,
    head: [['N°', 'Désignation de l\'article', 'Quantité vendue', 'Total']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [27, 77, 62],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10,
    },
    styles: { fontSize: 9.5, cellPadding: 3.5, textColor: [30, 30, 30] },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' },
      1: { cellWidth: 108 },
      2: { cellWidth: 32, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
    foot: [['', 'TOTAL DU JOUR', `${todayItemCount}`, formatFCFA(todayTotal)]],
    footStyles: {
      fillColor: [243, 239, 230],
      textColor: [27, 77, 62],
      fontStyle: 'bold',
      fontSize: 10,
    },
  });

  // Pied de page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Caisse Scolaire CI • Bilan du ${todayStr} • Page ${i} sur ${pageCount}`,
      14,
      290
    );
  }

  const safeDate = new Date().toISOString().split('T')[0];
  doc.save(`Bilan_${safeDate}.pdf`);
}
