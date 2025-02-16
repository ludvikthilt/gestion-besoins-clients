require('dotenv').config(); // Charger les variables d'environnement
const ngrok = require('ngrok');
const express = require('express');

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Route principale
  app.get('/', (req, res) => {
    res.send('Application déployée avec succès via Ngrok !');
  });

  // Démarrer le serveur
  const server = app.listen(PORT, async () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    
    try {
      // Connexion à Ngrok
      const url = await ngrok.connect({
        proto: 'http',
        addr: PORT,
        authtoken: process.env.NGROK_AUTHTOKEN
      });
      
      console.log('🌐 Votre application est accessible à l\'adresse :');
      console.log(url);
      console.log('\n🔒 Gardez cette URL confidentielle');
      console.log('👉 Appuyez sur Ctrl+C pour arrêter');
    } catch (error) {
      console.error('❌ Erreur de connexion Ngrok :', error);
      process.exit(1);
    }
  });

  // Gestion propre de l'arrêt du serveur
  process.on('SIGINT', async () => {
    console.log('\n🛑 Arrêt du serveur...');
    await ngrok.disconnect();
    await ngrok.kill();
    server.close(() => {
      console.log('✅ Serveur arrêté');
      process.exit(0);
    });
  });
}

startServer();