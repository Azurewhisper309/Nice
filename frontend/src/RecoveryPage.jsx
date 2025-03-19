import { useContext, useEffect, useState } from 'react';
import { CRMContext } from './CrmContext';
import axios from 'axios';

const RecoveryPage = () => {
    const { recoveryForms, setRecoveryForms, setAllForms } = useContext(CRMContext);
    const [selectedFormId, setSelectedFormId] = useState(null);

    async function handleGetBack(id) {
        if (!id) return;

        try {
            const getBackForm = { ...recoveryForms.find(form => form.id === id) };
            if (!getBackForm) return;
            getBackForm.status = "Pending";

            const reqBack = await axios.put(`http://localhost:3000/recoveryForms/${id}`, { status: "Pending" });

            if (reqBack.status === 200) {
                setAllForms(prevAllForms => [...prevAllForms, reqBack.data]);
                setRecoveryForms(prevRecoveryForms => prevRecoveryForms.filter(form => form.id !== id));
            } else {
                console.log("Failed to recover the form");
            }
        } catch (error) {
            console.log("Error recovering form:", error);
        } finally {
            setSelectedFormId(null);
        }
    }

    async function handleDelete(id) {
        if (!id) return;

        try {
            const formId = recoveryForms.find(form => form.id === id)?.id;
            if (!formId) return;

            const del = await axios.delete(`http://localhost:3000/recoveryForms/${formId}`);

            if (del.status === 200) {
                setRecoveryForms(prevRec => prevRec.filter(form => form.id !== formId));
                console.log("Deleted successfully");
            } else {
                console.error("Failed to delete");
            }
        } catch (error) {
            console.error("Error deleting form:", error);
        } finally {
            setSelectedFormId(null);
        }
    }

    const handleFetchNotRelevant = async () => {
        try {
            const response = await axios.get("http://localhost:3000/recoveryForms");
            setRecoveryForms(response.data);
        } catch (error) {
            console.log("Can't fetch recovery forms", error);
        }
    };

    useEffect(() => {
        handleFetchNotRelevant();
    }, []);

    useEffect(()=>{console.log("check the id of forms",recoveryForms)},[recoveryForms]);

    return (
        <div>
            <h1>Recover Forms</h1>
        <ul>
            {recoveryForms
            .filter((f) => f.id) // ✅ Ensure only forms with an ID are rendered
            .map((f) => (
            <li key={f.id}> {/* ✅ Now we can safely use f.id as key */}
      <span>{f.takeNumber}</span>
      <span>{f.typeOf}</span>
      <span>{f.name}</span>
      <span>{f.uniqueNumber}</span>
      <span>{f.status}</span>
      <div>
    <button onClick={() => { setSelectedFormId(f.id); handleDelete(f.id); }}>
        {selectedFormId === f.id ? "Deleting..." : "Delete"}
    </button>
    <button onClick={() => { setSelectedFormId(f.id); handleGetBack(f.id); }}>
        {selectedFormId === f.id ? "Recovering..." : "Get Me Back"}
    </button>
    </div>
    </li>
  ))}
</ul>

        </div>
    );
};

export default RecoveryPage;
