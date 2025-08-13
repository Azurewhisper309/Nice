import { useState, useEffect } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;

export default function AuthTest() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const handleLogin = () => {
    window.location.href = 'http://localhost:3000/auth/login';
  };

  const handleLogout = () => {
    window.location.href = 'http://localhost:3000/auth/logout';
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await axios.get('http://localhost:3000/auth/user');
        setUser(res.data); // assuming backend returns { id, displayName, roles, principalName }
      } catch (err) {
        if (err.response && err.response.status === 403) {
          setUser(null);
        } else {
          setError('Unexpected error');
          console.error(err);
        }
      }
    };

    getUser();
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h2>🔐 Azure AD Auth Test</h2>

      {user ? (
        <>
          <p>✅ Logged in as: <strong>{user.displayName}</strong></p>
          <p><strong>UPN:</strong> {user.principalName}</p>
          <p><strong>Roles:</strong> {user.roles.join(', ')}</p>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <p>❌ Not logged in</p>
          <button onClick={handleLogin}>Login with Azure</button>
        </>
      )}

      {error && <p style={{ color: 'red' }}>⚠ {error}</p>}
    </div>
  );
}
    