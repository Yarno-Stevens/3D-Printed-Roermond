import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import api from './utils/api';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Button,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    ToggleButtonGroup,
    ToggleButton
} from '@mui/material';
import {
    ShoppingCart,
    People,
    Inventory,
    TrendingDown,
    TrendingUp,
    AttachMoney,
    Assessment
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Stats
    const [syncDashboard, setSyncDashboard] = useState(null);
    const [expenseStats, setExpenseStats] = useState(null);

    // Revenue stats
    const [revenueStats, setRevenueStats] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedWeek, setSelectedWeek] = useState(null);
    const [groupBy, setGroupBy] = useState('month');
    const [availableYears, setAvailableYears] = useState([]);
    const [availableWeeks, setAvailableWeeks] = useState([]);
    const [topCustomers, setTopCustomers] = useState([]);

    // Recent data
    const [recentOrders, setRecentOrders] = useState([]);
    const [recentExpenses, setRecentExpenses] = useState([]);

    useEffect(() => {
        fetchDashboardData();
        fetchTopCustomers();
    }, []);

    useEffect(() => {
        if (selectedYear || groupBy || selectedWeek) {
            fetchRevenueStats();
        }
    }, [selectedYear, groupBy, selectedWeek]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [syncResp, ordersResp, expensesResp, expenseStatsResp] = await Promise.all([
                api.get('/admin/sync/dashboard'),
                api.get('/admin/sync/orders/recent?limit=5'),
                api.get('/admin/sync/expenses?page=0&size=5'),
                api.get('/admin/sync/expenses/stats')
            ]);

            setSyncDashboard(syncResp.data);
            setRecentOrders(ordersResp.data);
            setRecentExpenses(expensesResp.data.content || []);
            setExpenseStats(expenseStatsResp.data);
            setError(null);
        } catch (err) {
            setError('Fout bij laden dashboard: ' + err.message);
            console.error('Dashboard error:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRevenueStats = async () => {
        try {
            const params = {
                year: selectedYear,
                groupBy: groupBy
            };

            if (groupBy === 'week' && selectedWeek) {
                params.week = selectedWeek;
            }

            const response = await api.get('/admin/sync/revenue/stats', { params });
            setRevenueStats(response.data);

            if (response.data.availableYears && response.data.availableYears.length > 0) {
                setAvailableYears(response.data.availableYears);
            }

            if (response.data.availableWeeks && response.data.availableWeeks.length > 0) {
                setAvailableWeeks(response.data.availableWeeks);
            }
        } catch (err) {
            console.error('Failed to fetch revenue stats:', err);
        }
    };

    const fetchTopCustomers = async () => {
        try {
            const response = await api.get('/admin/sync/customers/top?limit=5');
            setTopCustomers(response.data || []);
        } catch (err) {
            console.error('Failed to fetch top customers:', err);
        }
    };

    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return '-';
        return new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('nl-NL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        const statusColors = {
            'pending': 'warning',
            'processing': 'info',
            'completed': 'success',
            'cancelled': 'error',
            'refunded': 'error'
        };
        return statusColors[status?.toLowerCase()] || 'default';
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={3}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    // Calculate revenue vs expenses
    const totalRevenue = revenueStats?.totalRevenue || 0;
    const totalExpenses = expenseStats?.totalExpenses || 0;
    const profit = totalRevenue - totalExpenses;

    return (
         <Box sx={{ p: 2, maxWidth: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h3" fontWeight="bold">Dashboard</Typography>
                <Typography variant="body1" color="textSecondary">
                    Laatste update: {new Date().toLocaleString('nl-NL')}
                </Typography>
            </Box>

            {/* Stats Cards Row 1 */}
            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', minHeight: 160 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" height="100%">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom variant="body1" fontWeight={500}>
                                        Totaal Orders
                                    </Typography>
                                    <Typography variant="h3" fontWeight="bold" my={1}>
                                        {syncDashboard?.totalOrders || 0}
                                    </Typography>
                                    <Typography variant="body2" color="success.main" fontWeight={500}>
                                        +{syncDashboard?.ordersSyncedToday || 0} vandaag
                                    </Typography>
                                </Box>
                                <ShoppingCart sx={{ fontSize: 60, color: 'primary.main', opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', minHeight: 160 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" height="100%">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom variant="body1" fontWeight={500}>
                                        Producten
                                    </Typography>
                                    <Typography variant="h3" fontWeight="bold" my={1}>
                                        {syncDashboard?.totalProducts || 0}
                                    </Typography>
                                    <Typography variant="body2" color="success.main" fontWeight={500}>
                                        +{syncDashboard?.productsSyncedToday || 0} vandaag
                                    </Typography>
                                </Box>
                                <Inventory sx={{ fontSize: 60, color: 'primary.main', opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', minHeight: 160 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" height="100%">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom variant="body1" fontWeight={500}>
                                        Klanten
                                    </Typography>
                                    <Typography variant="h3" fontWeight="bold" my={1}>
                                        {syncDashboard?.totalCustomers || 0}
                                    </Typography>
                                    <Typography variant="body2" color="success.main" fontWeight={500}>
                                        +{syncDashboard?.customersSyncedToday || 0} vandaag
                                    </Typography>
                                </Box>
                                <People sx={{ fontSize: 60, color: 'primary.main', opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Revenue Charts */}
            {revenueStats && (
                <Grid container spacing={3} mb={3}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                    <Typography variant="h5" fontWeight="bold">Inkomsten Overzicht</Typography>
                                    <Box display="flex" gap={2} alignItems="center">
                                        {/* Year Selector */}
                                        <FormControl size="small" sx={{ minWidth: 120 }}>
                                            <InputLabel>Jaar</InputLabel>
                                            <Select
                                                value={selectedYear}
                                                label="Jaar"
                                                variant="outlined"
                                                onChange={(e) => setSelectedYear(e.target.value)}
                                            >
                                                {availableYears.map(year => (
                                                    <MenuItem key={year} value={year}>{year}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        {/* Time Range Toggle */}
                                        <ToggleButtonGroup
                                            value={groupBy}
                                            exclusive
                                            onChange={(e, newValue) => newValue && setGroupBy(newValue)}
                                            size="small"
                                        >
                                            <ToggleButton value="week">Week</ToggleButton>
                                            <ToggleButton value="month">Maand</ToggleButton>
                                            <ToggleButton value="year">Jaar</ToggleButton>
                                        </ToggleButtonGroup>
                                    </Box>
                                </Box>

                                {/* Week Selector (only show when groupBy is 'week') */}
                                {groupBy === 'week' && availableWeeks.length > 0 && (
                                    <Box mb={2}>
                                        <FormControl size="small" fullWidth>
                                            <InputLabel>Selecteer Week</InputLabel>
                                            <Select
                                                value={selectedWeek || ''}
                                                label="Selecteer Week"
                                                variant="outlined"
                                                onChange={(e) => setSelectedWeek(e.target.value || null)}
                                            >
                                                <MenuItem value="">Alle weken</MenuItem>
                                                {availableWeeks.map(week => (
                                                    <MenuItem key={week} value={week}>Week {week}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                )}

                                {/* Revenue Stats Summary */}
                                <Grid container spacing={2} mb={3}>
                                    <Grid item xs={12} md={3}>
                                        <Paper variant="outlined" sx={{ p: 3, minHeight: 120 }}>
                                            <Typography variant="body1" color="textSecondary" fontWeight={500} mb={1}>
                                                Totale Omzet
                                            </Typography>
                                            <Typography variant="h4" color="success.main" fontWeight="bold">
                                                {formatCurrency(revenueStats.totalRevenue)}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Paper variant="outlined" sx={{ p: 3, minHeight: 120 }}>
                                            <Typography variant="body1" color="textSecondary" fontWeight={500} mb={1}>
                                                Totale Uitgaven
                                            </Typography>
                                            <Typography variant="h4" color="error.main" fontWeight="bold">
                                                {formatCurrency(revenueStats.totalExpenses || 0)}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Paper variant="outlined" sx={{ p: 3, minHeight: 120 }}>
                                            <Typography variant="body1" color="textSecondary" fontWeight={500} mb={1}>
                                                Totale Winst
                                            </Typography>
                                            <Typography variant="h4" color="primary.main" fontWeight="bold">
                                                {formatCurrency(revenueStats.totalProfit || 0)}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Paper variant="outlined" sx={{ p: 3, minHeight: 120 }}>
                                            <Typography variant="body1" color="textSecondary" fontWeight={500} mb={1}>
                                                Gem. Order Waarde
                                            </Typography>
                                            <Typography variant="h4" color="info.main" fontWeight="bold">
                                                {formatCurrency(revenueStats.avgOrderValue)}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>

                                {/* Revenue, Expenses & Profit Chart */}
                                <ResponsiveContainer width="100%" height={500}>
                                    <LineChart
                                        data={Object.keys(revenueStats.revenueByPeriod || {}).map(period => ({
                                            period,
                                            revenue: parseFloat(revenueStats.revenueByPeriod[period] || 0),
                                            expenses: parseFloat(revenueStats.expensesByPeriod?.[period] || 0),
                                            profit: parseFloat(revenueStats.profitByPeriod?.[period] || 0)
                                        }))}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="period"
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                        />
                                        <YAxis
                                            tickFormatter={(value) => `€${value}`}
                                        />
                                        <Tooltip
                                            formatter={(value) => [`€${value.toFixed(2)}`]}
                                            labelStyle={{ color: '#000' }}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#82ca9d"
                                            strokeWidth={2}
                                            name="Omzet (€)"
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="expenses"
                                            stroke="#ff6b6b"
                                            strokeWidth={2}
                                            name="Uitgaven (€)"
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="profit"
                                            stroke="#4dabf7"
                                            strokeWidth={2}
                                            name="Winst (€)"
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                    {topCustomers && topCustomers.length > 0 && (
                    <Grid item xs={12}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight="bold" mb={3}>Top 5 Klanten</Typography>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Naam</TableCell>
                                                <TableCell>Email</TableCell>
                                                <TableCell align="right">Orders</TableCell>
                                                <TableCell align="right">Totaal Besteed</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {topCustomers.map((customer, index) => (
                                                <TableRow key={index} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {customer.name}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>{customer.email}</TableCell>
                                                    <TableCell align="right">
                                                        <Chip
                                                            label={customer.orderCount}
                                                            size="small"
                                                            color="primary"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" fontWeight="bold" color="success.main">
                                                            {formatCurrency(customer.totalSpent)}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>)}
                </Grid>
            )}
        </Box>
    );
}

