import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

function EditFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [edited, setEdited] = useState({ name: "", typeOf: "", uniqueNumber: "" });

    useEffect(() => {
        const fetchForm = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/forms/${id}/user`);
                setEdited(response.data);
            } catch (err) {
                console.error("Failed to fetch form:", err);
            }
        };
        fetchForm();
    }, [id]);

    const changing = (e) => {
        setEdited({ ...edited, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const putt = await axios.put(`http://localhost:3000/forms/${id}/user`, edited);
            if (putt.status === 200) {
                navigate("/forms"); // Redirect back to the user form page
            } else {
                console.error("Failed to edit the form");
            }
        } catch (err) {
            console.error("Failed to talk to db", err);
        }
    };

    return (
        <div>
            <h2>Edit Form</h2>
            <form onSubmit={handleSubmit}>
                <label>Name:</label>
                <input type="text" name="name" value={edited.name} onChange={changing} />

                <label>Type:</label>
                <input type="text" name="typeOf" value={edited.typeOf} onChange={changing} />

                <label>Unique Number:</label>
                <input type="text" name="uniqueNumber" value={edited.uniqueNumber} onChange={changing} />

                <button type="submit">Save Changes</button>
            </form>
        </div>
    );
}

export default EditFormPage;
