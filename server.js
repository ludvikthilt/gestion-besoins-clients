const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Configuration de la base de données
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname)));

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route pour lire les besoins
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
        console.error('Erreur de lecture:', error);
        res.status(500).json({ error: 'Erreur de lecture' });
    }
});

// Route pour écrire les besoins
app.post('/data/needs.json', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM needs');
        
        const { needs } = req.body;
        for (const need of needs) {
            await client.query(`
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
        
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur d\'écriture:', error);
        res.status(500).json({ error: 'Erreur d\'écriture' });
    } finally {
        client.release();
    }
});

// Gérer toutes les autres routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Démarrage du serveur
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});