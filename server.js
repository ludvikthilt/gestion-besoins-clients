const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
let pool = null;
let isConnected = false;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

async function initializeDatabaseConnection() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL not found');
        return;
    }

    try {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });

        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        
        isConnected = true;
        console.log('✅ Connected to PostgreSQL');
        
        await initDatabaseStructure();
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
    }
}

async function initDatabaseStructure() {
    if (!pool || !isConnected) return;

    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS needs (
                id BIGINT PRIMARY KEY,
                client_name VARCHAR(255) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                priority VARCHAR(50) NOT NULL,
                status VARCHAR(50) NOT NULL,
                date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Database structure initialized');
    } catch (error) {
        console.error('❌ Error initializing database structure:', error.message);
    } finally {
        client.release();
    }
}

// Route pour lire les besoins
app.get('/data/needs.json', async (req, res) => {
    if (!pool || !isConnected) {
        return res.status(503).json({
            error: 'Database not available'
        });
    }

    let client;
    try {
        client = await pool.connect();
        const result = await client.query('SELECT * FROM needs ORDER BY date DESC');
        console.log(`📖 Retrieved ${result.rowCount} needs from database`);
        
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
    } catch (error) {
        console.error('❌ Error reading from database:', error);
        res.status(500).json({ error: 'Database read error' });
    } finally {
        if (client) client.release();
    }
});

// Route pour ajouter/modifier un besoin
app.post('/data/needs.json', async (req, res) => {
    console.log('🔍 Requête POST reçue. Corps de la requête :', JSON.stringify(req.body, null, 2));

    if (!pool || !isConnected) {
        console.error('❌ Base de données non disponible');
        return res.status(503).json({
            error: 'Base de données non disponible'
        });
    }

    let client;
    try {
        const need = req.body;

        // Validation stricte des champs
        if (!need.id || !need.clientName || !need.title || !need.priority || !need.status) {
            console.error('❌ Champs requis manquants');
            return res.status(400).json({ 
                error: 'Champs requis manquants',
                receivedData: need
            });
        }

        client = await pool.connect();
        
        const query = `
            INSERT INTO needs (
                id, client_name, title, description, 
                priority, status, date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET
                client_name = EXCLUDED.client_name,
                title = EXCLUDED.title,
                description = COALESCE(EXCLUDED.description, needs.description),
                priority = EXCLUDED.priority,
                status = EXCLUDED.status,
                date = EXCLUDED.date
            RETURNING *
        `;

        const result = await client.query(query, [
            need.id,
            need.clientName,
            need.title,
            need.description || null,
            need.priority,
            need.status,
            new Date(need.date || Date.now())
        ]);

        console.log(`💾 Besoin sauvegardé/mis à jour avec l'ID: ${need.id}`);
        console.log('💾 Détails du besoin :', JSON.stringify(result.rows[0], null, 2));
        
        res.json({ 
            success: true,
            message: 'Besoin sauvegardé avec succès',
            need: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        res.status(500).json({ 
            error: 'Échec de la sauvegarde du besoin',
            details: error.message,
            stack: error.stack
        });
    } finally {
        if (client) client.release();
    }
});

// Route pour supprimer un besoin
app.delete('/data/needs.json/:id', async (req, res) => {
    if (!pool || !isConnected) {
        return res.status(503).json({
            error: 'Database not available'
        });
    }

    let client;
    try {
        const needId = req.params.id;

        client = await pool.connect();
        
        const result = await client.query('DELETE FROM needs WHERE id = $1', [needId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ 
                error: 'Need not found',
                id: needId
            });
        }

        console.log(`🗑️ Deleted need with ID: ${needId}`);
        
        res.json({ 
            success: true,
            message: 'Need deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting need:', error);
        res.status(500).json({ 
            error: 'Failed to delete need',
            details: error.message
        });
    } finally {
        if (client) client.release();
    }
});

// Route de diagnostique
app.get('/health', (req, res) => {
    res.json({
        status: 'running',
        database: {
            configured: !!process.env.DATABASE_URL,
            connected: isConnected
        },
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;

// Démarrer le serveur
console.log('🔄 Starting server...');
app.listen(PORT, () => {
    console.log(`
🚀 Server running on port ${PORT}
📡 Health check at /health
    `);
    
    initializeDatabaseConnection();
});

process.on('SIGTERM', () => {
    console.log('➡️ SIGTERM received. Shutting down...');
    if (pool) {
        pool.end(() => {
            console.log('💤 Connection pool closed');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});