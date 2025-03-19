import { useContext, useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { CRMContext } from "./CrmContext";
import axios from "axios";

const Dashboard = () => {
  const { allForms, setAllForms,setRecoveryForms } = useContext(CRMContext);
  const [editingId, setEditingId] = useState(null); // ✅ Use ID instead of index
  const [edited, setEdited] = useState({ takeNumber: "", status: "" });

  const handleEdit = (id) => {
    const selectedForm = allForms.find((form) => form.id === id);
    if (!selectedForm) {
      console.error("Invalid form ID, may be removed.");
      return;
    }

    setEditingId(id);
    setEdited({
      takeNumber: selectedForm.takeNumber || "",
      status: selectedForm.status || "New",
    });
  };

  const fetchAllForms = async () => {
    try {
      const response = await axios.get("http://localhost:3000/forms");
      setAllForms(response.data);
    } catch (error) {
      console.error("Error fetching forms:", error);
    }
  };

  useEffect(() => {
    console.log("All Forms Updated:", allForms);
  }, [allForms]);

  useEffect(() => {
    fetchAllForms();
  }, []);

  const handleInputChange = (field, value) => {
    setEdited((prevEdited) => ({
      ...prevEdited,
      [field]: value,
    }));
  };
//put request action 
  const handleSave = async () => {
    try {
      const formId = editingId; // ✅ Use ID instead of index

      if (!formId) {
        console.error("Invalid editing ID.");
        return;
      }

      if (edited.status === "Not Relevant") {
        try {
          const selectedForm = allForms.find((form) => form.id === formId);
          if (!selectedForm) {
            console.error("Form not found, may be removed.");
            return;
          }
      
          // ✅ Step 1: Move form to recoveryForms
          const toRecovery = await axios.post(`http://localhost:3000/recoveryForms`, selectedForm);
      
          if (toRecovery.status === 201) {
            // ✅ Step 2: Remove form from allForms (Dashboard list)
            setAllForms(prevAllForms => prevAllForms.filter(form => form.id !== formId));
            setRecoveryForms(prevRecov => [...prevRecov, toRecovery.data]);
      
            console.log("✅ Form moved to recovery:", toRecovery.data);
          } else {
            console.error("Failed to move form to recovery.");
          }
        } catch (error) {
          console.error("Error moving form to recovery:", error);
        }
      }
      else {
        const updatedForm = { ...allForms.find((form) => form.id === formId), ...edited };

        try {
          const response = await axios.put(`http://localhost:3000/forms/${formId}/admin`, updatedForm);

          if (response.status === 200) {
            setAllForms(prevAllForms =>
              prevAllForms.map(form => (form.id === formId ? { ...form, ...response.data } : form))
            );


            setEditingId(null);
            setEdited({ takeNumber: "", status: "" });
          }
        } catch (error) {
          console.error("Can't be edited:", error.response?.data || error.message);
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  return (
    <div>
      <h1>All Users Issues</h1>
      <Link to="/recovery">View Issues</Link>
      <ul>
            {allForms
            .filter((form) => form.id) // ✅ Filter out any invalid forms
            .map((form) => (
            <li key={form.id}> {/* ✅ Now we can safely use form.id */}
            <span>Name: {form.name}</span>,{" "}
            <span>Unique Number: {form.uniqueNumber}</span>,{" "}
            <span>Type: {form.typeOf}</span>,{" "}
            <span>
              Status:{" "}
              {editingId === form.id ? ( // ✅ Use `form.id` instead of index
                <select value={edited.status} onChange={(e) => handleInputChange("status", e.target.value)}>
                  <option value="New">New</option>
                  <option value="Mine">Mine</option>
                  <option value="Pending">Pending</option>
                  <option value="Fixed">Fixed</option>
                  <option value="Not Relevant">Not Relevant</option>
                </select>
              ) : (
                form.status || "New"
              )}
            </span>,{" "}
            <span>
              Take Number:{" "}
              {editingId === form.id ? (
                <input
                  type="text"
                  name="takeNumber"
                  value={edited.takeNumber}
                  onChange={(e) => handleInputChange("takeNumber", e.target.value)}
                />
              ) : (
                form.takeNumber || "Not Set"
              )}
            </span>
            {editingId === form.id ? (
              <div>
                <button onClick={handleSave}>Save</button>
              </div>
            ) : (
              <div>
                <button onClick={() => handleEdit(form.id)}>Edit</button> {/* ✅ Use `form.id` */}
              </div>
            )}
          </li>
        ))}
      </ul>

      <Link to="/">Back to Home</Link>
    </div>
  );
};

export default Dashboard;
