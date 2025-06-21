const mysql = require('mysql2');
const conn = mysql.createConnection({
    host: '192.168.1.8',
    user: 'root',
    password: '',
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