import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, staffOnly = false }) => {
  const { isAuthenticated, isAdmin, isStaff } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (staffOnly && !isStaff) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
