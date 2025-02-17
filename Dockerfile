FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers
COPY . .

# S'assurer que le dossier data existe
RUN mkdir -p data

# Exposer le port
EXPOSE ${PORT:-3000}

# Commande de démarrage
CMD ["node", "server.js"]