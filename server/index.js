import express from 'express';
import cors from 'cors';
import pkg from 'pg';

const { Pool } = pkg;

const PORT = process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

if (!DATABASE_URL) {
  console.error('DATABASE_URL manquant. Configurez la variable d\'environnement.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_data (
      id INTEGER PRIMARY KEY DEFAULT 1,
      settings JSONB NOT NULL DEFAULT '{}'::jsonb,
      categories JSONB NOT NULL DEFAULT '[]'::jsonb,
      products JSONB NOT NULL DEFAULT '[]'::jsonb,
      sales JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT single_row CHECK (id = 1)
    );
  `);
}

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Récupère les données sauvegardées (ou null si rien n'a encore été enregistré)
app.get('/api/data', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT settings, categories, products, sales, updated_at FROM app_data WHERE id = 1'
    );
    if (rows.length === 0) {
      return res.json(null);
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Erreur GET /api/data:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Sauvegarde (upsert) l'ensemble des données
app.put('/api/data', async (req, res) => {
  try {
    const { settings, categories, products, sales } = req.body || {};
    if (!settings || !categories || !products || !sales) {
      return res.status(400).json({ error: 'Champs manquants' });
    }
    await pool.query(
      `INSERT INTO app_data (id, settings, categories, products, sales, updated_at)
       VALUES (1, $1, $2, $3, $4, now())
       ON CONFLICT (id) DO UPDATE SET
         settings = EXCLUDED.settings,
         categories = EXCLUDED.categories,
         products = EXCLUDED.products,
         sales = EXCLUDED.sales,
         updated_at = now();`,
      [JSON.stringify(settings), JSON.stringify(categories), JSON.stringify(products), JSON.stringify(sales)]
    );
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Erreur PUT /api/data:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API Cahier de Vente à l'écoute sur le port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Erreur initialisation base de données:', err);
    process.exit(1);
  });
