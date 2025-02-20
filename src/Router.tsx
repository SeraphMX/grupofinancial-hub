import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { setCredentials } from './store/slices/authSlice';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreditRequests from './pages/CreditRequests';
import ProcessManagement from './pages/ProcessManagement';
import CreditPortfolio from './pages/CreditPortfolio';
import UserManagement from './pages/UserManagement';
import DocumentRepository from './pages/DocumentRepository';

interface RouteGuardProps {
  children: React.ReactNode;
}

const PrivateRoute = ({ children }: RouteGuardProps) => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute = ({ children }: RouteGuardProps) => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const user = useSelector((state: RootState) => state.auth.user);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (user?.role !== 'admin') {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

const PublicRoute = ({ children }: RouteGuardProps) => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

export default function Router() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!error && userData) {
            dispatch(setCredentials({
              user: userData,
              token: session.access_token,
            }));
            navigate('/', { replace: true });
          }
        }
      });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!error && userData) {
          dispatch(setCredentials({
            user: userData,
            token: session.access_token,
          }));
          navigate('/', { replace: true });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch, navigate, isAuthenticated]);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      
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
        <Route
          path="usuarios"
          element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          }
        />
      </Route>

      {/* Ruta pública para el repositorio de documentos */}
      <Route path="/repositorio/:requestId" element={<DocumentRepository />} />
    </Routes>
  );
}