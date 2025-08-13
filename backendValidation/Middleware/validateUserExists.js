import pool from '../db.js';

export default async function validateUserExists(req, res, next) {

    if(req.user?.roles?.[0]?.toLowerCase() === 'admin') {
    try {
    const take_number = parseInt(req.body.take_number, 10);  
    const result = await pool.query('SELECT id FROM users WHERE id = $1',[take_number]);

    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'The submitted_by user does not exist.' });
    }
    if(!take_number || isNaN(parseInt(take_number))) {
      console.error(`Invalid submitted_by user id sent: ${take_number} from admin ${req.user.id}`);
      return res.status(400).json({ error: 'Invalid submitted_by user id' });
    }

    // Attach cleaned ID to req for the route to use
    req.validatedTakeNumber = take_number;

    next();
  } catch (err) {
    console.error('validateUserExists failed:', err);
    return res.status(500).json({ error: 'Database error validating user.' });
  }

  }

    else if(req.user?.roles?.[0]?.toLowerCase() === 'user') {
    try {
    const submitted_by = parseInt(req.body.submitted_by, 10);  
    const result = await pool.query('SELECT id FROM users WHERE id = $1',[submitted_by]);

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
}  
