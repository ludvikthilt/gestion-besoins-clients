const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Route pour lire les données
app.get('/data/needs.json', (req, res) => {
    try {
        const data = fs.readFileSync('data/needs.json');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ error: 'Erreur de lecture' });
    }
});

// Route pour écrire les données
app.post('/data/needs.json', (req, res) => {
    try {
        fs.writeFileSync('data/needs.json', JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erreur d\'écriture' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});