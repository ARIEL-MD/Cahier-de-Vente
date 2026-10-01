import React, { useMemo, useState } from 'react';
import { Category, Sale } from '../types';
import { formatFCFA, formatShortF, formatTime } from '../utils/formatters';
import { CategoryIcon } from '../utils/categoryIcons';
import { ArrowLeft, ChevronLeft, ChevronRight, FolderOpen } from 'lucide-react';

interface FoldersViewProps {
  sales: Sale[];
  categories: Category[];
}

interface Line {
  key: string;
  date: string;
  name: string;
  quantity: number;
  amount: number;
  folderId: string;
}

const CAHIERS_ID = 'folder-cahiers';
const AUTRES_ID = 'folder-autres';
const CAHIER_CATS = ['cat-privilege', 'cat-preference'];

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Détermine dans quel dossier tombe une ligne de vente
function folderOf(name: string, categoryId?: string): string {
  if (categoryId && CAHIER_CATS.includes(categoryId)) return CAHIERS_ID;
  if (categoryId) return categoryId;
  const n = name.toLowerCase();
  if (n.includes('cahier')) return CAHIERS_ID;
  if (n.includes('photocop')) return 'cat-photocopie';
  if (n.includes('panini')) return 'cat-panini';
  return AUTRES_ID;
}

export const FoldersView: React.FC<FoldersViewProps> = ({ sales, categories }) => {
  const [day, setDay] = useState<Date>(() => new Date());
  const [openFolder, setOpenFolder] = useState<string | null>(null);

  const isToday = dayKey(day) === dayKey(new Date());

  const shiftDay = (delta: number) => {
    const d = new Date(day);
    d.setDate(d.getDate() + delta);
    if (d > new Date()) return;
    setDay(d);
    setOpenFolder(null);
  };

  const dayLabel = isToday
    ? "Aujourd'hui"
    : new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(day);

  // Toutes les lignes de vente du jour choisi
  const lines = useMemo<Line[]>(() => {
    const key = dayKey(day);
    const out: Line[] = [];
    for (const s of sales) {
      if (dayKey(new Date(s.date)) !== key) continue;
      s.items.forEach((it, i) =>
        out.push({
          key: `${s.id}-${i}`,
          date: s.date,
          name: it.productName,
          quantity: it.quantity,
          amount: it.subtotal,
          folderId: folderOf(it.productName, it.categoryId),
        })
      );
    }
    return out.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [sales, day]);

  // Définition des dossiers (Cahiers regroupe Privilège + Préférence)
  const folders = useMemo(() => {
    const defs: { id: string; name: string; icon: string }[] = [
      { id: CAHIERS_ID, name: 'Cahiers', icon: 'book' },
      ...[...categories]
        .sort((a, b) => a.order - b.order)
        .filter((c) => !CAHIER_CATS.includes(c.id))
        .map((c) => ({ id: c.id, name: c.name, icon: c.icon })),
      { id: AUTRES_ID, name: 'Autres ventes', icon: 'package' },
    ];
    return defs
      .map((f) => {
        const fl = lines.filter((l) => l.folderId === f.id);
        return {
          ...f,
          lines: fl,
          total: fl.reduce((s, l) => s + l.amount, 0),
          count: fl.reduce((s, l) => s + l.quantity, 0),
        };
      })
      .filter((f) => f.lines.length > 0);
  }, [categories, lines]);

  const dayTotal = lines.reduce((s, l) => s + l.amount, 0);
  const current = folders.find((f) => f.id === openFolder) || null;

  // Récap par type d'article dans le dossier ouvert
  const recap = useMemo(() => {
    if (!current) return [];
    const map = new Map<string, { name: string; quantity: number; amount: number }>();
    for (const l of current.lines) {
      const e = map.get(l.name) || { name: l.name, quantity: 0, amount: 0 };
      e.quantity += l.quantity;
      e.amount += l.amount;
      map.set(l.name, e);
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount);
  }, [current]);

  return (
    <div className="space-y-4 pb-24">
      {/* Choix du jour */}
      <div className="flex items-center justify-between rounded-2xl border border-[#E5DFD5] bg-white p-2 shadow-xs">
        <button
          type="button"
          onClick={() => shiftDay(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3EFE6] text-[#181614] active:scale-90 cursor-pointer"
          aria-label="Jour précédent"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="font-display text-sm font-extrabold capitalize text-[#181614]">{dayLabel}</p>
          {!isToday && (
            <button
              type="button"
              onClick={() => { setDay(new Date()); setOpenFolder(null); }}
              className="text-[11px] font-bold text-[#1B4D3E] underline cursor-pointer"
            >
              Revenir à aujourd'hui
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => shiftDay(1)}
          disabled={isToday}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3EFE6] text-[#181614] active:scale-90 disabled:opacity-30 cursor-pointer"
          aria-label="Jour suivant"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {!current ? (
        <>
          {/* Total du jour */}
          <div className="rounded-2xl bg-[#1B4D3E] p-5 text-white shadow-lg">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E9F1ED]/80">
              Total {isToday ? "d'aujourd'hui" : 'du jour'}
            </span>
            <p className="font-display mt-1 text-3xl font-black tabular-nums">{formatFCFA(dayTotal)}</p>
          </div>

          {folders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E5DFD5] bg-white py-12 text-center">
              <FolderOpen className="mx-auto h-12 w-12 stroke-1 text-[#D5CDC0]" />
              <p className="mt-3 text-sm font-bold text-[#6B655B]">Aucune vente ce jour-là</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {folders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setOpenFolder(f.id)}
                  className="flex flex-col items-start gap-2 rounded-2xl border border-[#E5DFD5] bg-white p-4 text-left shadow-xs transition-all hover:border-[#1B4D3E] active:scale-[0.97] cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E9F1ED]">
                    <CategoryIcon icon={f.icon} className="h-5 w-5 text-[#1B4D3E]" />
                  </div>
                  <span className="text-sm font-extrabold leading-tight text-[#181614]">{f.name}</span>
                  <span className="font-display text-xl font-black tabular-nums text-[#1B4D3E]">
                    {formatShortF(f.total)}
                  </span>
                  <span className="text-[11px] font-bold text-[#8E877B]">
                    {f.count} article{f.count > 1 ? 's' : ''} vendu{f.count > 1 ? 's' : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpenFolder(null)}
              className="flex items-center gap-1.5 rounded-xl border border-[#E5DFD5] bg-white px-3 py-2 text-xs font-bold text-[#181614] cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Dossiers
            </button>
          </div>

          <div className="rounded-2xl bg-[#1B4D3E] p-5 text-white shadow-lg">
            <div className="flex items-center gap-2">
              <CategoryIcon icon={current.icon} className="h-5 w-5 text-white" />
              <span className="font-display text-base font-extrabold">{current.name}</span>
            </div>
            <p className="font-display mt-2 text-3xl font-black tabular-nums">{formatFCFA(current.total)}</p>
            <p className="text-xs font-medium text-[#E9F1ED]/90">
              {current.count} article{current.count > 1 ? 's' : ''} • {current.lines.length} vente
              {current.lines.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Récap par type */}
          <div className="rounded-2xl border border-[#E5DFD5] bg-white p-4 shadow-xs">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#6B655B]">Par type</h3>
            <div className="mt-2 divide-y divide-[#E5DFD5]">
              {recap.map((r) => (
                <div key={r.name} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#181614]">{r.name}</p>
                    <p className="text-[11px] font-medium text-[#8E877B]">× {r.quantity}</p>
                  </div>
                  <span className="font-display text-sm font-black tabular-nums text-[#1B4D3E]">
                    {formatFCFA(r.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Détail des ventes */}
          <div className="rounded-2xl border border-[#E5DFD5] bg-white p-4 shadow-xs">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#6B655B]">Détail des ventes</h3>
            <div className="mt-2 divide-y divide-[#E5DFD5]">
              {current.lines.map((l) => (
                <div key={l.key} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="rounded-lg border border-[#E5DFD5] bg-[#F3EFE6] px-2 py-1 font-mono text-xs font-bold tabular-nums text-[#6B655B]">
                      {formatTime(l.date)}
                    </span>
                    <p className="truncate text-sm font-bold text-[#181614]">
                      {l.quantity > 1 ? `${l.quantity}x ` : ''}
                      {l.name}
                    </p>
                  </div>
                  <span className="font-display text-sm font-black tabular-nums text-[#181614]">
                    {formatFCFA(l.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
