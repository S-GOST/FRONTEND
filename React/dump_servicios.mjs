import mysql from 'mysql2/promise';
const config = { host: 'localhost', user: 'root', password: '', database: 'sgost' };
async function dump() {
  const conn = await mysql.createConnection(config);
  const [rows] = await conn.query('DESCRIBE servicios');
  rows.forEach(r => console.log(`${r.Field} - ${r.Type}`));
  await conn.end();
}
dump();
