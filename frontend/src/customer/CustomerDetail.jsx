import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import axios from 'axios';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    Grid,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    IconButton,
    Avatar
} from '@mui/material';
import {
    ArrowBack,
    Person,
    Email,
    ShoppingCart,
    CalendarToday,
    Sync,
    Visibility
} from '@mui/icons-material';

const API_BASE_URL = 'http://localhost:8080/api/admin/sync';

export default function CustomerDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCustomerDetail();
        fetchCustomerOrders();
    }, [id]);

    const fetchCustomerDetail = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/customers/${id}`);
            setCustomer(response.data);
            setError(null);
        } catch (err) {
            setError('Fout bij ophalen van klant details: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerOrders = async () => {
        try {
            // Haal alle orders op en filter op deze customer
            const response = await axios.get(`${API_BASE_URL}/orders`);
            const customerOrders = response.data.content.filter(
                order => order.customer && order.customer.id === parseInt(id)
            );
            setOrders(customerOrders);
        } catch (err) {
            console.error('Fout bij ophalen van orders:', err);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('nl-NL');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const getInitials = (firstName, lastName) => {
        const first = firstName?.charAt(0) || '';
        const last = lastName?.charAt(0) || '';
        return (first + last).toUpperCase() || '?';
    };

    const getStatusColor = (status) => {
        const statusColors = {
            'pending': 'warning',
            'processing': 'info',
            'on-hold': 'default',
            'completed': 'success',
            'cancelled': 'error',
            'refunded': 'error',
            'failed': 'error'
        };
        return statusColors[status] || 'default';
    };

    const getStatusLabel = (status) => {
        const statusLabels = {
            'pending': 'In Afwachting',
            'processing': 'In Behandeling',
            'on-hold': 'In de Wacht',
            'completed': 'Voltooid',
            'cancelled': 'Geannuleerd',
            'refunded': 'Terugbetaald',
            'failed': 'Mislukt'
        };
        return statusLabels[status] || status;
    };

    const calculateTotalSpent = () => {
        return orders
            .filter(order => order.status === 'completed')
            .reduce((sum, order) => sum + parseFloat(order.total), 0);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
                <Button startIcon={<ArrowBack />} onClick={() => navigate('/customers')} sx={{ mt: 2 }}>
                    Terug naar Klanten
                </Button>
            </Box>
        );
    }

    if (!customer) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="warning">Klant niet gevonden</Alert>
                <Button startIcon={<ArrowBack />} onClick={() => navigate('/customers')} sx={{ mt: 2 }}>
                    Terug naar Klanten
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <IconButton onClick={() => navigate('/customers')}>
                        <ArrowBack />
                    </IconButton>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                        {getInitials(customer.firstName, customer.lastName)}
                    </Avatar>
                    <Box>
                        <Typography variant="h4">
                            {customer.firstName} {customer.lastName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {customer.email}
                        </Typography>
                    </Box>
                </Box>
                {customer.wooCommerceId ? (
                    <Chip label={`WooCommerce ID: ${customer.wooCommerceId}`} variant="outlined" />
                ) : (
                    <Chip label="Gast" color="default" />
                )}
            </Box>

            <Grid container spacing={3}>
                {/* Klant Informatie */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <Person sx={{ verticalAlign: 'middle', mr: 1 }} />
                                Klant Informatie
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            
                            <Box mb={2}>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Naam
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    {customer.firstName} {customer.lastName}
                                </Typography>
                            </Box>

                            <Box mb={2}>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    <Email fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                    Email
                                </Typography>
                                <Typography variant="body1">
                                    {customer.email}
                                </Typography>
                            </Box>

                            <Box mb={2}>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    WooCommerce ID
                                </Typography>
                                <Typography variant="body1">
                                    {customer.wooCommerceId || 'Gast'}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box mb={2}>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    <CalendarToday fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                    Geregistreerd
                                </Typography>
                                <Typography variant="body1">
                                    {formatDate(customer.createdAt)}
                                </Typography>
                            </Box>

                            <Box mb={2}>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    <Sync fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                    Laatst Gesynchroniseerd
                                </Typography>
                                <Typography variant="body1">
                                    {formatDate(customer.lastSyncedAt)}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Statistieken */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <ShoppingCart sx={{ verticalAlign: 'middle', mr: 1 }} />
                                Statistieken
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            
                            <Box mb={2}>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Totaal Orders
                                </Typography>
                                <Typography variant="h4" fontWeight="bold" color="primary">
                                    {orders.length}
                                </Typography>
                            </Box>

                            <Box mb={2}>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Voltooide Orders
                                </Typography>
                                <Typography variant="h4" fontWeight="bold">
                                    {orders.filter(o => o.status === 'completed').length}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Totaal Uitgegeven
                                </Typography>
                                <Typography variant="h4" fontWeight="bold" color="success.main">
                                    {formatCurrency(calculateTotalSpent())}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Order Geschiedenis */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Order Geschiedenis ({orders.length})
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            
                            {orders.length === 0 ? (
                                <Alert severity="info">
                                    Deze klant heeft nog geen orders geplaatst.
                                </Alert>
                            ) : (
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Order #</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell align="right">Totaal</TableCell>
                                                <TableCell>Datum</TableCell>
                                                <TableCell align="center">Acties</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {orders
                                                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                                .map((order) => (
                                                <TableRow key={order.id} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            #{order.orderNumber}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={getStatusLabel(order.status)}
                                                            color={getStatusColor(order.status)}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {formatCurrency(order.total)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {formatDate(order.createdAt)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => navigate(`/orders/${order.id}`)}
                                                        >
                                                            <Visibility fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
