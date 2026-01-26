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
    TablePagination,
    CircularProgress,
    Alert,
    IconButton,
    Avatar,
    Tabs,
    Tab
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
    const [activeTab, setActiveTab] = useState(0);

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

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
            const response = await axios.get(`${API_BASE_URL}/customers/${id}/orders`);
            setOrders(response.data);
        } catch (err) {
            console.error('Fout bij ophalen van orders:', err);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
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
        if (!status) return 'default';
        const lowerStatus = status.toLowerCase();
        const statusColors = {
            'pending': 'warning',
            'processing': 'info',
            'on-hold': 'default',
            'completed': 'success',
            'cancelled': 'error',
            'refunded': 'error',
            'failed': 'error'
        };
        return statusColors[lowerStatus] || 'default';
    };

    const getStatusLabel = (status) => {
        if (!status) return '-';
        const lowerStatus = status.toLowerCase();
        const statusLabels = {
            'pending': 'In Afwachting',
            'processing': 'In Behandeling',
            'on-hold': 'In de Wacht',
            'completed': 'Voltooid',
            'cancelled': 'Geannuleerd',
            'refunded': 'Terugbetaald',
            'failed': 'Mislukt'
        };
        return statusLabels[lowerStatus] || status;
    };

    const calculateTotalSpent = () => {
        return orders
            .filter(order => order.status?.toLowerCase() === 'completed')
            .reduce((sum, order) => {
                const amount = typeof order.total === 'string'
                    ? parseFloat(order.total)
                    : order.total;
                return sum + (isNaN(amount) ? 0 : amount);
            }, 0);
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

            {/* Statistieken Cards */}
            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                <ShoppingCart sx={{ verticalAlign: 'middle', mr: 1 }} />
                                Totaal Orders
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="primary">
                                {orders.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Voltooide Orders
                            </Typography>
                            <Typography variant="h4" fontWeight="bold">
                                {orders.filter(o => o.status?.toLowerCase() === 'completed').length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Totaal Uitgegeven
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="success.main">
                                {formatCurrency(calculateTotalSpent())}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                <CalendarToday fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                Lid sinds
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                                {formatDate(customer.createdAt)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tabs */}
            <Card>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                    <Tab label="Klant Informatie" icon={<Person />} iconPosition="start" />
                    <Tab label={`Orders (${orders.length})`} icon={<ShoppingCart />} iconPosition="start" />
                </Tabs>

                <Divider />

                <CardContent>
                    {/* Tab 0: Klant Informatie */}
                    {activeTab === 0 && (
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="h6" gutterBottom>
                                    Contactgegevens
                                </Typography>
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
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Typography variant="h6" gutterBottom>
                                    Synchronisatie
                                </Typography>
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
                            </Grid>
                        </Grid>
                    )}

                    {/* Tab 1: Orders */}
                    {activeTab === 1 && (
                        <>
                            {orders.length === 0 ? (
                                <Alert severity="info">
                                    Deze klant heeft nog geen orders geplaatst.
                                </Alert>
                            ) : (
                                <>
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Order #</TableCell>
                                                    <TableCell>Status</TableCell>
                                                    <TableCell align="right">Totaal</TableCell>
                                                    <TableCell>Datum</TableCell>
                                                    <TableCell>Items</TableCell>
                                                    <TableCell align="center">Acties</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {orders
                                                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                    .map((order) => (
                                                        <TableRow key={order.id} hover>
                                                            <TableCell>
                                                                <Typography variant="body2" fontWeight="bold">
                                                                    #{order.orderNumber}
                                                                </Typography>
                                                                <Typography variant="caption" color="textSecondary">
                                                                    ID: {order.wooCommerceId}
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
                                                            <TableCell>
                                                                <Chip
                                                                    label={`${order.itemsCount || 0} items`}
                                                                    size="small"
                                                                    variant="outlined"
                                                                />
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
                                    <TablePagination
                                        component="div"
                                        count={orders.length}
                                        page={page}
                                        onPageChange={handleChangePage}
                                        rowsPerPage={rowsPerPage}
                                        onRowsPerPageChange={handleChangeRowsPerPage}
                                        rowsPerPageOptions={[5, 10, 25, 50]}
                                        labelRowsPerPage="Rijen per pagina:"
                                        labelDisplayedRows={({ from, to, count }) =>
                                            `${from}-${to} van ${count !== -1 ? count : `meer dan ${to}`}`
                                        }
                                    />
                                </>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}