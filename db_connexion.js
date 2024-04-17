const mysql = require("mysql");
const pool = mysql.createPool({
    
    // host: "localhost", // Serveur de BD
   
    user: "melvin", // Utilisateur de BD
    password: "12Melvin", // Mot de passe
    database: "a2js_db", // Nom de la BD
    host : "127.0.0.1",
    port: "3308",
});

pool.getConnection((err, connection) => {
  if (err) throw err;
  console.log("Connection successfull");

  //Exemple de requête SQL
  connection.query('SELECT * FROM search_history', (err, results) => {
    if (err) {
      console.error('Erreur lors de l\'exécution de la requête SQL :', err);
      return;
    }
    console.log('Résultats de la requête :', results);
    
   
    connection.release();
  });
});

module.exports = pool;
