import { Spinner } from '@nextui-org/react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import { supabase } from './lib/supabase'
import CreditPortfolio from './pages/CreditPortfolio'
import CreditRequests from './pages/CreditRequests'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import ProcessManagement from './pages/ProcessManagement'
import SolicitudCliente from './pages/SolicitudCliente'
import UserManagement from './pages/UserManagement'
import { RootState } from './store'
import { setCredentials } from './store/slices/authSlice'

// Define public routes that don't require authentication
const PUBLIC_ROUTES = ['/solicitud']

interface RouteGuardProps {
  children: React.ReactNode
}

const AuthGuard = ({ children }: RouteGuardProps) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const location = useLocation()

  // Check if current path is a public route
  const isPublicRoute = PUBLIC_ROUTES.some((route) => location.pathname.startsWith(route))

  // Allow access to public routes regardless of auth status
  if (isPublicRoute) {
    return <>{children}</>
  }

  // For protected routes, redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to='/login' state={{ from: location }} replace />
  }

  return <>{children}</>
}

const LoginGuard = ({ children }: RouteGuardProps) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to='/' replace />
  }

  return <>{children}</>
}

const AdminGuard = ({ children }: RouteGuardProps) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const user = useSelector((state: RootState) => state.auth.user)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to='/login' state={{ from: location }} replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to='/' replace />
  }

  return <>{children}</>
}

export default function Router() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
          const { data: userData, error } = await supabase.from('users').select('*').eq('id', session.user.id).single()

          if (!error && userData) {
            dispatch(
              setCredentials({
                user: userData,
                token: session.access_token
              })
            )

            // Only navigate to stored location or dashboard if not on a public route
            const isPublicRoute = PUBLIC_ROUTES.some((route) => location.pathname.startsWith(route))
            if (!isPublicRoute) {
              const from = (location.state as any)?.from?.pathname || '/'
              navigate(from, { replace: true })
            }
          }
        } else {
          // Si no hay sesión y es una ruta protegida, redirigir a login
          const currentRoute = location.pathname.split('/')[1] // Obtiene la primera parte de la ruta después de "/"
          const isPublicRoute = PUBLIC_ROUTES.includes(`/${currentRoute}`)

          if (!isPublicRoute) {
            navigate('/login', { replace: true })
          }
        }

        setLoading(false) // Termina la carga después de verificar la sesión
      })
    } else {
      setLoading(false) // Si ya está autenticado, no necesita cargar
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setTimeout(async () => {
          if (event === 'SIGNED_IN' && session) {
            const { data: userData, error } = await supabase.from('users').select('*').eq('id', session.user.id).single()

            if (!error && userData) {
              dispatch(
                setCredentials({
                  user: userData,
                  token: session.access_token
                })
              )
            }
          }
        }, 100)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [dispatch, navigate, location, isAuthenticated])

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex  justify-end items-end p-4'>
        <Spinner />
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path='/login'
        element={
          <LoginGuard>
            <Login />
          </LoginGuard>
        }
      />

      {/* Protected routes under layout */}
      <Route
        path='/'
        element={
          <AuthGuard>
            <Layout />
          </AuthGuard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path='solicitudes' element={<CreditRequests />} />
        <Route path='tramites' element={<ProcessManagement />} />
        <Route path='portafolio' element={<CreditPortfolio />} />
        <Route
          path='usuarios'
          element={
            <AdminGuard>
              <UserManagement />
            </AdminGuard>
          }
        />
      </Route>

      {/* Public route for document repository */}
      <Route path='/solicitud/:requestId' element={<SolicitudCliente />} />
    </Routes>
  )
}
