const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

// Configuration de la base de données avec fallback sur le stockage fichier
let useDatabase = false;
let pool;

if (process.env.DATABASE_URL) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
        } : false
    });
    useDatabase = true;
    console.log('Mode base de données PostgreSQL activé');
} else {
    console.log('Mode fichier JSON activé (fallback)');
}

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Initialisation
async function initDatabase() {
    if (!useDatabase) {
        // Vérifier si le dossier data existe
        if (!fs.existsSync('data')) {
            fs.mkdirSync('data');
        }
        // Vérifier si le fichier needs.json existe
        if (!fs.existsSync('data/needs.json')) {
            fs.writeFileSync('data/needs.json', JSON.stringify({ needs: [], lastUpdate: new Date().toISOString() }));
        }
        return;
    }

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
        useDatabase = false;
        console.log('Basculement vers le mode fichier JSON');
    }
}

// Route pour lire les besoins
app.get('/data/needs.json', async (req, res) => {
    try {
        if (useDatabase) {
            const result = await pool.query('SELECT * FROM needs ORDER BY date DESC');
            const needs = result.rows.map(row => ({
                id: row.id,
                clientName: row.client_name,
                title: row.title,
                description: row.description,
                priority: row.priority,
                status: row.status,
                date: row.date
            }));
            res.json({
                needs,
                lastUpdate: new Date().toISOString()
            });
        } else {
            const data = JSON.parse(fs.readFileSync('data/needs.json', 'utf8'));
            res.json(data);
        }
    } catch (error) {
        console.error('Erreur de lecture:', error);
        res.status(500).json({ error: 'Erreur de lecture' });
    }
});

// Route pour écrire les besoins
app.post('/data/needs.json', async (req, res) => {
    try {
        if (useDatabase) {
            await pool.query('DELETE FROM needs');
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
        } else {
            fs.writeFileSync('data/needs.json', JSON.stringify(req.body, null, 2));
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur d\'écriture:', error);
        res.status(500).json({ error: 'Erreur d\'écriture' });
    }
});

// Démarrage du serveur
initDatabase().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Serveur démarré sur le port ${PORT}`);
        console.log(`Mode actuel: ${useDatabase ? 'PostgreSQL' : 'Fichier JSON'}`);
    });
}).catch(error => {
    console.error('Erreur de démarrage:', error);
    process.exit(1);
});