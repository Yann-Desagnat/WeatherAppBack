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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*", methods: "GET,HEAD,PUT,PATCH,POST,DELETE" }));
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use('/api', weatherRoutes);
// Base de données simple en mémoire pour les utilisateurs
let users = [];

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'Cet utilisateur existe déjà.' });
    }
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

app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});

// Définition du répertoire des fichiers statiques
// app.use(express.static('C:\wamp64\www\projet_javascript\Jojo_Yaya_Meme_Front'));


/*
const cors = require("cors");
app.use(cors({ origin: "*", methods: "GET,HEAD,PUT,PATCH,POST,DELETE"
}));


// Base de données simple en mémoire
let users = [];
let searchHistory = [];


// Route pour l'inscription des utilisateurs
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;


    // Vérification si l'utilisateur existe déjà
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
        return res.status(400).json({ message: 'Cet utilisateur existe déjà.' });
    }


    // Création d'un nouvel utilisateur sans hacher le mot de passe
    const newUser = { username, email, password };
    users.push(newUser);


    res.status(201).json({ message: 'Utilisateur inscrit avec succès.' });
});


// Route pour la connexion des utilisateurs
app.post('/login', (req, res) => {
    const { email, password } = req.body;


    // Recherche de l'utilisateur par email
    const user = users.find(user => user.email === email);


    // Vérification si l'utilisateur existe et si le mot de passe correspond
    if (user && user.password === password) {
        // Utilisateur authentifié avec succès
        // Définir le type d'utilisateur sur "connecté"
        req.session.userType = 'connecté';
        res.status(200).json({ message: 'Connexion réussie.' });
    } else {
        // Échec de l'authentification
        res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }
});



// Route pour récupérer la liste des utilisateurs
app.get('/getUsers', (req, res) => {
    res.json(users);
});


// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
}); 


// Route pour supprimer un utilisateur
app.delete('/deleteUser', (req, res) => {
    const { username } = req.body;


    // Recherche de l'utilisateur dans la liste
    const index = users.findIndex(user => user.username === username);
    if (index !== -1) {
        // Suppression de l'utilisateur s'il est trouvé
        users.splice(index, 1);
        res.status(200).json({ message: 'Utilisateur supprimé avec succès.' });
    } else {
        res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
});


// Route pour mettre à jour un utilisateur
app.put('/updateUser', (req, res) => {
    const { username, newUsername, newEmail } = req.body;


    // Recherche de l'utilisateur dans la liste
    const userToUpdate = users.find(user => user.username === username);
    if (userToUpdate) {
        // Mise à jour des attributs de l'utilisateur
        userToUpdate.username = newUsername || userToUpdate.username;
        userToUpdate.email = newEmail || userToUpdate.email;
        res.status(200).json({ message: 'Utilisateur mis à jour avec succès.' });
    } else {
        res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
}); */