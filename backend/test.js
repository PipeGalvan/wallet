   const mysql = require('mysql2');
   const conn = mysql.createConnection({
     host: '172.25.144.1', port: 3306,
     user: 'gx', password: 'NuntiusGX2019!',
     database: 'nuntius'
   });
   conn.connect(err => {
     console.log(err || 'Conectado OK');
     conn.end();
   });