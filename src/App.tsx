import { NextUIProvider } from '@nextui-org/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import Router from './Router'
import PusherSetup from './components/PusherSetup'
import { ThemeProvider } from './providers/ThemeProvider'
import { store } from './store'

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider>
          <NextUIProvider>
            <Router />
            <PusherSetup />
          </NextUIProvider>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  )
}

export default App
