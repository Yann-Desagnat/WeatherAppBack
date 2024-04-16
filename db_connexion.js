const mysql = require("mysql");

const pool = mysql.createPool({
  connectionLimit: 10,
  host: "localhost", // Serveur de BD
  port:"3308",
  user: "root", // Utilisateur de BD
  password: "", // Mot de passe
  database: "a2js_db", // Nom de la BD
  });

pool.getConnection((err, connection) => {
  if (err) throw err;
  console.log("Connection successfull");

  // Exemple de requête SQL
  connection.query('SELECT * FROM searchHistory', (err, results) => {
    if (err) {
      console.error('Erreur lors de l\'exécution de la requête SQL :', err);
      return;
    }
    console.log('Résultats de la requête :', results);
    
   
    connection.release();
  });
});

module.exports = pool;
