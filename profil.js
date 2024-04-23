// Importer les modules nécessaires
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path'); // Module pour manipuler les chemins de fichier
const session = require('express-session');


// Initialisation de l'application Express
const app = express();
const PORT = 3000;


// Middleware pour parser le corps des requêtes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret', // Une clé secrète pour signer les cookies de session
    resave: false,
    saveUninitialized: true
}));

// Définir une route GET pour récupérer les informations depuis la base de données
app.get('/profil', (req, res) => {
  // Requête SQL pour sélectionner toutes les informations de votre table
  const sql = 'SELECT * FROM profil';

  // Exécuter la requête SQL
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Erreur lors de l\'exécution de la requête SQL :', err);
      res.status(500).send('Erreur du serveur');
      return;
    }
    // Envoyer les résultats au client
    res.json(results);
  });
});

app.post('/profil/infomation', async (req,res) =>{
    const userToUpdate = users.find(user => user.id === id);
    const {newUsername, newEmail, newPassword, newCity, newCountry } = req.body;
    
    if (userToUpdate) {
        if(!newUsername == null){userToUpdate.username = newUsername || userToUpdate.username;}
        if(!newEmail == null){userToUpdate.email = newEmail || userToUpdate.email;}
        if(!newPassword == null){
            const hashedPassword = await bcrypt.hash(password, 10);
            users.push({ username, email, password: hashedPassword });
        }
        if(!newCity == null){userToUpdate.city = newCity || userToUpdate.city;}
        if(!newCountry == null){userToUpdate.country = newCountry || userToUpdate.country;}

        res.status(200).json({ message: 'Utilisateur mis à jour avec succès.' });
    } else {
        res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
});


app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});