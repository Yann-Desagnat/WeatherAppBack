const mysql = require('mysql');
const pool = mysql.createPool({
  connectionLimit: 10,
  host: "localhost", // Serveur de BD
  user: "root", // Utilisateur de BD
  password: "",
  database: "a2js_db", // Nom de la BD 
  port: "3308",
  //user: "melvin", // Utilisateur de BD
  // password: "12Melvin", // Mot de passe
  
    // host : "192.168.1.36",
});

module.exports = pool;


pool.getConnection((err, connection) => {
  if (err) throw err;
  console.log("Connection successfull");

  /*Exemple de requête SQL
  connection.query('SELECT * FROM search_history', (err, results) => {
    if (err) {
      console.error('Erreur lors de l\'exécution de la requête SQL :', err);
      return;
    }
    console.log('Résultats de la requête :', results);
    
   
    connection.release();
  });*/
});

module.exports = pool;
