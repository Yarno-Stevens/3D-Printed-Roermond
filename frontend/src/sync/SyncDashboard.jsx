import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {Box, Card, CardContent, Grid, Typography, Button, Chip, LinearProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress} from '@mui/material';
import {Refresh, CheckCircle, Error, PlayArrow, Pause} from '@mui/icons-material';

const API_BASE_URL = 'http://localhost:8080/api/admin/sync';

export default function SyncDashboard () {
    const [dashboard, setDashboard] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();

        // Auto refresh elke 30 seconden
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [dashboardRes, ordersRes, statsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/dashboard`),
                axios.get(`${API_BASE_URL}/orders/recent?limit=10`),
                axios.get(`${API_BASE_URL}/stats`)
            ]);

            setDashboard(dashboardRes.data);
            setRecentOrders(ordersRes.data);
            setStats(statsRes.data);
            setError(null);
        } catch (err) {
            setError('Fout bij ophalen van sync data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const triggerSync = async () => {
        setSyncing(true);
        try {
            await axios.post(`${API_BASE_URL}/trigger`);
            alert('Sync gestart! Data wordt op de achtergrond gesynchroniseerd.');

            // Refresh na 5 seconden
            setTimeout(fetchData, 5000);
        } catch (err) {
            alert('Fout bij starten sync: ' + err.message);
        } finally {
            setSyncing(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'SUCCESS':
                return 'success';
            case 'RUNNING':
                return 'info';
            case 'FAILED':
                return 'error';
            case 'PAUSED':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getSyncStatusLabel = (status) => {
        switch (status) {
            case 'SUCCESS':
                return 'Succesvol';
            case 'RUNNING':
                return 'Bezig';
            case 'FAILED':
                return 'Mislukt';
            case 'PAUSED':
                return 'Gepauzeerd';
            default:
                return status;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'SUCCESS':
                return <CheckCircle/>;
            case 'RUNNING':
                return <CircularProgress size={20}/>;
            case 'FAILED':
                return <Error/>;
            default:
                return null;
        }
    };

    const getOrderStatusLabel = (status) => {
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

    const formatDate = (dateString) => {
        if (!dateString) return 'Nooit';
        return new Date(dateString).toLocaleString('nl-NL');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress/>
            </Box>
        );
    }

    return (
        <Box sx={{p: 3}}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">WooCommerce Sync Dashboard</Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh/>}
                        onClick={fetchData}
                        sx={{mr: 1}}
                    >
                        Ververs
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={syncing ? <CircularProgress size={20}/> : <PlayArrow/>}
                        onClick={triggerSync}
                        disabled={syncing}
                    >
                        {syncing ? 'Bezig...' : 'Start Sync'}
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{mb: 3}}>
                    {error}
                </Alert>
            )}

            {/* Status Cards */}
            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Totaal Orders
                            </Typography>
                            <Typography variant="h4">
                                {dashboard?.totalOrders || 0}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {dashboard?.ordersSyncedToday || 0} vandaag gesynchroniseerd
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Totaal Klanten
                            </Typography>
                            <Typography variant="h4">
                                {dashboard?.totalCustomers || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Order Sync Status
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                {dashboard?.orderSync && getStatusIcon(dashboard.orderSync.status)}
                                <Chip
                                    label={getSyncStatusLabel(dashboard?.orderSync?.status) || 'Onbekend'}
                                    color={getStatusColor(dashboard?.orderSync?.status)}
                                    size="small"
                                />
                            </Box>
                            <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                                Laatste sync: {formatDate(dashboard?.orderSync?.lastSuccessfulSync)}
                            </Typography>
                            {dashboard?.orderSync?.totalRecordsProcessed > 0 && (
                                <Typography variant="caption" display="block">
                                    Verwerkt: {dashboard.orderSync.totalRecordsProcessed}
                                    {dashboard.orderSync.failedRecords > 0 &&
                                        ` (${dashboard.orderSync.failedRecords} gefaald)`}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Klant Sync Status
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                {dashboard?.customerSync && getStatusIcon(dashboard.customerSync.status)}
                                <Chip
                                    label={getSyncStatusLabel(dashboard?.customerSync?.status) || 'Onbekend'}
                                    color={getStatusColor(dashboard?.customerSync?.status)}
                                    size="small"
                                />
                            </Box>
                            <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                                Laatste sync: {formatDate(dashboard?.customerSync?.lastSuccessfulSync)}
                            </Typography>
                            {dashboard?.customerSync?.totalRecordsProcessed > 0 && (
                                <Typography variant="caption" display="block">
                                    Verwerkt: {dashboard.customerSync.totalRecordsProcessed}
                                    {dashboard.customerSync.failedRecords > 0 &&
                                        ` (${dashboard.customerSync.failedRecords} gefaald)`}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Recent Orders */}
            <Card sx={{mb: 3}}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Recent Gesynchroniseerde Orders
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Order #</TableCell>
                                    <TableCell>Klant</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Totaal</TableCell>
                                    <TableCell>Gemaakt</TableCell>
                                    <TableCell>Gesynchroniseerd</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {recentOrders.map((order) => (
                                    <TableRow key={order.wooCommerceId}>
                                        <TableCell>{order.orderNumber}</TableCell>
                                        <TableCell>{order.customerName}</TableCell>
                                        <TableCell>
                                            <Chip label={getOrderStatusLabel(order.status)} size="small"/>
                                        </TableCell>
                                        <TableCell align="right">
                                            {formatCurrency(order.total)}
                                        </TableCell>
                                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                                        <TableCell>{formatDate(order.syncedAt)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Statistics */}
            {stats && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Orders per Status
                                </Typography>
                                {Object.entries(stats.ordersByStatus || {}).map(([status, count]) => (
                                    <Box key={status} display="flex" justifyContent="space-between" mb={1}>
                                        <Typography>{getOrderStatusLabel(status)}</Typography>
                                        <Typography fontWeight="bold">{count}</Typography>
                                    </Box>
                                ))}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Top 5 Klanten
                                </Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Naam</TableCell>
                                                <TableCell align="right">Orders</TableCell>
                                                <TableCell align="right">Totaal</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {stats.topCustomers?.map((customer, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{customer.name}</TableCell>
                                                    <TableCell align="right">{customer.orderCount}</TableCell>
                                                    <TableCell align="right">
                                                        {formatCurrency(customer.totalSpent)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
}