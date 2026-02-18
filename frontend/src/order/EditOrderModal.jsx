import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    IconButton,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Autocomplete,
    Snackbar,
    Alert,
    Paper,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Close as CloseIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon
} from '@mui/icons-material';
import api from '../utils/api';

export default function EditOrderModal({ open, onClose, onSuccess, order }) {
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [loading, setLoading] = useState(false);

    const [items, setItems] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedVariation, setSelectedVariation] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    // Variation filtering
    const [variationAttributes, setVariationAttributes] = useState({});
    const [availableAttributes, setAvailableAttributes] = useState([]);
    const [filteredVariations, setFilteredVariations] = useState([]);

    useEffect(() => {
        if (order && open) {
            // Load existing items and convert prices to numbers
            const normalizedItems = (order.items || []).map(item => ({
                ...item,
                price: Number(item.price) || Number(item.total) / Number(item.quantity) || 0,
                quantity: parseInt(item.quantity) || 1,
                total: Number(item.total) || 0
            }));
            setItems(normalizedItems);
        }
    }, [order, open]);

    useEffect(() => {
        if (open) {
            fetchProducts();
        }
    }, [open, searchQuery]);

    // Extract available attributes when product is selected
    useEffect(() => {
        if (selectedProduct && selectedProduct.variations && selectedProduct.variations.length > 0) {
            const attributesMap = {};

            selectedProduct.variations.forEach(variation => {
                if (variation.attributes) {
                    try {
                        const attrs = JSON.parse(variation.attributes);
                        attrs.forEach(attr => {
                            if (!attributesMap[attr.name]) {
                                attributesMap[attr.name] = new Set();
                            }
                            attributesMap[attr.name].add(attr.option);
                        });
                    } catch (e) {
                        console.error('Failed to parse attributes:', e);
                    }
                }
            });

            const attributes = Object.keys(attributesMap).map(name => ({
                name,
                options: Array.from(attributesMap[name]).sort()
            }));

            setAvailableAttributes(attributes);
            setVariationAttributes({});
            setFilteredVariations(selectedProduct.variations);
        } else {
            setAvailableAttributes([]);
            setVariationAttributes({});
            setFilteredVariations([]);
        }
        setSelectedVariation(null);
    }, [selectedProduct]);

    // Filter variations based on selected attributes
    useEffect(() => {
        if (!selectedProduct || !selectedProduct.variations || selectedProduct.variations.length === 0) {
            setFilteredVariations([]);
            return;
        }

        const filtered = selectedProduct.variations.filter(variation => {
            if (!variation.attributes) return false;

            try {
                const attrs = JSON.parse(variation.attributes);

                return Object.entries(variationAttributes).every(([attrName, attrValue]) => {
                    if (!attrValue) return true;
                    return attrs.some(a => a.name === attrName && a.option === attrValue);
                });
            } catch (e) {
                return false;
            }
        });

        setFilteredVariations(filtered);

        // Auto-select if only one variation matches
        if (filtered.length === 1) {
            setSelectedVariation(filtered[0]);
        } else if (filtered.length === 0 || !filtered.find(v => v.id === selectedVariation?.id)) {
            setSelectedVariation(null);
        }
    }, [variationAttributes, selectedProduct]);

    const fetchProducts = async () => {
        try {
            const response = await api.get('/admin/sync/products/search', {
                params: { query: searchQuery }
            });
            setProducts(response.data);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    };

    const handleAttributeChange = (attributeName, value) => {
        setVariationAttributes(prev => ({
            ...prev,
            [attributeName]: value
        }));
    };

    const showMessage = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleAddItem = () => {
        if (!selectedProduct) {
            showMessage('Selecteer een product', 'warning');
            return;
        }

        // Check if product has variations and no variation is selected
        if (selectedProduct.variations && selectedProduct.variations.length > 0 && !selectedVariation) {
            showMessage('Selecteer een variatie', 'warning');
            return;
        }

        let itemPrice = selectedProduct.price || 0;
        let itemName = selectedProduct.name;

        // Use variation price and details if variation is selected
        if (selectedVariation) {
            itemPrice = selectedVariation.price || itemPrice;

            // Parse attributes to create a descriptive name
            try {
                const attrs = JSON.parse(selectedVariation.attributes);
                const attrString = attrs.map(a => `${a.name}: ${a.option}`).join(' - ');
                itemName = `${selectedProduct.name} (${attrString})`;
            } catch (e) {
                itemName = `${selectedProduct.name} - ${selectedVariation.sku || 'Variatie'}`;
            }
        }

        const qty = parseInt(quantity) || 1;

        const newItem = {
            productId: selectedVariation ? selectedVariation.id : selectedProduct.id,
            variationId: selectedVariation?.id,
            productName: itemName,
            quantity: qty,
            price: itemPrice,
            total: itemPrice * qty
        };

        setItems([...items, newItem]);
        setSelectedProduct(null);
        setSelectedVariation(null);
        setVariationAttributes({});
        setAvailableAttributes([]);
        setFilteredVariations([]);
        setQuantity(1);
        setSearchQuery('');
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleQuantityChange = (index, newQuantity) => {
        const newItems = [...items];
        const qty = parseInt(newQuantity) || 1;
        const price = Number(newItems[index].price) || 0;

        newItems[index].quantity = qty;
        newItems[index].total = price * qty;
        setItems(newItems);
    };

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => {
            const price = Number(item.price) || 0;
            const quantity = parseInt(item.quantity) || 0;
            return sum + (price * quantity);
        }, 0);
    };

    const calculateDiscount = () => {
        if (!order?.customer?.discount) return 0;
        const subtotal = calculateSubtotal();
        return (subtotal * Number(order.customer.discount)) / 100;
    };

    const calculateTotal = () => {
        return calculateSubtotal() - calculateDiscount();
    };

    const handleSubmit = async () => {
        if (items.length === 0) {
            showMessage('Voeg minimaal één product toe', 'warning');
            return;
        }

        setLoading(true);
        try {
            const requestData = {
                orderId: order.id,
                customerId: order.customer?.id,
                items: items.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    price: item.price
                }))
            };

            await api.put(`/admin/sync/orders/${order.id}`, requestData);

            showMessage('Order succesvol bijgewerkt!', 'success');
            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Failed to update order:', error);
            showMessage('Fout bij bijwerken order: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setItems([]);
        setSelectedProduct(null);
        setQuantity(1);
        setSearchQuery('');
        onClose();
    };

    if (!order) {
        return null;
    }

    return (
        <>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1}>
                            <EditIcon />
                            <span>Order Bewerken #{order.orderNumber}</span>
                        </Box>
                        <IconButton onClick={handleClose}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent dividers>
                    {/* Customer Info */}
                    <Box mb={3}>
                        <Typography variant="subtitle2" color="textSecondary">Klant</Typography>
                        <Typography variant="body1" fontWeight="bold">
                            {order.customer?.firstName} {order.customer?.lastName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {order.customer?.email}
                        </Typography>
                        {order.customer?.discount > 0 && (
                            <Chip
                                label={`Korting: ${Number(order.customer.discount).toFixed(2)}%`}
                                color="success"
                                size="small"
                                sx={{ mt: 1 }}
                            />
                        )}
                    </Box>

                    {/* Add Product Section */}
                    <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                        <Typography variant="subtitle1" gutterBottom>Product Toevoegen</Typography>
                        <Box display="flex" gap={2} mb={2}>
                            <Autocomplete
                                fullWidth
                                options={products}
                                value={selectedProduct}
                                onChange={(e, newValue) => {
                                    setSelectedProduct(newValue);
                                    setSelectedVariation(null); // Reset variation when product changes
                                }}
                                inputValue={searchQuery}
                                onInputChange={(event, newInputValue) => setSearchQuery(newInputValue)}
                                getOptionLabel={(option) => `${option.name} - €${Number(option.price).toFixed(2)}`}
                                renderInput={(params) => (
                                    <TextField {...params} label="Zoek product" placeholder="Type om te zoeken..." variant="outlined" />
                                )}
                                renderOption={(props, option) => (
                                    <li {...props}>
                                        <Box>
                                            <Typography variant="body1">{option.name}</Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                SKU: {option.sku || 'N/A'} | Prijs: €{option.price}
                                                {option.variations && option.variations.length > 0 &&
                                                    ` | ${option.variations.length} variaties`}
                                            </Typography>
                                        </Box>
                                    </li>
                                )}
                            />
                            <TextField
                                type="number"
                                label="Aantal"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                inputProps={{ min: 1 }}
                                sx={{ width: 100 }}
                            />
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleAddItem}
                                disabled={!selectedProduct || (selectedProduct?.variations?.length > 0 && !selectedVariation)}
                            >
                                Toevoegen
                            </Button>
                        </Box>

                        {/* Variation selector - only show if product has variations */}
                        {selectedProduct && selectedProduct.variations && selectedProduct.variations.length > 0 && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Variatie Filters
                                </Typography>
                                <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                                    Selecteer opties om de variaties te filteren ({filteredVariations.length} van {selectedProduct.variations.length} variaties getoond)
                                </Typography>

                                {/* Attribute Filter Dropdowns */}
                                <Box display="flex" flexDirection="column" gap={2} mb={2} mt={2}>
                                    {availableAttributes.map((attribute) => (
                                        <FormControl key={attribute.name} fullWidth size="small">
                                            <InputLabel>{attribute.name}</InputLabel>
                                            <Select
                                                value={variationAttributes[attribute.name] || ''}
                                                onChange={(e) => handleAttributeChange(attribute.name, e.target.value)}
                                                label={attribute.name}
                                            >
                                                <MenuItem value="">
                                                    <em>Alle</em>
                                                </MenuItem>
                                                {attribute.options.map((option) => (
                                                    <MenuItem key={option} value={option}>
                                                        {option}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    ))}
                                </Box>

                                {/* Filtered Variations List */}
                                {filteredVariations.length > 0 && (
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Selecteer Variatie
                                        </Typography>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Variatie *</InputLabel>
                                            <Select
                                                value={selectedVariation?.id || ''}
                                                onChange={(e) => {
                                                    const variation = filteredVariations.find(v => v.id === e.target.value);
                                                    setSelectedVariation(variation);
                                                }}
                                                label="Variatie *"
                                            >
                                                {filteredVariations.map((variation) => {
                                                    const attrs = variation.attributes ?
                                                        (() => {
                                                            try {
                                                                const parsed = JSON.parse(variation.attributes);
                                                                return parsed.map(a => `${a.name}: ${a.option}`).join(', ');
                                                            } catch {
                                                                return variation.attributes;
                                                            }
                                                        })() :
                                                        variation.sku || `Variatie ${variation.id}`;

                                                    return (
                                                        <MenuItem key={variation.id} value={variation.id}>
                                                            <Box>
                                                                <Typography variant="body2">
                                                                    {attrs}
                                                                </Typography>
                                                                <Typography variant="caption" color="textSecondary">
                                                                    €{variation.price} {variation.sku && `| SKU: ${variation.sku}`}
                                                                </Typography>
                                                            </Box>
                                                        </MenuItem>
                                                    );
                                                })}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                )}

                                {filteredVariations.length === 0 && (
                                    <Alert severity="info" sx={{ mt: 2 }}>
                                        Geen variaties gevonden met de geselecteerde filters
                                    </Alert>
                                )}
                            </Box>
                        )}
                    </Paper>

                    {/* Items Table */}
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Product</TableCell>
                                    <TableCell align="right">Prijs</TableCell>
                                    <TableCell align="center">Aantal</TableCell>
                                    <TableCell align="right">Totaal</TableCell>
                                    <TableCell align="center">Acties</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">
                                            <Typography color="textSecondary">Geen producten toegevoegd</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.productName}</TableCell>
                                            <TableCell align="right">€{Number(item.price).toFixed(2)}</TableCell>
                                            <TableCell align="center">
                                                <TextField
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                    inputProps={{ min: 1 }}
                                                    size="small"
                                                    sx={{ width: 80 }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                €{Number(item.price * item.quantity).toFixed(2)}
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleRemoveItem(index)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Totals */}
                    <Box mt={3}>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography>Subtotaal:</Typography>
                            <Typography fontWeight="bold">€{calculateSubtotal().toFixed(2)}</Typography>
                        </Box>
                        {order.customer?.discount > 0 && (
                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography color="success.main">
                                    Korting ({Number(order.customer.discount).toFixed(2)}%):
                                </Typography>
                                <Typography color="success.main" fontWeight="bold">
                                    -€{calculateDiscount().toFixed(2)}
                                </Typography>
                            </Box>
                        )}
                        <Box display="flex" justifyContent="space-between" pt={1} borderTop={1} borderColor="divider">
                            <Typography variant="h6">Totaal:</Typography>
                            <Typography variant="h6" color="primary">€{calculateTotal().toFixed(2)}</Typography>
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleClose} disabled={loading} variant="outlined">
                        Annuleren
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={loading || items.length === 0}
                    >
                        {loading ? 'Opslaan...' : 'Opslaan'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}

