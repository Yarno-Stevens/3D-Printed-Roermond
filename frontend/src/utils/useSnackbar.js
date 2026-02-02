// Shared Snackbar Hook for consistent notifications across the app
import { useState } from 'react';

export const useSnackbar = () => {
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' // 'success' | 'error' | 'warning' | 'info'
    });

    const showMessage = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const showSuccess = (message) => {
        showMessage(message, 'success');
    };

    const showError = (message) => {
        showMessage(message, 'error');
    };

    const showWarning = (message) => {
        showMessage(message, 'warning');
    };

    const showInfo = (message) => {
        showMessage(message, 'info');
    };

    const handleClose = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return {
        snackbar,
        showMessage,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        handleClose
    };
};

