import pool from '../db.js';

export default async function validateUserExists(req, res, next) {
  const submitted_by = req.body.submitted_by || req.user.id;

  try {
    const result = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [submitted_by]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'The submitted_by user does not exist.' });
    }
    if(!submitted_by || isNaN(parseInt(submitted_by))) {
      console.error(`Invalid submitted_by user id sent: ${submitted_by} from user ${req.user.id}`);
      return res.status(400).json({ error: 'Invalid submitted_by user id' });
    }

    // Attach cleaned ID to req for the route to use
    req.validatedSubmittedBy = submitted_by;

    next();
  } catch (err) {
    console.error('validateUserExists failed:', err);
    return res.status(500).json({ error: 'Database error validating user.' });
  }
}
