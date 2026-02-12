import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    IconButton,
    Snackbar,
    Alert,
    Typography
} from '@mui/material';
import {
    Close as CloseIcon,
    Percent as PercentIcon
} from '@mui/icons-material';
import api from '../utils/api';

export default function SetDiscountModal({ open, onClose, onSuccess, customer }) {
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [discount, setDiscount] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (customer && open) {
            setDiscount(customer.discount || 0);
        }
    }, [customer, open]);

    const showMessage = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleSubmit = async () => {
        const discountValue = parseFloat(discount);

        if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
            showMessage('Korting moet tussen 0 en 100 zijn', 'warning');
            return;
        }

        setLoading(true);
        try {
            await api.patch(`/admin/sync/customers/${customer.id}/discount`, {
                discount: discountValue
            });

            showMessage(`Korting van ${customer.firstName} ${customer.lastName} succesvol bijgewerkt naar ${discountValue}%!`, 'success');
            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Failed to update discount:', error);
            showMessage('Fout bij bijwerken korting: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onClose();
    };

    if (!customer) {
        return null;
    }

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1}>
                            <PercentIcon />
                            <span>Korting Instellen</span>
                        </Box>
                        <IconButton onClick={handleClose}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent dividers>
                    <Box mb={2}>
                        <Typography variant="subtitle2" color="textSecondary">Klant</Typography>
                        <Typography variant="h6">
                            {customer.firstName} {customer.lastName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {customer.email}
                        </Typography>
                        {customer.wooCommerceId && (
                            <Typography variant="caption" color="primary">
                                WooCommerce ID: {customer.wooCommerceId}
                            </Typography>
                        )}
                    </Box>

                    <Box mt={3}>
                        <TextField
                            fullWidth
                            label="Vaste Korting (%)"
                            type="number"
                            value={discount}
                            onChange={(e) => setDiscount(e.target.value)}
                            variant="outlined"
                            inputProps={{ min: 0, max: 100, step: 0.01 }}
                            helperText="Geef een kortingspercentage op (0-100%). Deze korting wordt automatisch toegepast op alle nieuwe orders."
                            autoFocus
                        />
                    </Box>

                    {discount > 0 && (
                        <Box mt={2} p={2} bgcolor="success.light" borderRadius={1}>
                            <Typography variant="body2" color="success.dark">
                                💡 Nieuwe orders krijgen automatisch {Number(discount).toFixed(2)}% korting
                            </Typography>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleClose} disabled={loading} variant="outlined">
                        Annuleren
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={loading}
                    >
                        {loading ? 'Opslaan...' : 'Opslaan'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}

