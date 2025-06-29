import axios from 'axios';
import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const UserContext = createContext(null);

// Provider component
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState({
        isLoading: true,
        isAuthenticated: false,
        roles: [],
        principalName: "",
        displayName: "",
        jobTitle: "",
        email: "",
        domain: ""
    });


    // Fetch user details from backend on mount
    useEffect(() => {
         const fetchUser = async () => {
            try {
                const res = await axios.get('http://localhost:3000/auth/user');
                console.log(res.data.isAuthenticated);
                const domain = res.data.principalName?.split('@')[1] || "";
                setUser({
                    isLoading: false,
                    isAuthenticated: res.data.isAuthenticated,
                    roles: res.data.roles || [],
                    principalName: res.data.principalName,
                    displayName: res.data.displayName,
                    jobTitle: res.data.jobTitle,
                    email: res.data.email,
                    domain
                });
            } catch {
                setUser({
                    isLoading: false,
                    isAuthenticated: false,
                    roles: [],
                    principalName: "",
                    displayName: "",
                    jobTitle: "",
                    email: "",
                    domain: ""
                });
            }
        };
        fetchUser();
    }, []);


    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

// Custom hook to use user context
export const useUser = () => useContext(UserContext);