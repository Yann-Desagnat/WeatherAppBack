// Import des modules
const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./db_connexion'); // Import du module pour la connexion à la base de données
const bcrypt = require('bcrypt');

// Initialisation de l'application Express
const app = express();
const PORT = 3000;

// Middleware pour parser le corps des requêtes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS
const cors = require("cors");
app.use(cors({ origin: "*", methods: "GET,HEAD,PUT,PATCH,POST,DELETE" }));

// Base de données simple en mémoire
let users = [];
let searchHistory = [];

// Route pour enregistrer une ville et ses détails dans l'historique
app.post('/weather/history', (req, res) => {
    const { city, details } = req.body;

    const { temp, description } = details;
   
    const query = "INSERT INTO search_history (city, temperature, description, created_at, userType) VALUES (?, ?, ?, ?, ?)";
    const values = [city, temp, description];

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
    pool.query('SELECT city, temperature, description FROM search_history', (error, results, fields) => {
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
    pool.query('SELECT city, temperature, description FROM seatch_history', (error, results, fields) => {
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
    console.log(`Serveur démarré sur le portj ${PORT}`);
});