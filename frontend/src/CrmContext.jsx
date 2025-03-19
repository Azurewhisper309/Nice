/* Updated CrmContext.jsx */
import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const CRMContext = createContext();

export const CRMProvider = ({ children }) => {
  const [forms, setForms] = useState([]);
  const [allForms, setAllForms] = useState([]);
  const [recoveryForms,setRecoveryForms]=useState([]);//forms that not relevant admin's side


  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await axios.get("http://localhost:3000/forms");
        setForms(response.data);
        setAllForms(response.data);
      } catch (error) {
        console.error("Error fetching forms:", error);
      }
    };
    fetchForms();
  }, []);

  return (
    <CRMContext.Provider value={{ forms, setForms, allForms, setAllForms,recoveryForms,setRecoveryForms }}>
      {children}
    </CRMContext.Provider>
  );
};