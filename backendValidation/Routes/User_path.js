import express from 'express';                 // The web framework for handling routes, middleware, etc.
import upload from '../Middleware/Multer.js';
import sanitizeFormInput from '../Middleware/sanitized.js';
import validateUserExists from '../Middleware/validateUserExists.js';
import pool from '../db.js'; // Database connection pool
import { executePermissionGrant } from '../utils/sharepointValidation.js';
import { limiter } from '../auth/sessionHandlers.js';

const router_user=express.Router();

//////////////
//user forms//
//////////////
//pass all the forms of user
//that's my explanation for understanding the logic in
// code:to get the user forms
// ,first i take the user id and then i query the general
//forms data with the name of user with join and then
//after validating that's the the got data isn't null 
// i get the answer and catching if error
router_user.get('/forms',async(req,res)=>{
const userId=req.user.id;
try{
    const {rows}=await pool.query('SELECT forms.title,users.name AS take_number,forms.created_at FROM forms JOIN users ON forms.take_number=users.id WHERE forms.submitted_by=$1 ORDER BY forms.created_at DESC',[userId]);
    if(rows.length===0){
        return res.status(404).json({ error: `No forms found for this user: ${userId}` });
    }
    res.json(rows);
}
catch(err){
    console.error(err,'GET/ forms failed');
    return res.status(500).json({error:'Database Error'});
}
});
///////////////
//upload form//
///////////////
//in this route i am posting a form with multer and validating the user exists at submitted_by field
//and then i sanitize all and then insert the sanitized form into forms table and get the response

router_user.post('/forms/upload',
  upload.single('file'),
  limiter,
  validateUserExists,
  async (req, res) => {
    const submitted_by = req.validatedSubmittedBy;
    const fileName = req.file?.filename || null;

    const allFields = {
      title: req.body.title,
      description: req.body.description,
      submitted_by,
      file_path: fileName,
      type_of: req.body.type_of,
      room_number: req.body.room_number,
      who_to_add: req.body.who_to_add ? JSON.parse(req.body.who_to_add) : [],
      permission: req.body.permission,
      site: req.body.site ? JSON.parse(req.body.site) : null,
    };
    const role = req.user.role; // safe, already validated by checkRole
    const {
      title, description, submitted_by: cleanSubmittedBy, file_path,
      room_number, type_of, who_to_add, permission, site
    } = sanitizeFormInput(allFields,role);

    if (submitted_by !== req.user.id) {
      console.warn(`Unauthorized upload attempt by user ${req.user.id}`);
      return res.status(403).json({ error: 'You can only upload your own forms' });
    }

    let status = 'new';

    try {
      if (type_of === 'sharepoint permissions') {
        await executePermissionGrant({
          type_of,
          who_to_add,
          permission,
          site,
          submitted_by: cleanSubmittedBy,
        });
        status = 'completed';
      }
      // else if (type_of === 'azure permissions') {
      //   await validateAzureForm({ who_to_add, permission });
      // }
    } catch (error) {
      console.error('Permission validation failed:', error.message);
      status = 'error';
    }

    try {
      const upload = await pool.query(`
        INSERT INTO forms (file_path, title, description, submitted_by, created_at, type_of, room_number, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [file_path, title, description, cleanSubmittedBy, new Date(), type_of, room_number, status]);

      const newForm = upload.rows[0];

      if (!newForm) {
        console.error('Form not inserted');
        return res.status(500).json({ error: 'Upload failed' });
      }

      const resultMsg = status === 'error'
        ? 'Form uploaded with validation errors'
        : 'Form uploaded successfully';

      return res.status(201).json({ message: resultMsg, form: newForm });

    } catch (err) {
      console.error('DB insert error:', err);
      return res.status(500).json({ error: 'Database Error' });
    }
  }
);

/////////////////////
//user preview form//
/////////////////////

//this route is to see more fields when opening it to 
// option to delete also this form with click in frontend
//first i get the form id and then validate it's right and then i 
// query the fields and check if the answer isn't null
// and then response with the preview form and catch
router_user.get('/forms/:formId/preview',async (req,res)=>{
const formId=req.params.formId;
;
    if(!formId ||isNaN(parseInt(formId))){
    console.error(`Invalid user id sent: ${userForms} from user ${req.user.id}`);
    return res.status(400).json({ error: 'Invalid user id' });
    }
    try{
        const {rows}=await pool.query('SELECT forms.room_number,forms.title,users.name AS take_number,forms.status,forms.created_at FROM forms JOIN users ON forms.take_number=users.id WHERE forms.submitted_by=$1 AND forms.id=$2',[req.user.id,formId]);
        if(rows.length===0){
            return res.status(404).json({ error: 'Form not found for this user' });
        }
        res.json(rows[0]); // Return the first row as the form preview
    }
    catch(err){
        console.error(err,'failed to get preview form');
        return res.status(500).json({ error: 'Database Error' });
    }
});


//////////////////////////////////////////////////////////////////////
//user preview specific form set not-relevant and delete permanently//
//////////////////////////////////////////////////////////////////////
//get the form id and validate it's right and then i query the fields and check if the answer isn't null
//and then response with deleted form with catch at the end
router_user.delete('/forms/:formId', async (req, res) => {
  const formId = req.params.formId;
    if (!formId || isNaN(parseInt(formId))) {
        console.error(`Invalid form id sent: ${formId} from user ${req.user.id}`);
        return res.status(400).json({ error: 'Invalid form id' });
    }
  try {
    const res_delete_form = await pool.query('DELETE FROM forms WHERE id=$1 AND submitted_by=$2 RETURNING *',[formId,req.user.id]);
    if(res_delete_form.rowCount === 0) {
        return res.status(404).json({error: `form not found with id ${formId} from user ${req.user.id}`});
    }
    return res.status(200).json({ message: 'Form deleted successfully', form: res_delete_form.rows[0] });
  } catch (err) {
    console.error(err, 'DELETE/ failed to delete form');
    return res.status(500).json({ error: 'Database Error' });
    }
});




/////////////////////////////
//user specific chosen form//
////////////////////////////
//sam as preview with all fields to get fro m query
router_user.get('/forms/:formId',async(req,res)=>{
  const  {formId} =req.params;
    if(!formId || isNaN(parseInt(formId))){
        console.error(`Invalid form id or user id sent: ${formId}, ${userForms} from user ${req.user.id}`);
        return res.status(400).json({ error: 'Invalid form id' });
    }
    if (submitted_by !== req.user.id) {
        console.warn(`Unauthorized update attempt by user ${req.user.id} on form owned by ${submitted_by}`);
        return res.status(403).json({ error: 'You can only update your own forms' });
    }

  try{
     const res_check=await pool.query('SELECT submitted_by FROM forms WHERE id=$1',[formId]);
    if(res_check.rowCount===0){
        return res.status(404).json({error:'Form not found'});
    }
    
    const {rows}=await pool.query('SELECT forms.*,users.name as submitted_by FROM forms JOIN users ON forms.submitted_by=users.id WHERE forms.id=$1 AND forms.submitted_by=$2',[formId,req.user.id]);
    if(rows.length===0){
        return res.status(404).json({ error: 'Form not found for this user' });
    }
    res.json(rows[0]);
  }
  catch(err){
    console.error('GET/ failed to get the specific form user!',err);
    return res.status(500).json({error:'Database Error'});
  }
});

    ///////////////
    //change form//
    ///////////////

    //option to upload file also than extract the body to sanitize all and than try with 
    //request to get the form first and check if exist and if yes than move on to update the form
    //and then response with the updated form and catch if error
    router_user.put('/form/:formEditedId',upload.single('file'),async(req,res)=>{
    const formEditedId=req.params.formEditedId;
    if (!formEditedId || isNaN(parseInt(formEditedId))){
        console.error(`Invalid form id sent: ${formEditedId} from user ${req.user.id}`);
        return res.status(400).json({ error: 'Invalid form id' });
    }
    if (submitted_by !== req.user.id) {
        console.warn(`Unauthorized update attempt by user ${req.user.id} on form owned by ${submitted_by}`);
        return res.status(403).json({ error: 'You can only update your own forms' });
    }
    const fields = {
        title: req.body.title,
        file_path: req.file?.path||null,
        description: req.body.description,
        submitted_by: req.body.submitted_by,
    };
    const role = req.user.role; // safe, already validated by checkRole
    const { title, description, file_path, submitted_by } = sanitizeFormInput(fields, role);

    try{
    const res_check=await pool.query('SELECT * FROM forms WHERE id=$1 AND submitted_by=$2',[formEditedId, submitted_by]);
    if(res_check.rowCount===0){
        return res.status(404).json({ error: 'Form not found' });
    }

    const user_put=await pool.query('UPDATE forms SET file_path=$1,title=$2,description=$3 WHERE id=$4 AND submitted_by=$5 RETURNING *',[file_path, title, description, formEditedId, submitted_by]);

        const updatedForm = user_put.rows[0];
        res.json({message:'form updated',form:updatedForm});
    }
    catch(err){
        console.error(err,"failed to update form");
        return res.status(500).json({error:"Database Error"});
    }
    });
    router_user.get('/_smoke', (req, res) => {
    res.status(200).json({ message: 'User routes are working!' });
    });





    export default router_user;

    