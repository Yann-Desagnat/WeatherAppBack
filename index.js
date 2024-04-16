
// Import des modules
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path'); // Module pour manipuler les chemins de fichier
const pool = require('./db_connexion');
const bcrypt = require('bcrypt');

// Initialisation de l'application Express
const app = express();
const PORT = 3000;


// Middleware pour parser le corps des requêtes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Définition du répertoire des fichiers statiques
// app.use(express.static('C:\wamp64\www\projet_javascript\Jojo_Yaya_Meme_Front'));


// CORS
const cors = require("cors");
app.use(cors({ origin: "*", methods: "GET,HEAD,PUT,PATCH,POST,DELETE"
}));




// Base de données simple en mémoire
let users = [];
let searchHistory = [];




// Route pour l'inscription des utilisateurs
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    // Hash du mot de passe
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error('Erreur lors du hachage du mot de passe:', err);
            return res.status(500).json({ message: 'Erreur lors de l\'inscription de l\'utilisateur' });
        }

        // Insérer les données de l'utilisateur dans la table MySQL avec le mot de passe haché
        pool.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hash], (error, results) => {
            if (error) {
                console.error('Erreur lors de l\'inscription de l\'utilisateur:', error);
                res.status(500).json({ message: 'Erreur lors de l\'inscription de l\'utilisateur' });
            } else {
                console.log('Utilisateur inscrit avec succès');
                res.status(200).json({ message: 'Utilisateur inscrit avec succès' });
            }
        });
    });
});


// Route pour la connexion
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe dans la base de données
    pool.query('SELECT * FROM users WHERE email = ?', [email], (error, results) => {
        if (error) {
            console.error('Erreur lors de la recherche de l\'utilisateur:', error);
            return res.status(500).json({ message: 'Erreur lors de la connexion.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        const user = results[0];

        // Comparer le mot de passe fourni avec le mot de passe haché dans la base de données
        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                console.error('Erreur lors de la comparaison des mots de passe:', err);
                return res.status(500).json({ message: 'Erreur lors de la connexion.' });
            }

            if (!result) {
                return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
            }

            // Authentification réussie, envoyer une réponse avec les détails de l'utilisateur
            res.status(200).json({ message: 'Connexion réussie.', user: { id: user.id, username: user.username, email: user.email } });
        });
    });
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
});


// Route pour enregistrer une ville et ses détails dans l'historique
app.post('/weather/history', (req, res) => {
    const { city, details } = req.body; // Modifier pour accepter les détails
    // Assurez-vous que 'details' inclut les informations météo que vous souhaitez stocker, par exemple température, description, etc.

    const { temp, description } = details;

    const query = "INSERT INTO meteo (city, date, temperature, description) VALUES (?, NOW(), ?, ?)";
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



// Route pour récupérer les données météo depuis la base de données
app.get('/weather/data', (req, res) => {
    pool.query('SELECT city, temperature, description FROM meteo', (error, results, fields) => {
        if (error) {
            console.error('Erreur lors de la récupération des données météo:', error);
            res.status(500).json({ message: 'Erreur lors de la récupération des données météo' });
        } else {
            res.status(200).json(results); // Renvoie les données météo en tant que réponse JSON
        }
    });
});
