const { Pool } = require('pg');
require('dotenv').config();

async function testConnection() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        },
        connectionTimeoutMillis: 5000,
        query_timeout: 10000
    });

    try {
        console.log('URL de connexion:', process.env.DATABASE_URL);
        console.log('Tentative de connexion à la base de données...');
        
        const client = await pool.connect();
        console.log('Connexion réussie !');
        
        console.log('Test de requête...');
        const result = await client.query('SELECT NOW()');
        console.log('Résultat de la requête :', result.rows[0]);
        
        client.release();
        await pool.end();
    } catch (err) {
        console.error('Erreur de connexion détaillée:', {
            message: err.message,
            code: err.code,
            errno: err.errno,
            syscall: err.syscall,
            hostname: err.hostname
        });
    }
}

testConnection();