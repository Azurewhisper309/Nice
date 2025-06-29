import { useUser } from "./Globaluser";
import { Navigate } from "react-router-dom";

const AdminPro = ({ children }) => {
    const { user } = useUser();
    if (user.isLoading) return <div>Loading...</div>;
    if (!user.isAuthenticated) return <Navigate to="/login" replace />;
    if (!user.roles.includes("admin")) return <Navigate to="/unauthorized" replace />;
    if (user.domain !== "bsmch.net") return <Navigate to="/unauthorized" replace />;
    return children;
};
export default AdminPro;