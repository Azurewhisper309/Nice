import express from 'express';                 // The web framework for handling routes, middleware, etc.
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import sanitizeFormInput, { sanitizeUser } from '../Middleware/sanitized.js';
import pool from '../db.js'; // Database connection pool
import injectUserRole from '../Middleware/injectUserRole.js';
import validateUserExists from '../Middleware/validateUserExists.js';
import {getCurrentAzureAdmins} from '../utils/getCurrentAzureAdmins.js';

const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, 
  message:'to much requests!'            // limit each IP to 30 requests/min
});

const router_admin=express.Router();
router_admin.use(helmet()); // Use Helmet to secure Express apps by setting various HTTP headers
router_admin.use(injectUserRole); // Inject user role into request object
router_admin.use('/dashboard/forms', adminLimiter); // Apply rate limiting to the admin dashboard forms route
//////////////////////
////////ADMIN/////////
//////////////////////

/////////////////
////all forms////
/////////////////

// this route is to get all forms from the database with frontend logic
// that the admin can set how to filter it with take_number and status
//and that sent to backend and than write basic sql query to get the forms
//and 2 variables one for status and second to the valid statuses that are allowed
//and then check if the status and take_number are not with invalid values
//and then after checking it check if there's isn't status to filter by the user
//itself forms and if there is status than filter by it and if not filter just by new
// and if the status is mine than the take_number is the user id of myself
//and if the status is not-relevant than don't filter by it,it's okay that will be take_number
//but without status than order by date and then try this query and catch if error
router_admin.get('/dashboard/forms', async (req, res) => {
  const { status, take_number } = req.query;
  const values = [];
  let sql = `SELECT * FROM forms WHERE 1=1`;
  const allowedStatuses = ['new', 'in-treatment', 'pending', 'fixed', 'not-relevant', 'mine'];
  const effectiveStatus = status || 'new';

  if (status && !allowedStatuses.includes(status)) {
    console.error(`Rejected status query: ${status} from user ${req.user.id}`);
    return res.status(400).json({ error: 'Invalid status value' });
  }

  if (take_number && isNaN(parseInt(take_number))) {
    console.error(`Rejected take_number query: ${take_number} from user ${req.user.id}`);
    return res.status(400).json({ error: 'Invalid take_number value' });
  }

  if (effectiveStatus === 'mine') {
    sql += ` AND take_number = $${values.length + 1}`;
    values.push(req.user.id);
  } else if (effectiveStatus === 'not-relevant') {
    return res.status(400).json({ error: '"not-relevant" forms are shown in the recovery page only' });
  } else {
    sql += ` AND status = $${values.length + 1}`;
    values.push(effectiveStatus);
  }

  if (take_number) {
    sql += ` AND take_number = $${values.length + 1}`;
    values.push(parseInt(take_number));
  }

  sql += ' ORDER BY created_at DESC';

  try {
    const result = await pool.query(sql, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err, 'GET /dashboard/forms failed');
    return res.status(500).json({ err: 'Database error' });
  }
});



 

 
/////////////////////
//get specific form//
/////////////////////

//here i get specific form by Id that admin chose if valid and by formId 
//after checking if the formId is valid and if not return error with status 400

router_admin.get('/dashboard/:formId', async (req, res) => {
  const { formId } = req.params;

  // Validate formId
  const id = parseInt(formId, 10);
  if (!id || isNaN(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid form ID' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM forms WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Form not found' });
    }

    return res.json(result.rows[0]); // Return the full form object
  } catch (err) {
    console.error('GET /dashboard/:formId failed', err);
    return res.status(500).json({ error: 'Database error' });
  }
});


    //////////
    ///king///
    //////////

    //return amount of forms admin fixed and grouped by take_number
    router_admin.get('/dashboard/king', async (req, res) => {
  const sql = `
    SELECT u.name, u.email, COUNT(f.id) AS fixed_count
    FROM forms f
    JOIN users u ON u.id = f.take_number
    WHERE f.status = 'fixed'
    GROUP BY u.name, u.email
    ORDER BY fixed_count DESC;
  `;

  try {
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /dashboard/king failed', err);
    res.status(500).json({ error: 'Database error' });
  }
});
 
/////////////////////
//Admin update Form//
/////////////////////

//in first step i get the formId and check if valid then check if the status and take_number are valid
//and extract them from the body and sanitize them and then get the fields from the form and if the form exist
//after error handlling then check if something have changed and if not return message that nothing have changed
//and if something have changed then update the form and response with the updated form
//after updating check id status is not-relevant and if yes then extract the form and delete it from forms table
//and insert it into not_relevant_forms table and response with message that form moved to not relevant
//and if not-relevant status is not set then just response with updated form
router_admin.put('/dashboard/forms/:formId',async(req,res)=>{
  const formId=req.params.formId;
    if (!formId || isNaN(parseInt(formId))) {
        console.error(`Invalid formId: ${formId} from user ${req.user.id}`);
        return res.status(400).json({ error: 'Invalid formId' });
    }
    const fieldsToUpdate = {status:req.body.status, take_number:req.body.take_number};
    const {status, take_number} = sanitizeFormInput(fieldsToUpdate);
  
    if (!status || !take_number|| typeof status !== 'string' || isNaN(parseInt(take_number))) {
        console.error(`Invalid status or take_number: ${status}, ${take_number} from user ${req.user.id}`);
        return res.status(400).json({ error: 'Invalid status or take_number' });
    }

  try{
    const {rows}=await pool.query('SELECT * FROM forms WHERE ID=$1',[formId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Form not found' });
    const current=rows[0];

    // Check if anything actually changed
    const statusChanged = status !== current.status;
    const takeNumberChanged = take_number !== current.take_number;
    
    if(!statusChanged && !takeNumberChanged){
      console.log("nothing have changed");
      return res.json({ message: "No changes detected", form: current });
    }
    const req_put = await pool.query('UPDATE forms SET status=$1,take_number=$2 WHERE ID=$3 RETURNING *',[status,take_number,formId]);
    const updatedForm = req_put.rows[0];
    if (!updatedForm) {
      return res.status(404).json({ error: 'Form not found' });
    }

    /////////////////////////////////
    // Handle "not relevant" status//
    ////////////////////////////////

   
    if(status === "not-relevant"){
      const {status,id ,title ,created_at ,take_number ,file_path ,description, } = updatedForm;
     const deleteForm= await pool.query('DELETE FROM forms WHERE ID=$1',[formId]);
      if(deleteForm.rowCount===0) {
        return res.status(404).json({ error: 'Form not found' });
      }
      await pool.query('INSERT INTO not_relevant_forms (status,id ,title ,created_at ,take_number ,file_path ,description,not_relevant_at) VALUES ($1, $2, $3, $4, $5, $6,$7, NOW())',[status,id ,title ,created_at ,take_number ,file_path ,description]);
      
      return res.json({ message: "Form moved to not relevant table" });
    }
    
    res.json({ message: "Form updated successfully", form: updatedForm });
    
  } catch(err){
    console.error(err,"failed to update form");
    res.status(500).json({error:"Database Error"});
  }
});







///////////////////////////////////////
// Admin get not_relevant form////////
/////////////////////////////////////
router_admin.get('/not-relevant-forms', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        f.*,
        u.name AS submitter_name,
        a.name AS admin_name
      FROM not_relevant_forms f
      LEFT JOIN users u ON f.submitted_by = u.id   -- submitter (user)
      LEFT JOIN users a ON f.take_number = a.id    -- assigned admin
      ORDER BY f.not_relevant_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error('Failed to fetch not-relevant forms with names', err);
    res.status(500).json({ error: 'Database error' });
  }
});



///////////////////////////////////
//get form back from not relevant//
///////////////////////////////////


//this path checks first after i have got the formId if it's valid
//and then checks in try if the form exist in not_relevant_forms table
//then get the form and sanitize it and then delete it from not_relevant_forms
//and then insert it back to the forms table and response with message that form moved back
//with catch if error response
router_admin.post('/not-relevant/:getbackFormId', async (req, res) => {
const getbackFormId = req.params.getbackFormId;
if(!getbackFormId || isNaN(parseInt(getbackFormId))){
    console.error(`Invalid form id sent:${getbackFormId} from admin ${req.user.id}`);
    return res.status(400).json({ error: 'Invalid form id' });
}
    try {
        const {rows} = await pool.query('SELECT * FROM not_relevant_forms WHERE id=$1', [getbackFormId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Form not found in not relevant' });
        const form = rows[0];
        const sanitized=sanitizeFormInput(form);
        const {rowToDelete}=await pool.query('DELETE FROM not_relevant_forms WHERE id=$1', [getbackFormId]);
        if(!rowToDelete) {return res.status(404).json({error:'Form not found in not relevant to get back'})};
        await pool.query(
            'INSERT INTO forms (status, id, title, created_at, take_number, file_path, description,type_of,room_number) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [
            sanitized.status,
            sanitized.id,
            sanitized.title,
            sanitized.created_at,
            sanitized.take_number,
            sanitized.file_path,
            sanitized.description,
            sanitized.type_of,
            sanitized.room_number
            ]
        );
        res.json({ message: "Form moved back to forms table", form });
    } catch (err) {
        console.error('Error during admin sync:', err);
        res.status(500).json({ error: 'Failed to sync admins' });
    }
});

//////////////////////////////////////////
///DELETE FORM FROM NOT RELEVANT TABLE///
/////////////////////////////////////////

//not-relevant page admin deletes form permanently and gets the formId 
//and than validate the field is valid and then try to delete the form by Id
//and if the response is null then return error with status 404
//and if the form deleted successfully then response with message that form deleted
// and catch if error response
router_admin.delete('not-relevant/:formToDeleteId',async(req,res)=>{
    const formToDeleteId=req.params.formToDeleteId;
    if(!formToDeleteId ||isNaN(parseInt(formToDeleteId))){
        console.error(`Invalid form id sent:${formToDeleteId} from admin ${req.user.id}`);
        return res.status(400).json({error:'Invalid Form Id'});
    }
    try{
        const res_delete_permantly=await pool.query('DELETE FROM not_relevant_forms WHERE id=$1 RETURNING *',[formToDeleteId]);
        if (res_delete_permantly.rowCount === 0) {
            console.warn(`No form found with id: ${formToDeleteId}`);
            return res.status(404).json({ error: 'Form not found in not relevant' });
        }
        res.json({message:"Form deleted from not relevant permanently", form_deleted: res_delete_permantly.rows[0]});
    }
    catch(err){
        console.error(err,"DELETE/ failed from not_relevant");
        res.status(500).json({error:'failed to delete from not relevant'});
    }
})



///////////////////////////////t//////////
/////Admins list from azure+get them/////
/////////////////////////////////////////

//this route first calls the getAzureToken function to get the list of admins and then vlaidate for each admin
//if the admin name and id are vlaid and then query for each one checks if admin exist and if not insert it into the database
//and then response with message that synced from azure app roles and catch if error
import { getCurrentAzureAdmins } from '../utils/azure.js';
import { sanitizeUser } from '../utils/sanitized.js'; // assuming your sanitizeUser is here

router_admin.post('/list/sync-admins', async (req, res) => {
  try {
    const adminList = await getCurrentAzureAdmins(); // fetched from Graph API

    for (const admin of adminList) {
      try {
        const { id, name, email } = sanitizeUser(admin);

        const existing = await pool.query(
          'SELECT * FROM users WHERE id = $1 AND name = $2',
          [id, name]
        );

        if (existing.rows.length === 0) {
          await pool.query(
            'INSERT INTO users (id, name, email, is_kicked) VALUES ($1, $2, $3, false)',
            [id, name, email]
          );
        }
      } catch (innerError) {
        console.warn(`Skipping invalid admin: ${JSON.stringify(admin)} — ${innerError.message}`);
        continue;
      }
    }

    res.json({ message: 'Synced admins from Azure successfully' });
  } catch (err) {
    console.error('Error during admin sync:', err);
    res.status(500).json({ error: 'Failed to sync admins' });
  }
});
  

 

//////////////////////////////
/////Admins put is_kicked/////
//////////////////////////////


//this route is gets first the admin id and checks if exist and then 
//if field valid try and edit the is_kicked field to true when next time this
//admin won't be seen in the list and then checks if this user exist and print him
//then catch if error
router_admin.put('/list/delete/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    // Check if user exists and is not already kicked
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    if (user.is_kicked) {
      return res.status(400).json({ error: 'User is already marked as kicked' });
    }

    // Mark user as kicked
    await pool.query(
      'UPDATE users SET is_kicked = true WHERE id = $1',
      [userId]
    );

    res.json({ message: `User ${userId} has been marked as kicked.` });
  } catch (err) {
    console.error('Failed to update user kick status:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

    



export default router_admin;