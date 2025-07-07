const mysql = require('mysql2');
const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Password123!',
    database: 'pbl_310'
});

conn.connect((err) => {
    if (err) {
      console.error('Error connecting to the database:', err.stack);
      return;
    }
    console.log('DB Connected as ID ' + conn.threadId);
});

module.exports = conn;