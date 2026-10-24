import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ToastProvider } from './components/toast';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import { theme } from './theme';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    {/* injectFirst: MUI styles load before Tailwind's, so utility classes can still override them */}
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>
);

