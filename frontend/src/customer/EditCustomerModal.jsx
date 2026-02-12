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
    Grid,
    Snackbar,
    Alert,
    Typography
} from '@mui/material';
import {
    Close as CloseIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import api from '../utils/api';

export default function EditCustomerModal({ open, onClose, onSuccess, customer }) {
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Customer fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');
    const [discount, setDiscount] = useState(0);

    const [loading, setLoading] = useState(false);

    // Load customer data when modal opens
    useEffect(() => {
        if (customer && open) {
            setFirstName(customer.firstName || '');
            setLastName(customer.lastName || '');
            setEmail(customer.email || '');
            setCompanyName(customer.companyName || '');
            setPhone(customer.phone || '');
            setAddress(customer.address || '');
            setCity(customer.city || '');
            setPostalCode(customer.postalCode || '');
            setState(customer.state || '');
            setCountry(customer.country || 'Nederland');
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
        if (!email) {
            showMessage('Email is verplicht', 'warning');
            return;
        }

        if (!firstName && !lastName) {
            showMessage('Vul minimaal een voornaam of achternaam in', 'warning');
            return;
        }

        setLoading(true);
        try {
            const requestData = {
                firstName: firstName || null,
                lastName: lastName || null,
                email: email,
                companyName: companyName || null,
                phone: phone || null,
                address: address || null,
                city: city || null,
                postalCode: postalCode || null,
                state: state || null,
                country: country || null,
                discount: parseFloat(discount) || 0
            };

            await api.put(`/admin/sync/customers/${customer.id}`, requestData);

            showMessage(`Klant "${firstName} ${lastName}" succesvol bijgewerkt!`, 'success');
            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Failed to update customer:', error);
            showMessage('Fout bij bijwerken klant: ' + (error.response?.data?.error || error.message), 'error');
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
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1}>
                            <EditIcon />
                            <span>Klant Bewerken</span>
                        </Box>
                        <IconButton onClick={handleClose}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent dividers>
                    <Grid container spacing={3}>
                        {/* Basic Information Section */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2 }}>
                                Basis Informatie
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Voornaam"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                variant="outlined"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Achternaam"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                variant="outlined"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                required
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                variant="outlined"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Telefoonnummer"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                variant="outlined"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Bedrijfsnaam"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                variant="outlined"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Vaste Korting (%)"
                                type="number"
                                value={discount}
                                onChange={(e) => setDiscount(e.target.value)}
                                variant="outlined"
                                inputProps={{ min: 0, max: 100, step: 0.01 }}
                                helperText="Geef een kortingspercentage op (0-100%)"
                            />
                        </Grid>

                        {/* Address Information Section */}
                        <Grid item xs={12} sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mb: 2 }}>
                                Adres Informatie
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Adres"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                variant="outlined"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Postcode"
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value)}
                                variant="outlined"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Plaats"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                variant="outlined"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Provincie/Staat"
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                variant="outlined"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Land"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                variant="outlined"
                            />
                        </Grid>
                    </Grid>
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

