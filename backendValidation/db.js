// db.js
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.PG_CONNECTION,
  ssl: { rejectUnauthorized: false } // only if using Heroku or SSL
});

export default pool;


router_admin.put('list/delete/:userId',validateUserExists,async(req,res)=>{
const adminList = await getCurrentAzureAdmins(); // correct, structured Graph call
for (const admin of adminList) {
  const { id, name } = admin;
  if (!id || typeof id !== 'string' || !name || typeof name !== 'string') {
    console.warn(`Invalid admin data: id=${id}, name=${name}`);
    continue;
  }
  const {name:sanitizedName,id: sanitizedId} = sanitizeUser({name, id});
  const existing = await pool.query('SELECT * FROM users WHERE id = $1', [sanitizedId]);
  if (existing.rowCount === 0) {
    await pool.query('INSERT INTO users (id, name, is_kicked) VALUES ($1, $2, false)', [sanitizedId, sanitizedName]);
  }
}
});