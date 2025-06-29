import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from './Globaluser';

function Login() {
  const { user } = useUser();

  if (user.isLoading) return <div>Loading...</div>;
  if (user.isAuthenticated) {
    if (user.roles.includes('admin')) {
      return <Navigate to="/admin" replace />;
    } else if (user.roles.includes('user')) {
      return <Navigate to="/user" replace />;
    }
  }

  return (
    <div>
      {!user.isAuthenticated ? (
        <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
          <a href="http://localhost:3000/auth/login">Login with Azure AD</a>
        </div>
      ) : (
        <div>asd</div>
      )}
    </div>
  );
}

export default Login;