import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { NextUIProvider } from '@nextui-org/react';
import { store } from './store';
import Router from './Router';
import { ThemeProvider } from './providers/ThemeProvider';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider>
          <NextUIProvider>
            <Router />
          </NextUIProvider>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
}

export default App;