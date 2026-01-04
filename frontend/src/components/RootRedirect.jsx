import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RootRedirect = () => {
    const { user, loading } = useAuth();

    if (loading) return null;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role === 'recipient') {
        return <Navigate to="/recipient" replace />;
    }

    if (user.role === 'volunteer') {
        return <Navigate to="/volunteer" replace />;
    }

    return <Navigate to="/dashboard" replace />;
};

export default RootRedirect;
