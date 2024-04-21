// Import des modules
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cors = require("cors");
const pool = require('./db_connexion');
const weatherRoutes = require('./prevision_meteo_backend');

// Initialisation de l'application Express
const app = express();
const PORT = 3000;

// Configuration des middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*", methods: "GET,HEAD,PUT,PATCH,POST,DELETE" }));
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
    sameSite: 'lax'
}));

// Base de données simple en mémoire pour les utilisateurs
let users = [];

// Routes
app.use('/api', weatherRoutes);

app.get('/', (req, res) => {
    res.status(200).send('Le serveur est opérationnel');
});

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'Cet utilisateur existe déjà.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, email, password: hashedPassword });
    res.status(201).json({ message: 'Utilisateur inscrit avec succès.' });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(user => user.email === email);
    if (user && bcrypt.compareSync(password, user.password)) {
        req.session.userType = 'connecté';
        res.status(200).json({ message: 'Connexion réussie.' });
    } else {
        res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }
});

app.delete('/deleteUser', (req, res) => {
    const { username } = req.body;
    const index = users.findIndex(user => user.username === username);
    if (index !== -1) {
        users.splice(index, 1);
        res.status(200).json({ message: 'Utilisateur supprimé avec succès.' });
    } else {
        res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
});

app.put('/updateUser', (req, res) => {
    const { username, newUsername, newEmail } = req.body;
    const userToUpdate = users.find(user => user.username === username);
    if (userToUpdate) {
        userToUpdate.username = newUsername || userToUpdate.username;
        userToUpdate.email = newEmail || userToUpdate.email;
        res.status(200).json({ message: 'Utilisateur mis à jour avec succès.' });
    } else {
        res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
});



// recuperer data_map info sur les country
app.post('/weather/data_map', (req, res) => {
    const { latitude, longitude, locationName, userId} = req.body;

    
    console.log("Données reçues:", latitude, longitude, locationName, userId);

    const query = "INSERT INTO dataMap (latitude, longitude, locationName, userId) VALUES (?, ?, ?, ?)";
    const values = [latitude, longitude, locationName, userId];
    pool.query(query, values, (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'insertion des données datamap:', err);
            res.status(500).send('Erreur lors de l\'insertion des données datamap');
        } else {
            res.status(200).json({ message: "Données reçues et traitées avec succès" });
        }
    });
});



// Route pour récupérer data
app.get('/weather/data_map', (req, res) => {
    pool.query('SELECT latitude, longitude, locationName, userId FROM dataMap', (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des données datamap:', error);
            res.status(500).json({ message: 'Erreur lors de la récupération des données datamap' });
        } else {
            res.status(200).json(results);
        }
    });
});



// Route pour enregistrer une ville dans l'historique
app.post('/weather/history', (req, res) => {
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
app.get('/weather/history', (req, res) => {
    pool.query('SELECT city, temperature, description, DATE_FORMAT(created_at, "%d/%m/%Y %H:%i") AS created_at, userType FROM search_history', (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des données météo:', error);
            res.status(500).json({ message: 'Erreur lors de la récupération des données météo' });
        } else {
            res.status(200).json(results);
        }
    });
});





// Démarrage du serveur sur le port spécifié
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
