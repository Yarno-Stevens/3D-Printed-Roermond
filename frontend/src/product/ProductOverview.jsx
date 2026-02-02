import React, {useState, useEffect} from 'react';
import api from '../utils/api';
import CreateProductModal from './CreateProductModal';
import EditProductModal from './EditProductModal';
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
    MenuItem
} from '@mui/material';
import {
    Search,
    FilterList,
    Refresh,
    Visibility,
    Add as AddIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router';


export default function ProductsOverview() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState(null);

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [totalProducts, setTotalProducts] = useState(0);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    useEffect(() => {
        fetchProducts();
    }, [page, rowsPerPage]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = {
                page: page,
                size: rowsPerPage
            };

            // Only add search if it has a value
            if (searchQuery && searchQuery.trim()) {
                params.search = searchQuery.trim();
            }

            // Only add status filter if it has a value
            if (statusFilter && statusFilter.trim()) {
                params.status = statusFilter.trim();
            }

            // Only add price filters if they have values
            if (minPrice && minPrice.trim()) {
                params.minPrice = minPrice.trim();
            }

            if (maxPrice && maxPrice.trim()) {
                params.maxPrice = maxPrice.trim();
            }

            const response = await api.get('/admin/sync/products', { params });
            setProducts(response.data.content || []);
            setTotalProducts(response.data.totalElements || 0);
            setError(null);
        } catch (err) {
            setError('Fout bij ophalen van producten: ' + err.message);
            console.error('Error fetching products:', err);
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
        setStatusFilter('');
        setMinPrice('');
        setMaxPrice('');
        setPage(0);
        setTimeout(() => fetchProducts(), 0);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return '-';
        return new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const getStatusColor = (status) => {
        const statusColors = {
            'publish': 'success',
            'draft': 'warning',
            'pending': 'info',
            'private': 'default'
        };
        return statusColors[status?.toLowerCase()] || 'default';
    };

    const getStatusLabel = (status) => {
        const labels = {
            'publish': 'Gepubliceerd',
            'draft': 'Concept',
            'pending': 'In behandeling',
            'private': 'Privé'
        };
        return labels[status?.toLowerCase()] || status;
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Producten</Typography>
                <Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateModalOpen(true)}
                        sx={{ mr: 1 }}
                    >
                        Nieuw Product
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchProducts}
                    >
                        Ververs
                    </Button>
                </Box>
            </Box>

            <CreateProductModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={fetchProducts}
            />

            <EditProductModal
                open={editModalOpen}
                onClose={() => {
                    setEditModalOpen(false);
                    setSelectedProductId(null);
                }}
                onSuccess={fetchProducts}
                productId={selectedProductId}
            />

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
                                placeholder="Zoek op productnaam of SKU..."
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
                                        <InputLabel>Status</InputLabel>
                                        <Select className="min-w-40"
                                            value={statusFilter}
                                            label="Status"
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
                                            <MenuItem value="">Alle</MenuItem>
                                            <MenuItem value="publish">Gepubliceerd</MenuItem>
                                            <MenuItem value="draft">Concept</MenuItem>
                                            <MenuItem value="pending">In behandeling</MenuItem>
                                            <MenuItem value="private">Privé</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Min. Prijs"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                        InputProps={{
                                            startAdornment: <Typography sx={{ mr: 1 }}>€</Typography>
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Max. Prijs"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                        InputProps={{
                                            startAdornment: <Typography sx={{ mr: 1 }}>€</Typography>
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
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
                                            <TableCell>Product</TableCell>
                                            <TableCell>SKU</TableCell>
                                            <TableCell>Type</TableCell>
                                            <TableCell align="right">Prijs</TableCell>
                                            <TableCell>Status</TableCell>
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
                                                        <Box display="flex" alignItems="center" gap={2}>
                                                            <Box>
                                                                <Typography variant="body2" fontWeight="bold">
                                                                    {product.name}
                                                                </Typography>
                                                                {product.shortDescription && (
                                                                    <Typography
                                                                        variant="caption"
                                                                        color="textSecondary"
                                                                        sx={{
                                                                            display: '-webkit-box',
                                                                            WebkitLineClamp: 1,
                                                                            WebkitBoxOrient: 'vertical',
                                                                            overflow: 'hidden'
                                                                        }}
                                                                    >
                                                                        {product.shortDescription.replace(/<[^>]*>/g, '')}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontFamily="monospace">
                                                            {product.sku || '-'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={product.type || 'simple'}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="bold">
                                                                {formatCurrency(product.price)}
                                                            </Typography>
                                                            {product.salePrice && product.regularPrice &&
                                                             product.salePrice < product.regularPrice && (
                                                                <Typography
                                                                    variant="caption"
                                                                    color="textSecondary"
                                                                    sx={{ textDecoration: 'line-through' }}
                                                                >
                                                                    {formatCurrency(product.regularPrice)}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={getStatusLabel(product.status)}
                                                            color={getStatusColor(product.status)}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {!product.wooCommerceId && (
                                                        <Tooltip title="Bewerken">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    setSelectedProductId(product.id);
                                                                    setEditModalOpen(true);
                                                                }}
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                            )}
                                                        <Tooltip title="Bekijk Details">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => navigate(`/products/${product.id}`)}
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