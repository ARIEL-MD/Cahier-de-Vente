import React from 'react';
import {
  BookOpen,
  Pencil,
  Ruler,
  Palette,
  Backpack,
  FileText,
  Package,
  Tag,
  ShoppingBag,
  Box,
  Layers,
  Star,
  type LucideIcon,
} from 'lucide-react';

// Clés d'icônes disponibles pour les catégories (remplace les emojis).
export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  book: BookOpen,
  pencil: Pencil,
  ruler: Ruler,
  palette: Palette,
  backpack: Backpack,
  'file-text': FileText,
  package: Package,
  tag: Tag,
  bag: ShoppingBag,
  box: Box,
  layers: Layers,
  star: Star,
};

export const CATEGORY_ICON_OPTIONS = Object.keys(CATEGORY_ICON_MAP) as Array<
  keyof typeof CATEGORY_ICON_MAP
>;

interface CategoryIconProps {
  icon?: string;
  className?: string;
}

// Rend l'icône associée à une catégorie. Si la clé est inconnue
// (ex: anciennes données avec un emoji), affiche une icône neutre par défaut.
export const CategoryIcon: React.FC<CategoryIconProps> = ({ icon, className = 'h-4 w-4' }) => {
  const Icon = (icon && CATEGORY_ICON_MAP[icon]) || Package;
  return <Icon className={className} />;
};
