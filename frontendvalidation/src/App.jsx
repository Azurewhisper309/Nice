import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:3000/auth/user', { withCredentials: true })
      .then(res => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      {user ? (
        <>
          <h1>Welcome, {user.displayName || user.name}</h1>
          <a href="http://localhost:3000/auth/logout">Logout</a>
        </>
      ) : (
        <a href="http://localhost:3000/auth/login">Login with Azure AD</a>
      )}
    </div>
  );
}

export default App;
