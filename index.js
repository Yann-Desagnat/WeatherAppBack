// Import des modules
const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./db_connexion'); // Import du module pour la connexion à la base de données
const session = require('express-session'); // Module pour gérer les sessions

// Initialisation de l'application Express
const app = express();
const PORT = 3000;

// Middleware pour parser le corps des requêtes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware pour gérer les sessions
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true
}));

// CORS
const cors = require("cors");
app.use(cors({ origin: "*", methods: "GET,HEAD,PUT,PATCH,POST,DELETE" }));

// Route pour la connexion anonyme
app.post('/login/anon', (req, res) => {
    // Création d'un identifiant unique pour l'utilisateur anonyme
    const anonUserId = Math.random().toString(36).substr(2, 9);

    // Stockage de l'ID utilisateur anonyme dans la session
    req.session.userId = anonUserId;

    // Redirection vers la page de prévisions météo
    res.status(200).send('Connexion anonyme réussie');
});

// Route pour enregistrer une ville et ses détails dans l'historique
app.post('/weather/history', (req, res) => {
    const { city, details } = req.body;

    const { temp, description } = details;

    const query = "INSERT INTO search_history (city, temperature, description, user_id) VALUES (?, ?, ?, ?)";
    const values = [city, temp, description, req.session.userId];

    pool.query(query, values, (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'insertion des données météo:', err);
            res.status(500).send('Erreur lors de l\'insertion des données météo');
        } else {
            console.log('Données météo insérées avec succès');
            res.status(200).send('Données météo insérées avec succès');
        }
    });
});

// Route pour récupérer l'historique des recherches
app.get('/weather/history', (req, res) => {
    pool.query('SELECT city, temperature, description FROM search_history WHERE user_id = ?', [req.session.userId], (error, results, fields) => {
        if (error) {
            console.error('Erreur lors de la récupération des données météo:', error);
            res.status(500).json({ message: 'Erreur lors de la récupération des données météo' });
        } else {
            res.status(200).json(results); // Renvoie les données météo en tant que réponse JSON
        }
    });
});

// Route pour récupérer les données météo depuis la base de données
app.get('/weather/data', (req, res) => {
    pool.query('SELECT city, temperature, description FROM search_history WHERE user_id = ?', [req.session.userId], (error, results, fields) => {
        if (error) {
            console.error('Erreur lors de la récupération des données météo:', error);
            res.status(500).json({ message: 'Erreur lors de la récupération des données météo' });
        } else {
            res.status(200).json(results); // Renvoie les données météo en tant que réponse JSON
        }
    });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
