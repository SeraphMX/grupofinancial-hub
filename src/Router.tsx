import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import { supabase } from './lib/supabase'
import CreditPortfolio from './pages/CreditPortfolio'
import CreditRequests from './pages/CreditRequests'
import Dashboard from './pages/Dashboard'
import DocumentRepository from './pages/DocumentRepository'
import Login from './pages/Login'
import ProcessManagement from './pages/ProcessManagement'
import UserManagement from './pages/UserManagement'
import { RootState } from './store'
import { setCredentials } from './store/slices/authSlice'

// Define public routes that don't require authentication
const PUBLIC_ROUTES = ['/repositorio']

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
        }
      })
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

              // Only navigate to stored location or dashboard if not on a public route
              const isPublicRoute = PUBLIC_ROUTES.some((route) => location.pathname.startsWith(route))
              if (!isPublicRoute) {
                const from = (location.state as any)?.from?.pathname || '/'
                //navigate(from, { replace: true })
              }
            }
          }
        }, 100)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [dispatch, navigate, location, isAuthenticated])

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
      <Route path='/repositorio/:requestId' element={<DocumentRepository />} />
    </Routes>
  )
}
