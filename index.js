// Import des modules
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cors = require("cors");
const pool = require('./db_connexion');
const weatherRoutes = require('./prevision_meteo_backend');
const axios = require('axios');
const jwt = require('jsonwebtoken'); 

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

// partie utilisateur

//mot de passe est 12345A

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // Rechercher l'utilisateur dans la base de données par email
    pool.query('SELECT * FROM users WHERE email = ?', [email], (error, results) => {
        if (error) {
            console.error('Error fetching user:', error);
            return res.status(500).json({ error: 'Erreur lors de la recherche de l\'utilisateur' });
        }

        // Vérifier si un utilisateur avec cet email a été trouvé
        if (results.length > 0) {
            const user = results[0];

            // Vérifier le mot de passe
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    console.error('Error comparing password:', err);
                    return res.status(500).json({ error: 'Erreur lors de la vérification du mot de passe' });
                }

                if (isMatch) {
                    // Générer un token JWT pour l'utilisateur
                    const token = jwt.sign(
                        
                        { userId: user.id, userType: 'connecté' }, 
                        'RANDOM_TOKEN_SECRET',
                        { expiresIn: '24h' }
                    );

                    res.status(200).json({
                        message: 'Connexion réussie.',
                        userId: user.id,
                        token: token,
                        userType: 'connecté'

                    });
                } else {
                    res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
                }
            });
        } else {
            res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }
    });
});


// Routes
app.use('/api', weatherRoutes);

app.get('/', (req, res) => {
    res.status(200).send('Le serveur est opérationnel');
});
app.post('/register', (req, res) => {
    const { username, email, password, city, country } = req.body;

    // Vérifier si tous les champs requis sont fournis
    if (!username || !email || !password || !city || !country) {
        return res.status(400).json({ error: 'Tous les champs doivent être remplis' });
    }

    // Vérifier si l'email existe déjà
    pool.query('SELECT email FROM users WHERE email = ?', [email], (error, results) => {
        if (error) {
            console.error('Error checking user email:', error);
            return res.status(500).json({ error: 'Erreur lors de la vérification de l\'email' });
        }
        
        if (results.length > 0) {
            return res.status(409).json({ error: 'Cet email est déjà utilisé' });
        }

        // Si l'email n'existe pas, continuez avec l'inscription
        const saltRounds = 10;
        bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
            if (err) {
                return res.status(500).json({ error: 'Erreur lors du hashage du mot de passe' });
            }

            // Insérer les données de l'utilisateur dans la base de données
            pool.query('INSERT INTO users (username, email, password, city, country) VALUES (?, ?, ?, ?, ?)', 
            [username, email, hashedPassword, city, country], (error, results) => {
                if (error) {
                    console.error('Error registering user:', error);
                    return res.status(500).json({ error: 'Erreur lors de l\'enregistrement de l\'utilisateur' });
                }
                console.log('User registered successfully');
                res.status(200).json({ message: 'Utilisateur inscrit avec succès' });
            });
        });
    });
});



app.delete('/deleteUser', (req, res) => {
    const { email } = req.body;
    const user = users.find(user => user.email === email);
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



// gestion verification
function verifyUser(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'RANDOM_TOKEN_SECRET', (err, decoded) => {
            if (err) {
                console.error('Invalid Token:', err);
                req.user = { userType: 'anonymous', userId: null };
            } else {
                console.log(decoded);
                req.user = { 
                    userId: decoded.userId,
                    userType: 'connecté',
                };
                console.log(req.user.userType);
            }
            next(); 
        });
    } else {
        req.user = { userType: 'anonymous', userId: null };
        next();
    }
}

//gerer la carte météo

// recuperer data_map info sur les country
app.post('/weather/data_map', verifyUser, (req, res) => {
    console.log(req.user);  // Vérifiez ce qui est exactement dans req.user

    const { latitude, longitude, locationName } = req.body;
    const user_id = req.user.userId;  // Utilisez l'userID manuellement défini
    console.log("userID avant insertion:", user_id);  
    console.log("Données reçues:", latitude, longitude, locationName, user_id);
    const query = "INSERT INTO dataMap (latitude, longitude, locationName, userId) VALUES (?, ?, ?, ?)";
    const values = [latitude, longitude, locationName, user_id];
    pool.query(query, values, (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'insertion des données datamap:', err);
            res.status(500).send('Erreur lors de l\'insertion des données datamap');
        } else {
            res.status(200).json({ message: "Données reçues et traitées avec succès" });
        }
    });
});




// Route pour récupérer data de la map
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


// gestion historique


// Route pour enregistrer une ville dans l'historique
app.post('/weather/history', verifyUser, (req, res) => {
    const { city, details } = req.body;
    const { temp, description } = details;
    const userType = req.user.userType;
    const user_id =  req.user.userId;
    const createdAt = new Date();

    const query = "INSERT INTO search_history (city, temperature, description,user_id, created_at, userType) VALUES (?, ?,?, ?, ?, ?)";
    const values = [city, temp, description, user_id, createdAt, userType];


    pool.query(query, values, (err, result) => {
        if (err) {
            console.error('Error inserting weather data:', err);
            return res.status(500).send('Error inserting weather data');
        }
        res.status(200).send('Weather data inserted successfully');
    });
});


// Route pour récupérer l'historique des recherches
app.get('/weather/history',verifyUser, (req, res) => {
    if (!req.user || !req.user.userId) {
        return res.status(401).json({ message: 'Non autorisé' });
    }
    const userId = req.user.userId;
    const query = 'SELECT city, temperature, description, DATE_FORMAT(created_at, "%d/%m/%Y %H:%i") AS created_at, userType, user_id FROM search_history WHERE user_id = ? ORDER BY created_at DESC';
    
    pool.query(query, [userId], (error, results) => {
        if (error) {
            console.error('Erreur lors de la récupération des données météo:', error);
            res.status(500).json({ message: 'Erreur lors de la récupération des données météo' });
        } else {
            res.status(200).json(results);
        }
    });
});

// gerer les favories 


app.get('/favoris', verifyUser, (req, res) => {
    if (!req.user || req.user.userType !== 'connecté') {
        return res.status(401).json({ message: 'Authentification requise' });
    }
    const userId = req.user.userId;
    const query = 'SELECT city, country FROM favoris WHERE user_id = ?';
    pool.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des favoris:', err);
            res.status(500).json({ message: 'Erreur lors de la récupération des favoris' });
        } else {
            res.status(200).json(results);
        }
    });
});



//Ajouter une ville favorite
app.post('/addFavorite', verifyUser, (req, res) => {
    if (!req.user || req.user.userType !== 'connecté') {
        return res.status(401).json({ message: 'Authentification requise' });
    }

    const  user_id = req.user.userId;
      const{ city, country} = req.body;

      if (!city || !country) {
        return res.status(400).json({ message: 'Les champs ville et pays sont requis.' });
    }
    const query = 'INSERT INTO favoris (user_id, city, country) VALUES (?, ?, ?)';
    pool.query(query, [user_id, city, country], (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'ajout de la ville et du pays:', err);
            return res.status(500).json({ message: 'Erreur lors de l\'ajout des données' });
        } else {
            res.status(201).json({ message: 'Ville et pays ajoutée avec succès' });
        }
    });
});

// Supprimer favori
app.delete('/removeFavorite', verifyUser, (req, res) => {
    if (!req.user || req.user.userType !== 'connecté') {
        return res.status(401).json({ message: 'Authentification requise' });
    }

    const user_id = req.user.userId; 
    const { city, country } = req.body;
    const query = 'DELETE FROM favoris WHERE user_id = ? AND city = ? AND country = ?';
    pool.query(query, [user_id, city, country], (err, result) => {
        if (err) {
            console.error('Erreur lors de la suppression du favori:', err);
            res.status(500).json({ message: 'Erreur lors de la suppression du favori' });
        } else {
            res.status(200).json({ message: 'Favori supprimé avec succès' });
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



app.get('/idGet', authToken, (req, res)=>{
    const token = req.headers.authorization.split(' ')[1];
       const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET');
       const userId = decodedToken.userId;
       res.status(200).json(userId)
    
})


function authToken(req, res, next){
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET');
        const userId = decodedToken.userId;
        req.auth = {
            userId: userId
        };
     next();
    } catch(error) {
        res.status(401).json({ error });
    }
 };


// Démarrage du serveur sur le port spécifié
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
