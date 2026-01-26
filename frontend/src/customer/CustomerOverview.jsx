import React, {useState, useEffect} from 'react';
import axios from 'axios';
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
    CircularProgress,
    Alert,
    Grid,
    IconButton,
    Tooltip,
    Avatar
} from '@mui/material';
import {
    Search,
    FilterList,
    Refresh,
    Visibility,
    Email,
    ShoppingCart,
    GetApp
} from '@mui/icons-material';
import {useNavigate} from 'react-router';


const API_BASE_URL = 'http://localhost:8080/api/admin/sync';

export default function CustomersOverview() {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [totalCustomers, setTotalCustomers] = useState(0);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        fetchCustomers();
    }, [page, rowsPerPage]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const params = {
                page: page,
                size: rowsPerPage,
                search: searchQuery || undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined
            };

            const response = await axios.get(`${API_BASE_URL}/customers`, {params});
            setCustomers(response.data.content || response.data);
            setTotalCustomers(response.data.totalElements || response.data.length);
            setError(null);
        } catch (err) {
            setError('Fout bij ophalen van klanten: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(0);
        fetchCustomers();
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setDateFrom('');
        setDateTo('');
        setPage(0);
        fetchCustomers();
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
        return new Date(dateString).toLocaleDateString('nl-NL');
    };

    const getInitials = (firstName, lastName) => {
        const first = firstName?.charAt(0) || '';
        const last = lastName?.charAt(0) || '';
        return (first + last).toUpperCase() || '?';
    };

    return (
        <Box sx={{p: 3}}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Klanten</Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh/>}
                        onClick={fetchCustomers}
                        sx={{mr: 1}}
                    >
                        Ververs
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{mb: 3}}>
                    {error}
                </Alert>
            )}

            {/* Search and Filters */}
            <Card sx={{mb: 3}}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                placeholder="Zoek op naam of email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                InputProps={{
                                    startAdornment: <Search sx={{mr: 1, color: 'text.secondary'}}/>
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
                                startIcon={<FilterList/>}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                {showFilters ? 'Verberg Filters' : 'Toon Filters'}
                            </Button>
                        </Grid>

                        {showFilters && (
                            <>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Geregistreerd vanaf"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        InputLabelProps={{shrink: true}}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Geregistreerd tot"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        InputLabelProps={{shrink: true}}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
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

            {/* Customers Table */}
            <Card>
                <CardContent>
                    {loading ? (
                        <Box display="flex" justifyContent="center" p={3}>
                            <CircularProgress/>
                        </Box>
                    ) : (
                        <>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Klant</TableCell>
                                            <TableCell>Email</TableCell>
                                            <TableCell>WooCommerce ID</TableCell>
                                            <TableCell>Geregistreerd</TableCell>
                                            <TableCell>Laatste Sync</TableCell>
                                            <TableCell align="center">Acties</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {customers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center">
                                                    <Typography color="textSecondary" sx={{py: 3}}>
                                                        Geen klanten gevonden
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            customers.map((customer) => (
                                                <TableRow key={customer.id} hover>
                                                    <TableCell>
                                                        <Box display="flex" alignItems="center" gap={2}>
                                                            <Avatar sx={{bgcolor: 'primary.main'}}>
                                                                {getInitials(customer.firstName, customer.lastName)}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography variant="body2" fontWeight="bold">
                                                                    {customer.firstName} {customer.lastName}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <Email fontSize="small" color="action"/>
                                                            <Typography variant="body2">
                                                                {customer.email}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        {customer.wooCommerceId ? (
                                                            <Chip
                                                                label={`#${customer.wooCommerceId}`}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        ) : (
                                                            <Chip
                                                                label="Gast"
                                                                size="small"
                                                                color="default"
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {formatDate(customer.createdAt)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="textSecondary">
                                                            {formatDate(customer.lastSyncedAt)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Tooltip title="Bekijk Orders">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => navigate(`/customers/${customer.id}/orders`)}
                                                            >
                                                                <ShoppingCart fontSize="small"/>
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Bekijk Details">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => navigate(`/customers/${customer.id}`)}
                                                            >
                                                                <Visibility fontSize="small"/>
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
                                count={totalCustomers}
                                page={page}
                                onPageChange={handleChangePage}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                rowsPerPageOptions={[10, 25, 50, 100]}
                                labelRowsPerPage="Rijen per pagina:"
                                labelDisplayedRows={({from, to, count}) =>
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