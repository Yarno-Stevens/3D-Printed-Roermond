import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    InputAdornment,
    IconButton,
    CircularProgress
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    Login as LoginIcon
} from '@mui/icons-material';
import api from "./utils/api.js";


export default function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post(`/auth/login`, {
                username,
                password
            });

            // Store token and user info
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('username', response.data.username);
            localStorage.setItem('role', response.data.role);

            // Redirect to dashboard
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Login mislukt. Probeer het opnieuw.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: 3
            }}
        >
            <Card sx={{ maxWidth: 450, width: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
                <CardContent sx={{ p: 4 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                        <Box
                            component="img"
                            src="/logo-3d-printer-los.png"
                            alt="3D Printed Roermond"
                            sx={{ height: 80, mb: 2 }}
                        />
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            Welkom Terug
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Log in om het dashboard te bekijken
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Gebruikersnaam"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            margin="normal"
                            required
                            autoFocus
                            disabled={loading}
                        />

                        <TextField
                            fullWidth
                            label="Wachtwoord"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            required
                            disabled={loading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                            sx={{ mt: 3, mb: 2, py: 1.5 }}
                        >
                            {loading ? 'Bezig met inloggen...' : 'Inloggen'}
                        </Button>
                    </form>

                    <Box mt={3} textAlign="center">
                        <Typography variant="caption" color="textSecondary">
                            © 2026 3D Printed Roermond
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}

