import { useContext, useState, useEffect } from "react";
import { CRMContext } from "./CrmContext";
import axios from "axios";
import { Link } from "react-router-dom";

const FormPage = () => {
  const { forms, setForms } = useContext(CRMContext);
  const [form, setForm] = useState({ name: "", uniqueNumber: "", typeOf: "חומרה" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedForm, setEditedForm] = useState({ name: "", uniqueNumber: "", typeOf: "" });

  useEffect(() => {
    const fetchUserForms = async () => {
      try {
        // Fetch only the user's own forms
        //it will be changed to new path when will be newer permissions
        const response = await axios.get(`http://localhost:3000/forms`);
        const gotData= response.data.map((f)=>({...f,typeOf:newArrange[f.typeOf]||f.typeOf}));
        setForms(gotData);
      } catch (error) {
        console.error("Error fetching user-specific forms:", error);
      }
    };
    fetchUserForms();
  }, []);

  // Handle Input Change for New Form Submission
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  // Handle File Selection
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };


  // Submit New Form
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.uniqueNumber || !form.typeOf) {
      alert("All fields are required.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("uniqueNumber", form.uniqueNumber);
      formData.append("typeOf", form.typeOf);
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const response = await axios.post("http://localhost:3000/forms", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setForms((prev) => [...prev, {...response.data,typeOf:newArrange[response.data.typeOf]}]);
      setForm({ name: "", uniqueNumber: "", typeOf: "החרגה" });
      setSelectedFile(null);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  // Handle Editing (Pre-fill Inputs)
  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditedForm({
      name: forms[index].name,
      uniqueNumber: forms[index].uniqueNumber,
      typeOf: forms[index].typeOf,
    });
  };

  // Handle Input Change for Editing
  const handleEditInputChange = (event) => {
    const { name, value } = event.target;
    setEditedForm((prev) => ({ ...prev, [name]: value }));
  };

  // Save Edited Form
  const handleSave = async () => {
    const formId = forms[editingIndex].id;
    try {
      const updatedForm={...editedForm,typeOf:Object.keys(newArrange).find((key)=>newArrange[key]===editedForm.typeOf)};
      const response = await axios.put(`http://localhost:3000/forms/${formId}/user`, updatedForm);
      if (response.status === 200) {
        setForms((prevForms) =>
          prevForms.map((form) => (form.id === formId ? { ...form, ...response.data } : form))
        );
        setEditingIndex(null);
      }
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  // Delete Form (Mark as Not Relevant)
  const toggleRelevance = async (index) => {
    try {
      const formId = forms[index]?.id;
      if (!formId) return;

      const deleteReq = await axios.delete(`http://localhost:3000/forms/${formId}`);

      if (deleteReq.status === 204) {
        setForms((prevForms) => prevForms.filter((f) => f.id !== formId));
        console.log("Issue deleted successfully.");
      } else {
        console.error("Failed to delete the issue.");
      }
    } catch (error) {
      console.error("Error deleting form:", error);
    }
  };

  const newArrange={
    option1:"חומרה",
    option2:"החרגה",
    option3:"office,microsoft",
    option4:"רשת",
    option5:"אימג",
  };


  return (
    <div>
      <h2>Submit New Form</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" value={form.name} onChange={handleInputChange} required />
        <input type="text" name="uniqueNumber" value={form.uniqueNumber} onChange={handleInputChange} required />
        <select name="typeOf" value={form.typeOf} onChange={handleInputChange}>
        {Object.entries(newArrange).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>  // ✅ Correct: Store backend keys
          ))}
        </select>
        <input type="file" onChange={handleFileChange} />
        <button type="submit">Submit</button>
      </form>
      <Link to="/dashboard">View Issues</Link>

      <h2>Your Forms</h2>
      {forms.length === 0 ? <p>No forms available</p> : null}
      <ul>
        {forms.map((form, index) => (
          <li key={form.id}>
            {editingIndex === index ? (
              <>
                <input type="text" name="name" value={editedForm.name} onChange={handleEditInputChange} />
                <input type="text" name="uniqueNumber" value={editedForm.uniqueNumber} onChange={handleEditInputChange} />
                <select name="typeOf" value={editedForm.typeOf} onChange={handleEditInputChange}>
                  {Object.entries(newArrange).map(([value,label])=>(
                    <option key={value} value={value}>{label}</option>  // ✅ Correct: Store backend keys
                  ))}
                </select>
                <button onClick={handleSave}>Save</button>
                <button onClick={() => setEditingIndex(null)}>Cancel</button>
              </>
            ) : (
              <>
                <span>{form.name} | {form.uniqueNumber} | {form.typeOf} | {form.takeNumber} | {form.status}</span>
                <button onClick={() => handleEdit(index)}>Edit</button>
              </>
            )}
            <button onClick={() => toggleRelevance(index)}>Not Relevant</button>
          </li>
        ))}
      </ul>
      
      <Link to="/edit/:id">for test psge</Link>
    </div>
  );
};

export default FormPage;
