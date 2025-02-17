FROM node:18-alpine

WORKDIR /app

# Copier les fichiers package
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers
COPY . .

# Exposer le port
EXPOSE 8080

# Démarrer l'application
CMD ["node", "server.js"]