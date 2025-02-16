// Gestionnaire des données JSON
const JsonManager = {
    async readData() {
        try {
            const response = await fetch('http://localhost:3000/data/needs.json');
            if (!response.ok) throw new Error('Erreur de lecture');
            return await response.json();
        } catch (error) {
            console.error('Erreur de lecture:', error);
            return { needs: [], lastUpdate: new Date().toISOString() };
        }
    },

    async writeData(data) {
        try {
            const response = await fetch('http://localhost:3000/data/needs.json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    needs: data,
                    lastUpdate: new Date().toISOString()
                })
            });
            
            if (!response.ok) throw new Error('Erreur d\'écriture');
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Erreur d\'écriture:', error);
            return false;
        }
    }
};

// Gestionnaire des besoins clients
const ClientNeedsManager = {
    needs: [],

    showLoading(show = true) {
        let loader = document.getElementById('loader');
        if (show && !loader) {
            loader = document.createElement('div');
            loader.id = 'loader';
            loader.className = 'loading';
            document.body.appendChild(loader);
        } else if (loader && !show) {
            loader.remove();
        }
    },

    async initialize() {
        this.showLoading();
        try {
            const data = await JsonManager.readData();
            this.needs = data.needs || [];
            this.displayNeeds();
        } catch (error) {
            console.error('Erreur d\'initialisation:', error);
            showNotification('Erreur lors du chargement des données', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    async addNeed(need) {
        this.showLoading();
        try {
            need.id = Date.now();
            need.status = 'nouveau';
            need.date = new Date().toISOString();
            this.needs.unshift(need);
            
            if (await JsonManager.writeData(this.needs)) {
                this.displayNeeds();
                showNotification('Besoin ajouté avec succès');
                return true;
            }
            throw new Error('Échec de la sauvegarde');
        } catch (error) {
            console.error('Erreur d\'ajout:', error);
            showNotification('Erreur lors de l\'ajout du besoin', 'error');
            return false;
        } finally {
            this.showLoading(false);
        }
    },

    async updateStatus(id, newStatus) {
        this.showLoading();
        try {
            const needIndex = this.needs.findIndex(need => need.id === id);
            if (needIndex !== -1) {
                this.needs[needIndex].status = newStatus;
                if (await JsonManager.writeData(this.needs)) {
                    this.displayNeeds();
                    showNotification(`Statut mis à jour: ${newStatus}`);
                }
            }
        } catch (error) {
            console.error('Erreur de mise à jour:', error);
            showNotification('Erreur lors de la mise à jour du statut', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    async deleteNeed(id) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce besoin ?')) return;
        
        this.showLoading();
        try {
            this.needs = this.needs.filter(need => need.id !== id);
            if (await JsonManager.writeData(this.needs)) {
                this.displayNeeds();
                showNotification('Besoin supprimé');
            }
        } catch (error) {
            console.error('Erreur de suppression:', error);
            showNotification('Erreur lors de la suppression', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    displayNeeds() {
        const needsList = document.getElementById('needsList');
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const priorityFilter = document.getElementById('priorityFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        let filteredNeeds = this.needs.filter(need => {
            const matchesSearch = need.clientName.toLowerCase().includes(searchTerm) ||
                              need.title.toLowerCase().includes(searchTerm) ||
                              need.description.toLowerCase().includes(searchTerm);
            const matchesPriority = !priorityFilter || need.priority === priorityFilter;
            const matchesStatus = !statusFilter || need.status === statusFilter;

            return matchesSearch && matchesPriority && matchesStatus;
        });

        needsList.innerHTML = filteredNeeds.map(need => `
            <div class="need-card priority-${need.priority}">
                <h3>
                    ${need.title}
                    <span class="status-badge status-${need.status}">${need.status}</span>
                </h3>
                <p><strong>Client:</strong> ${need.clientName}</p>
                <p><strong>Description:</strong> ${need.description}</p>
                <p><strong>Date:</strong> ${new Date(need.date).toLocaleDateString()}</p>
                <div class="status-actions">
                    <button onclick="ClientNeedsManager.updateStatus(${need.id}, 'nouveau')"
                            ${need.status === 'nouveau' ? 'disabled' : ''}>
                        Nouveau
                    </button>
                    <button onclick="ClientNeedsManager.updateStatus(${need.id}, 'en-cours')"
                            ${need.status === 'en-cours' ? 'disabled' : ''}>
                        En cours
                    </button>
                    <button onclick="ClientNeedsManager.updateStatus(${need.id}, 'complete')"
                            ${need.status === 'complete' ? 'disabled' : ''}>
                        Complété
                    </button>
                    <button onclick="ClientNeedsManager.deleteNeed(${need.id})"
                            class="delete-btn">
                        Supprimer
                    </button>
                </div>
            </div>
        `).join('');
    }
};

// Fonction pour afficher les notifications
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.backgroundColor = type === 'success' ? '#10b981' : '#dc2626';
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Gestionnaire d'événements pour le formulaire
document.getElementById('needForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newNeed = {
        clientName: document.getElementById('clientName').value,
        title: document.getElementById('needTitle').value,
        description: document.getElementById('needDescription').value,
        priority: document.getElementById('priority').value
    };
    if (await ClientNeedsManager.addNeed(newNeed)) {
        e.target.reset();
    }
});

// Gestionnaires d'événements pour les filtres
document.getElementById('searchInput').addEventListener('input', () => 
    ClientNeedsManager.displayNeeds()
);
document.getElementById('priorityFilter').addEventListener('change', () => 
    ClientNeedsManager.displayNeeds()
);
document.getElementById('statusFilter').addEventListener('change', () => 
    ClientNeedsManager.displayNeeds()
);

// Initialisation
ClientNeedsManager.initialize();