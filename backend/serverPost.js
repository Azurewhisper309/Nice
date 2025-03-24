import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import cors from "cors";
import path from "path";
import pool, { query } from "./db.js"; // ✅ Import PostgreSQL
import { checkRole, auth } from "./userRoutes.js"; // ✅ Ensure this is correct


dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const checkDatabaseConnection = async () => {
  try {
    const res = await query("SELECT NOW()");
    console.log("✅ Database connected! Current Time:", res.rows[0].now);
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    process.exit(1); // Exit if the database is not reachable
  }
};

// Call the function to check the connection before starting the server
checkDatabaseConnection();

// Multer Configuration (for file uploads)
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

/* ==============================
   ✅  POST NEW FORM
   ============================== */
app.post("/forms", checkRole("user") ,auth, upload.single("file"), async (req, res) => {
  const { name, typeOf, uniqueNumber } = req.body;
  if (!name || !typeOf || !uniqueNumber) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO forms (name, typeOf, uniqueNumber, filePath, status, takeNumber) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, typeOf, uniqueNumber, req.file ? req.file.path : null, "New", ""]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error submitting form:", error);
    res.status(500).json({ message: "Database error" });
  }
});

/* ==============================
   ✅ DELETE FORM
   ============================== */
app.delete("/forms/:id", checkRole("user") ,auth, async (req, res) => {
  const formId = Number(req.params.id);
  
  try {
    const result = await pool.query("DELETE FROM forms WHERE id=$1 RETURNING *", [formId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Form not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting form:", error);
    res.status(500).json({ message: "Database error" });
  }
});

/* ==============================
   ✅ EDIT FORM (USER)
   ============================== */
app.put("/forms/:id/user", checkRole("user") ,auth, async (req, res) => {
  const formId = Number(req.params.id);
  const { name, typeOf, uniqueNumber } = req.body;

  try {
    const result = await pool.query(
      "UPDATE forms SET name=$1, typeOf=$2, uniqueNumber=$3 WHERE id=$4 RETURNING *",
      [name, typeOf, uniqueNumber, formId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Form not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Update failed:", error);
    res.status(500).json({ message: "Database error" });
  }
});

/* ==============================
   ✅ EDIT FORM (ADMIN)
   ============================== */
app.put("/forms/:id/admin", checkRole("admin") ,auth, async (req, res) => {
  const formId = Number(req.params.id);
  const { status, takeNumber } = req.body;

  try {
    const result = await pool.query(
      "UPDATE forms SET status=$1, takeNumber=$2 WHERE id=$3 RETURNING *",
      [status, takeNumber, formId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Form not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Update failed:", error);
    res.status(500).json({ message: "Database error" });
  }
});

/* ==============================
   ✅ GET ALL FORMS
   ============================== */
app.get("/forms", checkRole("admin") ,auth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM forms");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching forms:", error);
    res.status(500).json({ message: "Database error" });
  }
});

/* ==============================
   ✅ MOVE FORM TO RECOVERY add an sql injection
   ============================== */
app.post("/recoveryForms", checkRole("admin") ,auth, async (req, res) => {
  const { id, name, typeOf, uniqueNumber, status, takeNumber } = req.body;

  try {
    await pool.query("DELETE FROM forms WHERE id=$1", [id]);
    const result = await pool.query(
      "INSERT INTO recoveryForms (id, name, typeOf, uniqueNumber, status, takeNumber) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [id, name, typeOf, uniqueNumber, "Not Relevant", takeNumber]
    );

    res.status(201).json({ message: "Form moved to recovery", data: result.rows[0] });
  } catch (error) {
    console.error("Error moving form to recovery:", error);
    res.status(500).json({ message: "Database error" });
  }
});

/* ==============================
   ✅ GET ALL RECOVERY FORMS
   ============================== */
app.get("/recoveryForms", checkRole("admin") ,auth, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM recoveryForms");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching recovery forms:", error);
    res.status(500).json({ message: "Database error" });
  }
});

/* ==============================
   ✅ RESTORE FORM FROM RECOVERY
   ============================== */
   app.put("/recoveryForms/:id", checkRole("admin") ,auth, async (req, res) => {
    const formId = Number(req.params.id);
  
    try {
      // Step 1️⃣: Get the form from recoveryForms
      const result = await pool.query(
        "SELECT * FROM recoveryForms WHERE id=$1",
        [formId]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Form not found in recovery" });
      }
  
      const formToRestore = result.rows[0];
  
      // Step 2️⃣: Insert the form into the main forms table
      await pool.query(
        "INSERT INTO forms (id, name, typeOf, uniqueNumber, status, takeNumber) VALUES ($1, $2, $3, $4, 'Pending', $5)",
        [
          formToRestore.id,
          formToRestore.name,
          formToRestore.typeOf,
          formToRestore.uniqueNumber,
          formToRestore.takeNumber,
        ]
      );
  
      // Step 3️⃣: Delete the form from recoveryForms
      await pool.query("DELETE FROM recoveryForms WHERE id=$1", [formId]);
  
      // Step 4️⃣: Return the restored form
      res.status(200).json({ message: "Form restored", data: formToRestore });
    } catch (error) {
      console.error("Error restoring form:", error);
      res.status(500).json({ message: "Database error" });
    }
  });
  
/* ==============================
   ✅ GET KING SCREEN
   ============================== */


   app.get("/forms/king",checkRole("admin"),auth,async(req,res)=>{
    try{
      const getKing=await pool.query("SELECT takeNumber,status FROM recoveryForms WHERE status=$1",[fixed]);
      
    }
    catch(error){
      console.error("Error fetching king",error);
      res.status(500).json({message:"Database Error"});
    }
   });

app.listen(port, () => console.log(`Server running on port ${port}`));
