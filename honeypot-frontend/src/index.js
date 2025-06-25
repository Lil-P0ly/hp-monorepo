import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import App from './App';
import './index.css'; // Optional: You can add global styles here

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
  <MantineProvider
        theme={{
          fontFamily: 'Inter, sans-serif',
          colors: {
            brand: [
              '#f0f9ff',
              '#e0f3fc',
              '#b9e7fa',
              '#8ad8f4',
              '#5bc8ee',
              '#3fbce7',
              '#2baed2',
              '#1f8daa',
              '#156d86',
              '#0e4e61',
            ],
          },
          primaryColor: 'brand',
          primaryShade: { light: 5, dark: 4 },
          spacing: {
            xs: '0.5rem',
            sm: '0.75rem',
            md: '1rem',
            lg: '1.5rem',
            xl: '2rem',
          },
          radius: {
            xs: '0.25rem',
            sm: '0.5rem',
            md: '0.75rem',
            lg: '1rem',
            xl: '1.25rem',
          },
          components: {
            Button: {
              styles: (theme) => ({
                root: {
                  fontWeight: 600,
                  letterSpacing: '0.025em',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  },
                },
              }),
            },
          },
        }}
        withGlobalStyles
        withNormalizeCSS
      >
      <App />
    </MantineProvider>
</React.StrictMode>
);