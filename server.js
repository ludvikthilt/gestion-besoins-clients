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
    const connectionString = process.env.DATABASE_URL;
    console.log('Tentative de connexion à PostgreSQL avec l\'URL:', connectionString);
    
    pool = new Pool({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        },
        // Ajout de paramètres de timeout et de retry
        connectionTimeoutMillis: 5000,
        retry_strategy: {
            retries: 5,
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 60000
        }
    });

    // Vérifier la connexion immédiatement
    pool.connect((err, client, release) => {
        if (err) {
            console.error('Erreur de connexion à PostgreSQL:', err);
            useDatabase = false;
            console.log('Basculement vers le mode fichier JSON');
        } else {
            console.log('Connexion à PostgreSQL réussie!');
            useDatabase = true;
            release();
        }
    });
} else {
    console.log('Aucune URL de base de données trouvée, utilisation du mode fichier JSON');
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
        const client = await pool.connect();
        try {
            await client.query(`
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
            console.log('Table needs créée/vérifiée avec succès');
        } catch (error) {
            console.error('Erreur lors de la création de la table:', error);
            useDatabase = false;
            console.log('Basculement vers le mode fichier JSON');
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Erreur de connexion à la base de données:', error);
        useDatabase = false;
        console.log('Basculement vers le mode fichier JSON');
    }
}

// Routes existantes...
[Routes restantes identiques à votre code]

// Démarrage du serveur
initDatabase().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Serveur démarré sur le port ${PORT}`);
        console.log(`Mode actuel: ${useDatabase ? 'PostgreSQL' : 'Fichier JSON'}`);
        if (!useDatabase) {
            console.log('ATTENTION: Fonctionnement en mode fichier JSON. Les données ne seront pas persistantes sur Railway.');
        }
    });
}).catch(error => {
    console.error('Erreur de démarrage:', error);
});