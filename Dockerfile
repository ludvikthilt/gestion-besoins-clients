# Utiliser une image Node.js LTS pour la stabilité
FROM node:18-alpine

# Installer des dépendances système nécessaires
RUN apk add --no-cache python3 make g++ postgresql-client

# Définir le répertoire de travail
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copier le reste des fichiers du projet
COPY . .

# Créer le dossier data s'il n'existe pas et définir les permissions
RUN mkdir -p /app/data && chmod 777 /app/data

# Exposer le port (Railway le substituera automatiquement)
EXPOSE ${PORT:-3000}

# Commande de démarrage
CMD ["node", "server.js"]