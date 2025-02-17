const { Pool } = require('pg');
require('dotenv').config();

async function initTable() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Connexion à la base de données...');
        const client = await pool.connect();
        
        console.log('Création de la table needs...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS needs (
                id BIGINT PRIMARY KEY,
                client_name VARCHAR(255),
                title VARCHAR(255),
                description TEXT,
                priority VARCHAR(50),
                status VARCHAR(50) DEFAULT 'nouveau',
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log('Table créée avec succès !');
        
        // Importons les données existantes du fichier JSON si elles existent
        const fs = require('fs');
        if (fs.existsSync('./data/needs.json')) {
            console.log('Importation des données existantes...');
            const jsonData = JSON.parse(fs.readFileSync('./data/needs.json', 'utf8'));
            
            if (jsonData.needs && jsonData.needs.length > 0) {
                for (const need of jsonData.needs) {
                    await client.query(`
                        INSERT INTO needs (id, client_name, title, description, priority, status, date)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        ON CONFLICT (id) DO NOTHING
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
                console.log('Données importées avec succès !');
            }
        }

        client.release();
        await pool.end();
        console.log('Initialisation terminée !');
    } catch (err) {
        console.error('Erreur lors de l\'initialisation :', err);
    }
}

initTable();