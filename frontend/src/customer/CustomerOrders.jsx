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
    Grid,
    Avatar
} from '@mui/material';
import {
    ArrowBack,
    Visibility,
    Person,
    Email,
    ShoppingCart
} from '@mui/icons-material';

const API_BASE_URL = 'http://localhost:8080/api/admin/sync';

export default function CustomerOrders() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    useEffect(() => {
        fetchCustomerDetail();
        fetchCustomerOrders();
    }, [id]);

    const fetchCustomerDetail = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/customers/${id}`);
            setCustomer(response.data);
            setError(null);
        } catch (err) {
            setError('Fout bij ophalen van klant details: ' + err.message);
        }
    };

    const fetchCustomerOrders = async () => {
        setLoading(true);
        try {
            // Haal alle orders op en filter op deze customer
            const response = await axios.get(`${API_BASE_URL}/orders?size=1000`);
            const customerOrders = response.data.content.filter(
                order => order.customer && order.customer.id === parseInt(id)
            );
            setOrders(customerOrders);
            setFilteredOrders(customerOrders);
            setError(null);
        } catch (err) {
            setError('Fout bij ophalen van orders: ' + err.message);
        } finally {
            setLoading(false);
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

    if (loading && !customer) {
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

    return (
        <Box sx={{ p: 3 }}>
            {/* Header met Klant Info */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <IconButton onClick={() => navigate(`/customers/${id}`)}>
                        <ArrowBack />
                    </IconButton>
                    {customer && (
                        <>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                                {getInitials(customer.firstName, customer.lastName)}
                            </Avatar>
                            <Box>
                                <Typography variant="h5">
                                    Orders van {customer.firstName} {customer.lastName}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    <Email fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                    {customer.email}
                                </Typography>
                            </Box>
                        </>
                    )}
                </Box>
                <Button
                    variant="outlined"
                    onClick={() => navigate(`/customers/${id}`)}
                >
                    Bekijk Klantprofiel
                </Button>
            </Box>

            {/* Statistieken Cards */}
            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} md={4}>
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
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Voltooide Orders
                            </Typography>
                            <Typography variant="h4" fontWeight="bold">
                                {orders.filter(o => o.status === 'completed').length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
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
            </Grid>

            {/* Orders Tabel */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Order Geschiedenis
                    </Typography>
                    
                    {loading ? (
                        <Box display="flex" justifyContent="center" p={3}>
                            <CircularProgress />
                        </Box>
                    ) : orders.length === 0 ? (
                        <Alert severity="info" sx={{ mt: 2 }}>
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
                                        {filteredOrders
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
                                count={filteredOrders.length}
                                page={page}
                                onPageChange={handleChangePage}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                rowsPerPageOptions={[10, 25, 50, 100]}
                                labelRowsPerPage="Rijen per pagina:"
                                labelDisplayedRows={({ from, to, count }) =>
                                    `${from}-${to} van ${count !== -1 ? count : `meer dan ${to}`}`
                                }
                            />
                        </>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}
