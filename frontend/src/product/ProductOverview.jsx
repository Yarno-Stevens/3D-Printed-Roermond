import React, { useState, useEffect } from 'react';
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CardMedia
} from '@mui/material';
import {
    Search,
    FilterList,
    Refresh,
    Visibility,
    Edit,
    Inventory,
    GetApp
} from '@mui/icons-material';
import { useNavigate } from 'react-router';

const API_BASE_URL = 'http://localhost:8080/api/admin/sync';

export default function ProductsOverview() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [totalProducts, setTotalProducts] = useState(0);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [stockFilter, setStockFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    useEffect(() => {
        fetchProducts();
    }, [page, rowsPerPage, categoryFilter, stockFilter]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = {
                page: page,
                size: rowsPerPage,
                search: searchQuery || undefined,
                category: categoryFilter || undefined,
                stockStatus: stockFilter || undefined,
                minPrice: minPrice || undefined,
                maxPrice: maxPrice || undefined
            };

            const response = await axios.get(`${API_BASE_URL}/products`, { params });
            setProducts(response.data.content || response.data);
            setTotalProducts(response.data.totalElements || response.data.length);
            setError(null);
        } catch (err) {
            setError('Fout bij ophalen van producten: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(0);
        fetchProducts();
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setCategoryFilter('');
        setStockFilter('');
        setMinPrice('');
        setMaxPrice('');
        setPage(0);
        fetchProducts();
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const getStockStatusColor = (status) => {
        const statusColors = {
            'instock': 'success',
            'outofstock': 'error',
            'onbackorder': 'warning'
        };
        return statusColors[status] || 'default';
    };

    const getStockStatusLabel = (status) => {
        const labels = {
            'instock': 'Op voorraad',
            'outofstock': 'Uitverkocht',
            'onbackorder': 'Nabestelling'
        };
        return labels[status] || status;
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Producten</Typography>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchProducts}
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
                                placeholder="Zoek op productnaam, SKU of beschrijving..."
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
                                <Grid item xs={12} md={3}>
                                    <FormControl fullWidth>
                                        <InputLabel>Categorie</InputLabel>
                                        <Select
                                            value={categoryFilter}
                                            label="Categorie"
                                            onChange={(e) => setCategoryFilter(e.target.value)}
                                        >
                                            <MenuItem value="">Alle</MenuItem>
                                            <MenuItem value="electronics">Elektronica</MenuItem>
                                            <MenuItem value="clothing">Kleding</MenuItem>
                                            <MenuItem value="accessories">Accessoires</MenuItem>
                                            <MenuItem value="home">Huis & Tuin</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <FormControl fullWidth>
                                        <InputLabel>Voorraadstatus</InputLabel>
                                        <Select
                                            value={stockFilter}
                                            label="Voorraadstatus"
                                            onChange={(e) => setStockFilter(e.target.value)}
                                        >
                                            <MenuItem value="">Alle</MenuItem>
                                            <MenuItem value="instock">Op voorraad</MenuItem>
                                            <MenuItem value="outofstock">Uitverkocht</MenuItem>
                                            <MenuItem value="onbackorder">Nabestelling</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Min. Prijs"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                        InputProps={{
                                            startAdornment: '€'
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Max. Prijs"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                        InputProps={{
                                            startAdornment: '€'
                                        }}
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

            {/* Products Table */}
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
                                            <TableCell width={80}>Afbeelding</TableCell>
                                            <TableCell>Product</TableCell>
                                            <TableCell>SKU</TableCell>
                                            <TableCell align="right">Prijs</TableCell>
                                            <TableCell>Voorraad</TableCell>
                                            <TableCell align="center">Verkocht</TableCell>
                                            <TableCell align="center">Acties</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {products.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center">
                                                    <Typography color="textSecondary" sx={{ py: 3 }}>
                                                        Geen producten gevonden
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            products.map((product) => (
                                                <TableRow key={product.id} hover>
                                                    <TableCell>
                                                        <Box
                                                            sx={{
                                                                width: 60,
                                                                height: 60,
                                                                borderRadius: 1,
                                                                overflow: 'hidden',
                                                                bgcolor: 'grey.200',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            {product.imageUrl ? (
                                                                <CardMedia
                                                                    component="img"
                                                                    image={product.imageUrl}
                                                                    alt={product.name}
                                                                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                />
                                                            ) : (
                                                                <Inventory color="action" />
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {product.name}
                                                        </Typography>
                                                        {product.categories && (
                                                            <Box mt={0.5}>
                                                                {product.categories.slice(0, 2).map((cat, idx) => (
                                                                    <Chip
                                                                        key={idx}
                                                                        label={cat}
                                                                        size="small"
                                                                        sx={{ mr: 0.5, fontSize: '0.7rem' }}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontFamily="monospace">
                                                            {product.sku || '-'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {formatCurrency(product.price)}
                                                        </Typography>
                                                        {product.regularPrice !== product.price && (
                                                            <Typography
                                                                variant="caption"
                                                                color="textSecondary"
                                                                sx={{ textDecoration: 'line-through' }}
                                                            >
                                                                {formatCurrency(product.regularPrice)}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box display="flex" flexDirection="column" gap={0.5}>
                                                            <Chip
                                                                label={getStockStatusLabel(product.stockStatus)}
                                                                color={getStockStatusColor(product.stockStatus)}
                                                                size="small"
                                                            />
                                                            {product.stockStatus === 'instock' && product.stockQuantity && (
                                                                <Typography variant="caption" color="textSecondary">
                                                                    {product.stockQuantity} stuks
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={product.totalSold || 0}
                                                            size="small"
                                                            variant="outlined"
                                                            color="primary"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Tooltip title="Bekijk Details">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => navigate(`/products/${product.id}`)}
                                                            >
                                                                <Visibility fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Bewerk">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => navigate(`/products/${product.id}/edit`)}
                                                            >
                                                                <Edit fontSize="small" />
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
                                count={totalProducts}
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