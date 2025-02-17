const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();

// Configuration de PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Création de la table au démarrage
async function initializeDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS needs (
                id BIGINT PRIMARY KEY,
                client_name VARCHAR(255),
                title VARCHAR(255),
                description TEXT,
                priority VARCHAR(50),
                status VARCHAR(50),
                date TIMESTAMP
            );
        `);
        console.log('Base de données initialisée');
    } catch (error) {
        console.error('Erreur d\'initialisation de la base de données:', error);
    }
}

// Route pour lire les données
app.get('/data/needs.json', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM needs ORDER BY date DESC');
        res.json({
            needs: result.rows.map(row => ({
                id: row.id,
                clientName: row.client_name,
                title: row.title,
                description: row.description,
                priority: row.priority,
                status: row.status,
                date: row.date
            })),
            lastUpdate: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur de lecture' });
    }
});

// Route pour écrire les données
app.post('/data/needs.json', async (req, res) => {
    try {
        // Supprimer toutes les entrées existantes
        await pool.query('DELETE FROM needs');
        
        // Insérer les nouvelles données
        const { needs } = req.body;
        for (const need of needs) {
            await pool.query(`
                INSERT INTO needs (id, client_name, title, description, priority, status, date)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                need.id,
                need.clientName,
                need.title,
                need.description,
                need.priority,
                need.status,
                new Date(need.date)
            ]);
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur d\'écriture:', error);
        res.status(500).json({ error: 'Erreur d\'écriture' });
    }
});

// Initialiser la base de données et démarrer le serveur
initializeDatabase().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Serveur démarré sur le port ${PORT}`);
    });
});