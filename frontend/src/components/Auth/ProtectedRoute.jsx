import { Navigate, useLocation } from 'react-router-dom';

export const isLoggedIn = () => {
  return (localStorage.getItem('isLoggedIn') && !!localStorage.getItem('token'));
};

export function ProtectedRoute({ children }) {
  const location = useLocation();
  if (!isLoggedIn()) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }
  return children;
}