import pool from '../db.js';
import { sanitizeUser } from '../Middleware/sanitized.js';

export default {
  async findByOid(oid) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [oid]);
    if (result.rowCount === 0) {
      return null; // User not found
    }
    return result.rows[0];
  },

  async insertIfMissing(rawUser) {
    const { id } = rawUser;

    const existing = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (existing.rowCount > 0) return; // already exists

    const user = sanitizeUser(rawUser);

    await pool.query(
      `INSERT INTO users (id, name, email, role)
       VALUES ($1, $2, $3, $4)`,
      [user.id, user.name, user.email, user.role]
    );
  }
};
