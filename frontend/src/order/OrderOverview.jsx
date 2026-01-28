import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Paper,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Search,
    FilterList,
    Refresh,
    Visibility,
    GetApp
} from '@mui/icons-material';
import {useNavigate} from "react-router";

const API_BASE_URL = 'http://localhost:8080/api/admin/sync';

export default function OrdersOverview() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [totalOrders, setTotalOrders] = useState(0);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, [page, rowsPerPage, statusFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = {
                page: page,
                size: rowsPerPage,
                search: searchQuery || undefined,
                status: statusFilter || undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined
            };

            const response = await api.get('/admin/sync/orders', { params });
            setOrders(response.data.content || response.data);
            setTotalOrders(response.data.totalElements || response.data.length);
            setError(null);
        } catch (err) {
            setError('Fout bij ophalen van orders: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(0);
        fetchOrders();
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        setDateFrom('');
        setDateTo('');
        setPage(0);
        fetchOrders();
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

        const statusLabels = {
            'pending': 'In Afwachting',
            'processing': 'In Behandeling',
            'on-hold': 'In de Wacht',
            'completed': 'Voltooid',
            'cancelled': 'Geannuleerd',
            'refunded': 'Terugbetaald',
            'failed': 'Mislukt',
            // Hoofdletters voor zekerheid
            'PENDING': 'In Afwachting',
            'PROCESSING': 'In Behandeling',
            'ON-HOLD': 'In de Wacht',
            'COMPLETED': 'Voltooid',
            'CANCELLED': 'Geannuleerd',
            'REFUNDED': 'Terugbetaald',
            'FAILED': 'Mislukt'
        };

        // Probeer eerst exact match, dan lowercase
        return statusLabels[status] || statusLabels[status.toLowerCase()] || status;
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Orders</Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchOrders}
                        sx={{ mr: 1 }}
                    >
                        Ververs
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Search and Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                placeholder="Zoek op ordernummer, klantnaam of email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                InputProps={{
                                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={handleSearch}
                            >
                                Zoeken
                            </Button>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<FilterList />}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                {showFilters ? 'Verberg Filters' : 'Toon Filters'}
                            </Button>
                        </Grid>

                        {showFilters && (
                            <>
                                <Grid item xs={12} md={4}>
                                    <FormControl fullWidth sx={{ minWidth: 120 }}>
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            value={statusFilter}
                                            label="Status"
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
                                            <MenuItem value="">Alle</MenuItem>
                                            <MenuItem value="pending">In Afwachting</MenuItem>
                                            <MenuItem value="processing">In Behandeling</MenuItem>
                                            <MenuItem value="on-hold">In de Wacht</MenuItem>
                                            <MenuItem value="completed">Voltooid</MenuItem>
                                            <MenuItem value="cancelled">Geannuleerd</MenuItem>
                                            <MenuItem value="refunded">Terugbetaald</MenuItem>
                                            <MenuItem value="failed">Mislukt</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Vanaf Datum"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Tot Datum"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        onClick={handleClearFilters}
                                    >
                                        Wis Filters
                                    </Button>
                                </Grid>
                            </>
                        )}
                    </Grid>
                </CardContent>
            </Card>

            {/* Orders Table */}
            <Card>
                <CardContent>
                    {loading ? (
                        <Box display="flex" justifyContent="center" p={3}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Order #</TableCell>
                                            <TableCell>Klant</TableCell>
                                            <TableCell>Email</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell align="right">Totaal</TableCell>
                                            <TableCell>Gemaakt</TableCell>
                                            <TableCell>Items</TableCell>
                                            <TableCell align="center">Acties</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {orders.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} align="center">
                                                    <Typography color="textSecondary" sx={{ py: 3 }}>
                                                        Geen orders gevonden
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            orders.map((order) => (
                                                <TableRow key={order.id} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            #{order.orderNumber}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {order.customer?.firstName} {order.customer?.lastName}
                                                    </TableCell>
                                                    <TableCell>
                                                        {order.customer?.email || '-'}
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
                                                            label={`${order.items?.length || 0} items`}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Tooltip title="Bekijk Details">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => navigate(`/orders/${order.id}`)}
                                                            >
                                                                <Visibility fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                component="div"
                                count={totalOrders}
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