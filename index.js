// Import des modules
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cors = require("cors");
const pool = require('./db_connexion');
const weatherRoutes = require('./prevision_meteo_backend');
const axios = require('axios');

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

app.post('/', (req, res) => {
    res.status(200).send('Le serveur est opérationnel');
});


// Route pour l'inscription
// Route pour l'inscription
app.post('/register', (req, res) => {
    // Récupérer les données du corps de la requête POST
    const { username, email, password, city, country } = req.body;

    // Hasher le mot de passe
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Une erreur est survenue lors de l\'inscription.' });
        }

        // Insérer l'utilisateur dans la base de données
        pool.query(
            'INSERT INTO users (username, email, password, created_at, city, country) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, hashedPassword, new Date(), city, country],
            (err, results) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Une erreur est survenue lors de l\'inscription.' });
                }

                // Utilisateur inscrit avec succès
                res.status(201).json({ message: 'Utilisateur inscrit avec succès.' });
            }
        );
    });
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

// Ajouter une ville favorite
app.post('/addFavorite', (req, res) => {
    const { userId, cityName } = req.body;
    const query = 'INSERT INTO favorites (userId, cityName) VALUES (?, ?)';
    pool.query(query, [userId, cityName], (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'ajout d\'une ville favorite:', err);
            res.status(500).send('Erreur lors de l\'ajout d\'une ville favorite');
        } else {
            res.status(201).send('Ville favorite ajoutée avec succès');
        }
    });
});

// Supprimer une ville favorite
app.delete('/removeFavorite', (req, res) => {
    const { userId, cityName } = req.body;
    const query = 'DELETE FROM favorites WHERE userId = ? AND cityName = ?';
    pool.query(query, [userId, cityName], (err, result) => {
        if (err) {
            console.error('Erreur lors de la suppression d\'une ville favorite:', err);
            res.status(500).send('Erreur lors de la suppression d\'une ville favorite');
        } else {
            res.status(200).send('Ville favorite supprimée avec succès');
        }
    });
});

// Récupérer les villes favorites de l'utilisateur
app.get('/getFavorites', (req, res) => {
    const userId = req.session.userId; // Supposons que l'ID de l'utilisateur soit stocké dans la session
    if (!userId) {
        return res.status(401).json({ message: 'Authentification requise' });
    }
    const query = 'SELECT cityName FROM favorites WHERE userId = ?';
    pool.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des villes favorites:', err);
            res.status(500).json({ message: 'Erreur lors de la récupération des villes favorites' });
        } else {
            res.status(200).json(results.map(row => row.cityName));
        }
    });
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

// Route pour récupérer les pays les plus cliqués
app.get('/weather/most_clicked_countries', (req, res) => {
    // Récupérer les données de /weather/data_map
    pool.query('SELECT locationName FROM dataMap', (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des données datamap:', error);
            res.status(500).json({ message: 'Erreur lors de la récupération des données datamap' });
        } else {
            // Compter les clics par pays
            const countryCounts = {};
            results.forEach(row => {
                const country = row.locationName;
                countryCounts[country] = (countryCounts[country] || 0) + 1;
            });

            // Convertir les résultats en tableau de pays et clics
            const mostClickedCountries = Object.entries(countryCounts)
                .sort((a, b) => b[1] - a[1]) // Trier par nombre de clics décroissant
                .slice(0, 3); // Limiter aux 3 pays les plus cliqués

            res.status(200).json(mostClickedCountries);
        }
    });
});





// Route pour récupérer les villes les plus cliquées
app.get('/weather/most_clicked_cities', (req, res) => {
    // Récupérer les données de /weather/history
    pool.query('SELECT city FROM search_history', (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des données historiques:', error);
            res.status(500).json({ message: 'Erreur lors de la récupération des données historiques' });
        } else {
            // Compter les clics par ville
            const cityCounts = {};
            results.forEach(row => {
                const city = row.city;
                cityCounts[city] = (cityCounts[city] || 0) + 1;
            });

            // Convertir les résultats en tableau de villes et clics
            const mostClickedCities = Object.entries(cityCounts)
                .sort((a, b) => b[1] - a[1]) // Trier par nombre de clics décroissant
                .slice(0, 3); // Limiter aux 3 villes les plus cliquées

            res.status(200).json(mostClickedCities);
        }
    });
});

// Route pour récupérer les favoris de l'utilisateur connecté
app.get('/favoris', (req, res) => {
    // Vérifier si l'utilisateur est connecté
    if (req.session.userType === 'connecté') {
        // Récupérer les favoris de l'utilisateur depuis la base de données
        const userId = req.session.userId; // Supposons que l'ID de l'utilisateur soit stocké dans la session
        pool.query('SELECT * FROM favoris WHERE userId = ?', [userId], (error, results) => {
            if (error) {
                console.error('Erreur lors de la récupération des favoris de l\'utilisateur :', error);
                res.status(500).json({ message: 'Erreur lors de la récupération des favoris de l\'utilisateur' });
            } else {
                res.status(200).json(results);
            }
        });
    } else {
        // L'utilisateur n'est pas connecté, renvoyer une erreur non autorisée
        res.status(401).json({ message: 'Vous devez être connecté pour accéder à vos favoris' });
    }
});

app.post('/sendFeedback', (req, res) => {
    const feedback = req.body.feedback;
    // Affiche le feedback dans la console du serveur
    console.log('Feedback reçu:', feedback);
    // Insérer le feedback dans la base de données
    const sql = 'INSERT INTO feedbacks (feedback_text) VALUES (?)';
    connection.query(sql, [feedback], (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'insertion du feedback dans la base de données :', err);
            res.status(500).json({ error: 'Erreur lors du traitement du commentaire.' });
            return;
        }
        console.log('Feedback inséré avec succès dans la base de données');
        res.status(200).json({ message: 'Feedback inséré avec succès.' });
    });
});



// Démarrage du serveur sur le port spécifié
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
