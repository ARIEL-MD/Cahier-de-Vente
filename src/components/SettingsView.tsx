import React, { useState } from 'react';
import { Category, StoreSettings } from '../types';
import { exportDataBackup } from '../utils/storage';
import { CategoryIcon, CATEGORY_ICON_OPTIONS } from '../utils/categoryIcons';
import {
  Store,
  Sliders,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  FolderTree,
} from 'lucide-react';

const CATEGORY_ICON_LABELS: Record<string, string> = {
  book: 'Livre',
  pencil: 'Crayon',
  ruler: 'Règle',
  palette: 'Palette',
  backpack: 'Sac à dos',
  'file-text': 'Papier',
  package: 'Colis',
  tag: 'Étiquette',
  bag: 'Sac',
  box: 'Boîte',
  layers: 'Piles',
  star: 'Étoile',
};

interface SettingsViewProps {
  settings: StoreSettings;
  onSaveSettings: (newSettings: StoreSettings) => void;
  categories: Category[];
  onAddCategory: (category: { name: string; icon: string }) => void;
  onUpdateCategory: (id: string, name: string, icon: string) => void;
  onDeleteCategory: (id: string) => void;
  onResetData: () => void;
  onImportData: (file: File) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onResetData,
  onImportData,
}) => {
  // Local state for settings form
  const [storeName, setStoreName] = useState(settings.storeName);
  const [city, setCity] = useState(settings.city);
  const [phone, setPhone] = useState(settings.phone);
  const [lowStockThreshold, setLowStockThreshold] = useState(settings.lowStockThreshold);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // State for category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('package');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatIcon, setEditCatIcon] = useState('package');

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      storeName: storeName.trim() || 'Papeterie Scolaire',
      city: city.trim(),
      phone: phone.trim(),
      lowStockThreshold: Math.max(1, Number(lowStockThreshold) || 5),
      receiptFooter: receiptFooter.trim(),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory({
      name: newCatName.trim(),
      icon: newCatIcon || 'package',
    });
    setNewCatName('');
  };

  const handleStartEditCat = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatIcon(cat.icon);
  };

  const handleSaveEditCat = (id: string) => {
    if (!editCatName.trim()) return;
    onUpdateCategory(id, editCatName.trim(), editCatIcon || 'package');
    setEditingCatId(null);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (
        window.confirm(
          'Importer ce fichier remplacera les données actuelles par celles de la sauvegarde. Continuer ?'
        )
      ) {
        onImportData(file);
      }
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#181614]">Paramètres & Configuration</h2>
        <p className="text-xs sm:text-sm text-[#6B655B]">
          Personnalisation de la boutique, seuils d'alertes, rayons et sauvegarde du registre
        </p>
      </div>

      {/* 15. Paramètres généraux de la boutique */}
      <section className="rounded-2xl border border-[#E5DFD5] bg-white p-5 sm:p-6 shadow-xs">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E9F1ED] text-[#1B4D3E]">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-[#181614]">Coordonnées de la boutique</h3>
            <p className="text-xs text-[#6B655B]">
              Ces informations apparaîtront sur les tickets de caisse et reçus
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#E9F1ED] border border-[#1B4D3E]/30 p-3 text-xs font-bold text-[#1B4D3E]">
            <Check className="h-4 w-4 text-[#1B4D3E]" />
            <span>Paramètres enregistrés avec succès !</span>
          </div>
        )}

        <form onSubmit={handleSettingsSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#181614]">
                Nom de la boutique
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Ex: Librairie Papeterie Le Savoir"
                className="mt-1.5 w-full rounded-xl border border-[#E5DFD5] bg-[#F8F5EE] px-3.5 py-2.5 text-sm font-bold text-[#181614] focus:border-[#1B4D3E] focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#181614]">
                Ville / Commune (Côte d'Ivoire)
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Abidjan Adjamé, Yopougon, Bouaké..."
                className="mt-1.5 w-full rounded-xl border border-[#E5DFD5] bg-[#F8F5EE] px-3.5 py-2.5 text-sm font-medium text-[#181614] focus:border-[#1B4D3E] focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#181614]">
                Numéro de téléphone / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: +225 07 00 00 00 00"
                className="mt-1.5 w-full rounded-xl border border-[#E5DFD5] bg-[#F8F5EE] px-3.5 py-2.5 text-sm font-medium text-[#181614] focus:border-[#1B4D3E] focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#181614]">
                Devise monétaire (Fixée)
              </label>
              <div className="mt-1.5 flex items-center justify-between rounded-xl border border-[#E5DFD5] bg-[#F3EFE6] px-3.5 py-2.5 text-sm font-bold text-[#181614]">
                <span className="font-display">FCFA (F CFA)</span>
                <span className="text-[11px] font-bold text-[#1B4D3E]">Zone UEMOA</span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#181614]">
                Message de remerciement sur le reçu
              </label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="Ex: Merci pour votre confiance ! Bonne rentrée scolaire !"
                className="mt-1.5 w-full rounded-xl border border-[#E5DFD5] bg-[#F8F5EE] px-3.5 py-2.5 text-sm font-medium text-[#181614] focus:border-[#1B4D3E] focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-[#C34B22] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#A83D19] active:scale-95 transition-all cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Enregistrer les coordonnées</span>
            </button>
          </div>
        </form>
      </section>

      {/* 3 & 15. Gestionnaire des Catégories de produits */}
      <section className="rounded-2xl border border-[#E5DFD5] bg-white p-5 sm:p-6 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3EFE6] text-[#181614]">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-[#181614]">Rayons & Catégories</h3>
              <p className="text-xs text-[#6B655B]">
                Organisez vos fournitures selon les rayons de votre papeterie
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire d'ajout de catégorie */}
        <form onSubmit={handleAddCategorySubmit} className="mb-5 flex gap-2">
          <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#E5DFD5] bg-[#F8F5EE] px-2 py-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[#181614] shadow-xs">
              <CategoryIcon icon={newCatIcon} className="h-4 w-4" />
            </span>
            <select
              value={newCatIcon}
              onChange={(e) => setNewCatIcon(e.target.value)}
              aria-label="Icône de la catégorie"
              className="bg-transparent text-[11px] font-bold text-[#181614] focus:outline-hidden cursor-pointer"
            >
              {CATEGORY_ICON_OPTIONS.map((key) => (
                <option key={key} value={key}>
                  {CATEGORY_ICON_LABELS[key] || key}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Nom du nouveau rayon (ex: Informatique & Bureautique)"
            className="flex-1 rounded-xl border border-[#E5DFD5] bg-[#F8F5EE] px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#181614] focus:border-[#1B4D3E] focus:bg-white focus:outline-hidden"
          />
          <button
            type="submit"
            className="flex items-center gap-1 rounded-xl bg-[#181614] px-4 py-2.5 text-xs font-bold text-white hover:bg-black active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter</span>
          </button>
        </form>

        {/* Liste des catégories */}
        <div className="divide-y divide-[#E5DFD5] rounded-xl border border-[#E5DFD5] bg-[#F8F5EE]/40">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-3">
              {editingCatId === cat.id ? (
                <div className="flex flex-1 items-center gap-2 pr-2">
                  <div className="flex shrink-0 items-center gap-1 rounded-lg border border-[#E5DFD5] bg-white px-1.5 py-1">
                    <CategoryIcon icon={editCatIcon} className="h-3.5 w-3.5 text-[#181614]" />
                    <select
                      value={editCatIcon}
                      onChange={(e) => setEditCatIcon(e.target.value)}
                      aria-label="Icône de la catégorie"
                      className="bg-transparent text-[11px] font-bold text-[#181614] focus:outline-hidden"
                    >
                      {CATEGORY_ICON_OPTIONS.map((key) => (
                        <option key={key} value={key}>
                          {CATEGORY_ICON_LABELS[key] || key}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    className="flex-1 rounded-lg border border-[#E5DFD5] bg-white p-1.5 text-xs font-bold text-[#181614]"
                  />
                  <button
                    onClick={() => handleSaveEditCat(cat.id)}
                    className="rounded-lg bg-[#1B4D3E] p-1.5 text-white cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-[#E5DFD5] text-[#181614] shadow-xs">
                    <CategoryIcon icon={cat.icon} className="h-4 w-4 text-[#1B4D3E]" />
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#181614]">{cat.name}</span>
                </div>
              )}

              {editingCatId !== cat.id && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEditCat(cat)}
                    className="rounded-lg p-1.5 text-[#6B655B] hover:bg-[#EAE4D9] hover:text-[#181614] transition-colors cursor-pointer"
                    title="Renommer"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Supprimer le rayon "${cat.name}" ? Les produits associés devront être reclassés.`
                        )
                      ) {
                        onDeleteCategory(cat.id);
                      }
                    }}
                    className="rounded-lg p-1.5 text-[#8E877B] hover:bg-[#FBF0EB] hover:text-[#C34B22] transition-colors cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 16. Sauvegarde des données (Export, Import, Restauration) */}
      <section className="rounded-2xl border border-[#E5DFD5] bg-white p-5 sm:p-6 shadow-xs">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3EFE6] text-[#181614]">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-[#181614]">Sauvegarde & Protection du registre</h3>
            <p className="text-xs text-[#6B655B]">
              Conservez votre historique de vente et stock sur votre clé USB ou téléphone
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Exporter */}
          <div className="flex flex-col justify-between rounded-xl border border-[#E5DFD5] bg-[#F8F5EE] p-4">
            <div>
              <h4 className="font-display text-sm font-bold text-[#181614]">Sauvegarder le registre</h4>
              <p className="mt-1 text-xs text-[#6B655B]">
                Génère un fichier sécurisé avec vos produits, prix, ventes et totaux.
              </p>
            </div>
            <button
              onClick={exportDataBackup}
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#181614] py-2.5 text-xs font-bold text-white hover:bg-black active:scale-95 transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Exporter mon registre</span>
            </button>
          </div>

          {/* Importer */}
          <div className="flex flex-col justify-between rounded-xl border border-[#E5DFD5] bg-[#F8F5EE] p-4">
            <div>
              <h4 className="font-display text-sm font-bold text-[#181614]">Restaurer une copie</h4>
              <p className="mt-1 text-xs text-[#6B655B]">
                Chargez un fichier de registre précédent pour restaurer toute votre caisse.
              </p>
            </div>
            <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E5DFD5] bg-white py-2.5 text-xs font-bold text-[#181614] hover:bg-[#F3EFE6] active:scale-95 transition-all">
              <Upload className="h-4 w-4" />
              <span>Importer un fichier</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>

          {/* Réinitialiser */}
          <div className="flex flex-col justify-between rounded-xl border border-[#C34B22]/20 bg-[#FBF0EB]/60 p-4">
            <div>
              <h4 className="font-display text-sm font-bold text-[#C34B22]">Votre grille tarifaire</h4>
              <p className="mt-1 text-xs text-[#6B655B]">
                Réinitialise les articles et les prix à votre liste exacte (Privilège, Préférence, fournitures, gourdes).
              </p>
            </div>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    'Attention : Voulez-vous vraiment réinitialiser toutes les données à votre catalogue officiel ?'
                  )
                ) {
                  onResetData();
                }
              }}
              className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-[#C34B22]/30 bg-white py-2.5 text-xs font-bold text-[#C34B22] hover:bg-[#FBF0EB] active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
