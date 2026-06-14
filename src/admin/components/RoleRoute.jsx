import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleRoute({ children, requiredRole }) {
  const { role, loading } = useAuth();
  if (loading) return null;
  if (role !== requiredRole) return <Navigate to="/admin/schedule" replace />;
  return children;
}
