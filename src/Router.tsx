import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreditRequests from './pages/CreditRequests';
import ProcessManagement from './pages/ProcessManagement';
import CreditPortfolio from './pages/CreditPortfolio';
import UserManagement from './pages/UserManagement';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

export default function Router() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="solicitudes" element={<CreditRequests />} />
        <Route path="tramites" element={<ProcessManagement />} />
        <Route path="portafolio" element={<CreditPortfolio />} />
        <Route path="usuarios" element={<UserManagement />} />
      </Route>
    </Routes>
  );
}