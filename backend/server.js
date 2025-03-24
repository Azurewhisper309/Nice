/* Updated server.js */
import express from "express";
import multer from "multer";
import dotrnv from "dotenv";
import cors from "cors";
import path from "path";
import { data } from "react-router-dom";
import { query } from "./db.js";


const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

query("SELECT NOW()")
  .then((res) => console.log("✅ Database time:", res.rows[0]))
  .catch((err) => console.error("❌ Database error:", err.message));

let forms = [];
let recoveryForms =[];

//first submit

const getAll=async()=>{
  try{
    const res=await query("SELECT * FROM allforms");
    console.log("happend!",res.rows[0]);
  }
  catch(err){
    console.log("error while fetching",err.message);

  }
};
getAll();

//forms path
app.post("/forms", upload.single("file"), (req, res) => {
  const { name, typeOf, uniqueNumber } = req.body;
  if (!name || !typeOf || !uniqueNumber) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const newForm = { 
    id: Date.now(), 
    name, 
    typeOf, 
    uniqueNumber, 
    filePath: req.file ? req.file.path : null,  // ✅ Allow null if no file uploaded
    status: "New",  // Default status
    takeNumber: "", // Empty takeNumber field initially
  };

  forms.push(newForm);
  res.status(201).json(newForm);
});



app.delete('/forms/:id',(req,res)=>{
  const deleteId= Number(req.params.id);
  const isExist=forms.findIndex((f)=>f.id===deleteId);
  if(isExist===-1){
   return res.status(404).json({message: "couldnt find this form"});

  }
  forms=forms.filter(f=>f.id!==deleteId);
  res.status(204).send();
});



//

app.put("/forms/:id/user", (req, res) => {
  const formId = Number(req.params.id);
  const editedForm = req.body;

  const index = forms.findIndex((f) => f.id === formId);
  if (index === -1) {
    return res.status(404).json({ message: "Form not found" });
  }

  // Prevent users from modifying status and takeNumber
  const updatedForm = { 
    ...forms[index], 
    typeOf: editedForm.typeOf, 
    name: editedForm.name,
    uniqueNumber: editedForm.uniqueNumber
  };

  forms[index] = updatedForm;
  res.status(200).json(updatedForm);
});

//dashboard edit
app.put("/forms/:id/admin", (req, res) => {
  const formId = Number(req.params.id);
  const editedForm = req.body;

  const index = forms.findIndex((f) => f.id === formId);
  if (index === -1) {
    return res.status(404).json({ message: "Form not found" });
  }

  // Prevent users from modifying status and takeNumber
  const updatedForm = { 
    ...forms[index], 
    status: editedForm.status, 
    takeNumber: editedForm.takeNumber
  };

  forms[index] = updatedForm;
  res.status(200).json(updatedForm);
});




app.get("/forms", (req, res) => {
  res.json(forms);
});

//recoveryformspath

app.delete("/recoveryForms/:id", (req, res) => {
  const formId = Number(req.params.id);
  const index = recoveryForms.findIndex((item) => item.id === formId);

  if (index === -1) {
    return res.status(404).json({ message: "Form not found" });
  }

  recoveryForms = recoveryForms.filter(f => f.id !== formId);
  res.status(200).json({ message: "Form deleted" });
});


app.post("/recoveryForms", (req, res) => {
  const notRel = req.body;
  if (!notRel || !notRel.id) {
    return res.status(400).json({ message: "Invalid form" });
  }
  forms = forms.filter((f) => f.id !== notRel.id);

  // Move the form to recovery
  recoveryForms.push({ ...notRel, status: "Not Relevant" });

  res.status(201).json({ message: "Form moved to recovery", data: notRel });
});



//putting back the form from recovery form
app.put("/recoveryForms/:id", (req, res) => {
  const formId = Number(req.params.id);
  const index = recoveryForms.findIndex((item) => item.id === formId);

  if (index === -1) {
    return res.status(404).json({ message: "Form not found in recovery" });
  }

  const restoredForm = { ...recoveryForms[index], status: "Pending" };

  // Remove from recovery and add back to forms
  recoveryForms = recoveryForms.filter(f => f.id !== formId);
  forms.push(restoredForm);

  res.status(200).json({ message: "Form restored", data: restoredForm });
});


//get all recoveryForms to RecoveryPage component

app.get("/recoveryForms",(req,res)=>{
  res.json(recoveryForms);
});



//dashboard watching
app.put("/dashboard/forms/:id", (req, res) => {
  const formId = Number(req.params.id);
  const { takeNumber, status } = req.body;

  const index = forms.findIndex((f) => f.id === formId);
  if (index === -1) {
    return res.status(404).json({ message: "Form not found" });
  }

  forms[index] = { ...forms[index], takeNumber, status };
  res.status(200).json(forms[index]);
});



app.use("/uploads", express.static("uploads"));
app.listen(port, () => console.log(`Server running on port ${port}`));
