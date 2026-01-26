import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from "react-router";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Custom theme met jouw kleuren
const theme = createTheme({
    palette: {
        primary: {
            main: '#F1592A',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#FFFFFF',
            contrastText: '#303030',
        },
        success: {
            main: '#4caf50',
        },
        info: {
            main: '#2196f3',
        },
        warning: {
            main: '#ff9800',
        },
        error: {
            main: '#f44336',
        },
        background: {
            default: '#F5F5F5',
            paper: '#FFFFFF',
        },
        text: {
            primary: '#303030',
            secondary: '#666666',
        },
    },
    typography: {
        fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
        ].join(','),
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                },
            },
        },
    },
});

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </ThemeProvider>
    </StrictMode>,
)