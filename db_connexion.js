const mysql = require("mysql");

const pool = mysql.createPool({
  connectionLimit: 10,
  host: "localhost", // Serveur de BD
  user: "root", // Utilisateur de BD
  password: "esme", // Mot de passe
  database: "a2js_db", // Nom de la BD
});

pool.getConnection((err, connection) => {
  if (err) throw err;
  console.log("Connection successfull");
  connection.release();
});

module.exports = pool;
