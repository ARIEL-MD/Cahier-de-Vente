import { Category, Product, Sale, StoreSettings } from '../types';

const API_URL = import.meta.env.VITE_API_URL as string | undefined;

export interface RemoteData {
  settings: StoreSettings;
  categories: Category[];
  products: Product[];
  sales: Sale[];
}

export function isRemoteConfigured(): boolean {
  return Boolean(API_URL);
}

// Récupère les données depuis le serveur. Retourne null si l'API n'est pas configurée,
// injoignable, ou si aucune donnée n'a encore été sauvegardée côté serveur.
export async function fetchRemoteData(): Promise<RemoteData | null> {
  if (!API_URL) return null;
  try {
    const res = await fetch(`${API_URL}/api/data`, { method: 'GET' });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data) return null;
    return data as RemoteData;
  } catch (err) {
    console.warn('Impossible de récupérer les données du serveur (hors-ligne ?)', err);
    return null;
  }
}

// Pousse l'état courant vers le serveur. Échoue silencieusement si hors-ligne :
// les données restent sauvegardées localement (localStorage) en attendant la reconnexion.
export async function pushRemoteData(data: RemoteData): Promise<boolean> {
  if (!API_URL) return false;
  try {
    const res = await fetch(`${API_URL}/api/data`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (err) {
    console.warn('Impossible de synchroniser avec le serveur (hors-ligne ?)', err);
    return false;
  }
}
