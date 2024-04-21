// Import des modules
const express = require('express');
const router = express.Router();
const pool = require('./db_connexion');

// Base de données simple en mémoire
let searchHistory = [];

// Route pour enregistrer une ville et ses détails dans l'historique
router.post('/weather/history', (req, res) => {
    const { city, details } = req.body;
    const { temp, description } = details;
    const createdAt = new Date();
    const userType = req.session.userType || 'anonymous';
    const query = "INSERT INTO search_history (city, temperature, description, created_at, userType) VALUES (?, ?, ?, ?, ?)";
    const values = [city, temp, description, createdAt, userType];
    pool.query(query, values, (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'insertion des données météo:', err);
            res.status(500).send('Erreur lors de l\'insertion des données météo');
        } else {
            res.status(200).send('Données météo insérées avec succès');
        }
    });
});

// Route pour récupérer l'historique des recherches
router.get('/weather/history', (req, res) => {
    pool.query('SELECT city, temperature, description, DATE_FORMAT(created_at, "%d/%m/%Y %H:%i") AS created_at, userType FROM search_history', (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des données météo:', error);
            res.status(500).json({ message: 'Erreur lors de la récupération des données météo' });
        } else {
            res.status(200).json(results);
        }
    });
});

module.exports = router; 


/*Route pour enregistrer une ville dans l'historique
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
    console.log(`Serveur démarrée sur le port ${PORT}`);
});
*/
