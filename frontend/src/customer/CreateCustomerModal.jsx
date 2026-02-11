import React, { useState } from 'react';
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
    Alert
} from '@mui/material';
import {
    Close as CloseIcon,
    PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import api from '../utils/api';

export default function CreateCustomerModal({ open, onClose, onSuccess }) {
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
    const [country, setCountry] = useState('Nederland');

    const [loading, setLoading] = useState(false);

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
                country: country || null
            };

            await api.post('/admin/sync/customers/create', requestData);

            showMessage(`Klant "${firstName} ${lastName}" succesvol aangemaakt!`, 'success');
            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Failed to create customer:', error);
            showMessage('Fout bij aanmaken klant: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFirstName('');
        setLastName('');
        setEmail('');
        setCompanyName('');
        setPhone('');
        setAddress('');
        setCity('');
        setPostalCode('');
        setState('');
        setCountry('Nederland');
        onClose();
    };

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1}>
                            <PersonAddIcon />
                            <span>Nieuwe Klant Aanmaken</span>
                        </Box>
                        <IconButton onClick={handleClose}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent dividers>
                    <Grid container spacing={2}>
                        {/* Basic Information */}
                        <Grid item xs={12}>
                            <Box sx={{ mb: 1 }}>
                                <strong>Basis Informatie</strong>
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Voornaam"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Achternaam"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
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
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Telefoonnummer"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Bedrijfsnaam"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                            />
                        </Grid>

                        {/* Address Information */}
                        <Grid item xs={12} sx={{ mt: 2 }}>
                            <Box sx={{ mb: 1 }}>
                                <strong>Adres Informatie</strong>
                            </Box>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Adres"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Postcode"
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Plaats"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Provincie/Staat"
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Land"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClose} disabled={loading}>
                        Annuleren
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={loading}
                    >
                        {loading ? 'Aanmaken...' : 'Aanmaken'}
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

