// Import des modules
const express = require('express');
const bodyParser = require('body-parser');

// Initialisation de l'application Express
const app = express();
const PORT = 3000;

// Middleware pour parser le corps des requêtes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Base de données simple en mémoire
let searchHistory = [];

// Route pour enregistrer une ville dans l'historique
app.post('/weather/history', (req, res) => {
    const { city, details } = req.body;
    searchHistory.push({ city, details });
    console.log('Ville et détails météo ajoutés à l\'historique :', city, details);
    res.status(200).send('Ville et détails météo ajoutés à l\'historique');
});

// Route pour récupérer l'historique des recherches
app.get('/weather/history', (req, res) => {
    res.status(200).json(searchHistory);
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
