import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    CircularProgress,
    Alert,
    Grid,
    Chip,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';
import {
    ArrowBack,
    Inventory,
    LocalOffer,
    CalendarToday,
    Sync
} from '@mui/icons-material';

const API_BASE_URL = 'http://localhost:8080/api/admin/sync';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/products/${id}`);
            setProduct(response.data);
            setError(null);
        } catch (err) {
            setError('Fout bij ophalen van product: ' + err.message);
            console.error('Error fetching product:', err);
        } finally {
            setLoading(false);
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
        if (!dateString) return 'Nooit';
        return new Date(dateString).toLocaleString('nl-NL', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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

    const stripHtmlTags = (html) => {
        if (!html) return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    const parseAttributes = (attributesString) => {
        if (!attributesString) return [];
        try {
            const parsed = JSON.parse(attributesString);
            if (Array.isArray(parsed)) {
                return parsed;
            }
            return [];
        } catch (e) {
            // If it's not JSON, try to parse as comma-separated
            return attributesString.split(',').map(attr => ({ name: attr.trim(), option: '' }));
        }
    };

    const parseDimensions = (dimensionsString) => {
        if (!dimensionsString) return null;
        try {
            const parsed = JSON.parse(dimensionsString);
            // Check if all dimensions are empty
            if (parsed.length === '' && parsed.width === '' && parsed.height === '') {
                return null;
            }
            return parsed;
        } catch (e) {
            return null;
        }
    };

    const formatDimensions = (dimensions) => {
        if (!dimensions) return null;
        const parts = [];
        if (dimensions.length) parts.push(`L: ${dimensions.length}`);
        if (dimensions.width) parts.push(`B: ${dimensions.width}`);
        if (dimensions.height) parts.push(`H: ${dimensions.height}`);
        return parts.length > 0 ? parts.join(' × ') : null;
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
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
                <Button
                    variant="contained"
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/products')}
                >
                    Terug naar Producten
                </Button>
            </Box>
        );
    }

    if (!product) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="warning">Product niet gevonden</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/products')}
                    >
                        Terug
                    </Button>
                    <Typography variant="h4">Product Details</Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<Sync />}
                    onClick={fetchProduct}
                >
                    Ververs
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Main Product Info */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="start" gap={2} mb={3}>
                                <Box
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 2,
                                        bgcolor: 'grey.200',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Inventory fontSize="large" color="action" />
                                </Box>
                                <Box flex={1}>
                                    <Typography variant="h5" gutterBottom>
                                        {product.name}
                                    </Typography>
                                    <Box display="flex" gap={1} mb={1}>
                                        <Chip
                                            label={getStatusLabel(product.status)}
                                            color={getStatusColor(product.status)}
                                            size="small"
                                        />
                                        <Chip
                                            label={product.type || 'simple'}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </Box>
                                    {product.sku && (
                                        <Typography variant="body2" color="textSecondary" fontFamily="monospace">
                                            SKU: {product.sku}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            {/* Short Description */}
                            {product.shortDescription && (
                                <Box mb={3}>
                                    <Typography variant="h6" gutterBottom>
                                        Korte Beschrijving
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        {stripHtmlTags(product.shortDescription)}
                                    </Typography>
                                </Box>
                            )}

                            {/* Full Description */}
                            {product.description && (
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Volledige Beschrijving
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" sx={{ whiteSpace: 'pre-wrap' }}>
                                        {stripHtmlTags(product.description)}
                                    </Typography>
                                </Box>
                            )}

                            {/* Product Variations */}
                            {product.variations && product.variations.length > 0 && (
                                <Box mt={4}>
                                    <Divider sx={{ my: 3 }} />
                                    <Typography variant="h6" gutterBottom>
                                        Product Varianten ({product.variations.length})
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                        Dit product heeft meerdere varianten met verschillende eigenschappen.
                                    </Typography>

                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell><strong>SKU</strong></TableCell>
                                                    <TableCell><strong>Attributen</strong></TableCell>
                                                    <TableCell align="right"><strong>Prijs</strong></TableCell>
                                                    <TableCell><strong>Status</strong></TableCell>
                                                    <TableCell><strong>Afmetingen</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {product.variations.map((variation) => {
                                                    const attributes = parseAttributes(variation.attributes);
                                                    const dimensions = parseDimensions(variation.dimensions);
                                                    const formattedDimensions = formatDimensions(dimensions);

                                                    return (
                                                        <TableRow key={variation.id} hover>
                                                            <TableCell>
                                                                <Typography variant="body2" fontFamily="monospace">
                                                                    {variation.sku || '-'}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                {attributes && attributes.length > 0 ? (
                                                                    <Box>
                                                                        {attributes.map((attr, idx) => (
                                                                            <Chip
                                                                                key={idx}
                                                                                label={attr.name && attr.option ? `${attr.name}: ${attr.option}` : attr.option || attr.name}
                                                                                size="small"
                                                                                variant="outlined"
                                                                                sx={{ mr: 0.5, mb: 0.5 }}
                                                                            />
                                                                        ))}
                                                                    </Box>
                                                                ) : (
                                                                    <Typography variant="body2" color="textSecondary">-</Typography>
                                                                )}
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <Box>
                                                                    <Typography variant="body2" fontWeight="bold">
                                                                        {formatCurrency(variation.price)}
                                                                    </Typography>
                                                                    {variation.salePrice && variation.regularPrice &&
                                                                     variation.salePrice < variation.regularPrice && (
                                                                        <Typography
                                                                            variant="caption"
                                                                            color="textSecondary"
                                                                            sx={{ textDecoration: 'line-through' }}
                                                                        >
                                                                            {formatCurrency(variation.regularPrice)}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={getStatusLabel(variation.status)}
                                                                    color={getStatusColor(variation.status)}
                                                                    size="small"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Box>
                                                                    {formattedDimensions && (
                                                                        <Typography variant="caption" display="block">
                                                                            📏 {formattedDimensions}
                                                                        </Typography>
                                                                    )}
                                                                    {variation.weight && (
                                                                        <Typography variant="caption" display="block">
                                                                            ⚖️ {variation.weight}
                                                                        </Typography>
                                                                    )}
                                                                    {!formattedDimensions && !variation.weight && (
                                                                        <Typography variant="body2" color="textSecondary">-</Typography>
                                                                    )}
                                                                </Box>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Sidebar */}
                <Grid item xs={12} md={4}>
                    {/* Price Info */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                                <LocalOffer /> Prijsinformatie
                            </Typography>
                            <Divider sx={{ my: 2 }} />

                            <Box mb={2}>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Huidige Prijs
                                </Typography>
                                <Typography variant="h4" color="primary">
                                    {formatCurrency(product.price)}
                                </Typography>
                            </Box>

                            {product.regularPrice && (
                                <Box mb={2}>
                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                        Normale Prijs
                                    </Typography>
                                    <Typography variant="h6">
                                        {formatCurrency(product.regularPrice)}
                                    </Typography>
                                </Box>
                            )}

                            {product.salePrice && (
                                <Box mb={2}>
                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                        Sale Prijs
                                    </Typography>
                                    <Typography variant="h6" color="error">
                                        {formatCurrency(product.salePrice)}
                                    </Typography>
                                    {product.regularPrice && product.salePrice < product.regularPrice && (
                                        <Chip
                                            label={`${Math.round((1 - product.salePrice / product.regularPrice) * 100)}% korting`}
                                            color="error"
                                            size="small"
                                            sx={{ mt: 1 }}
                                        />
                                    )}
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    {/* System Info */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                                <CalendarToday /> Systeeminformatie
                            </Typography>
                            <Divider sx={{ my: 2 }} />

                            <Box mb={2}>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Product ID
                                </Typography>
                                <Typography variant="body1" fontFamily="monospace">
                                    {product.id}
                                </Typography>
                            </Box>

                            {product.wooCommerceId && (
                                <Box mb={2}>
                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                        WooCommerce ID
                                    </Typography>
                                    <Typography variant="body1" fontFamily="monospace">
                                        {product.wooCommerceId}
                                    </Typography>
                                </Box>
                            )}

                            <Box mb={2}>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Aangemaakt op
                                </Typography>
                                <Typography variant="body2">
                                    {formatDate(product.createdAt)}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Laatst gesynchroniseerd
                                </Typography>
                                <Typography variant="body2">
                                    {formatDate(product.lastSyncedAt)}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

