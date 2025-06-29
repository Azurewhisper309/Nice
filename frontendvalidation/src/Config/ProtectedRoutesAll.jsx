import { Navigate } from "react-router-dom";
import { useUser } from "./Globaluser";

const ProtectAll = ({ children }) => {
    const { user } = useUser();
    if (user.isLoading) return <div>Loading...</div>;
    if (!user.isAuthenticated) return <Navigate to="/login" replace />;
    return children;
};
export default ProtectAll;