import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    IconButton,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    InputAdornment,
    Chip,
    Divider,
    Alert,
    Snackbar
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import api from '../utils/api';

export default function EditProductModal({ open, onClose, onSuccess, productId }) {
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [confirmDialog, setConfirmDialog] = useState({ open: false, variationId: null });

    // Product basic info
    const [productName, setProductName] = useState('');
    const [productSku, setProductSku] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [productShortDescription, setProductShortDescription] = useState('');

    // Existing variations
    const [existingVariations, setExistingVariations] = useState([]);

    // New variations to add
    const [newVariations, setNewVariations] = useState([]);
    const [showVariationForm, setShowVariationForm] = useState(false);

    // New variation fields
    const [varAttributeName, setVarAttributeName] = useState('');
    const [varAttributeValue, setVarAttributeValue] = useState('');
    const [varPrice, setVarPrice] = useState('');
    const [varDescription, setVarDescription] = useState('');

    const [loading, setLoading] = useState(false);
    const [loadingProduct, setLoadingProduct] = useState(false);

    const showMessage = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    useEffect(() => {
        if (open && productId) {
            loadProduct();
        }
    }, [open, productId]);

    const loadProduct = async () => {
        setLoadingProduct(true);
        try {
            const response = await api.get(`/admin/sync/products/${productId}`);
            const product = response.data;

            setProductName(product.name || '');
            setProductSku(product.sku || '');
            setProductPrice(product.price?.toString() || '');
            setProductDescription(product.description || '');
            setProductShortDescription(product.shortDescription || '');
            setExistingVariations(product.variations || []);
        } catch (error) {
            console.error('Failed to load product:', error);
            showMessage('Fout bij laden product: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setLoadingProduct(false);
        }
    };

    const addVariation = () => {
        if (!varAttributeName || !varAttributeValue || !varPrice) {
            showMessage('Vul minimaal attribute naam, waarde en prijs in', 'warning');
            return;
        }

        const attributes = JSON.stringify([{
            name: varAttributeName,
            option: varAttributeValue
        }]);

        const variation = {
            attributes: attributes,
            attributeDisplay: `${varAttributeName}: ${varAttributeValue}`,
            price: parseFloat(varPrice),
            regularPrice: parseFloat(varPrice),
            description: varDescription
        };

        setNewVariations([...newVariations, variation]);

        // Reset variation form
        setVarAttributeName('');
        setVarAttributeValue('');
        setVarPrice('');
        setVarDescription('');
        setShowVariationForm(false);
    };

    const removeNewVariation = (index) => {
        setNewVariations(newVariations.filter((_, i) => i !== index));
    };

    const deleteExistingVariation = async (variationId) => {
        setConfirmDialog({ open: true, variationId });
    };

    const handleConfirmDelete = async () => {
        const variationId = confirmDialog.variationId;
        setConfirmDialog({ open: false, variationId: null });

        try {
            await api.delete(`/admin/sync/products/${productId}/variations/${variationId}`);
            setExistingVariations(existingVariations.filter(v => v.id !== variationId));
            showMessage('Variatie verwijderd!', 'success');
        } catch (error) {
            console.error('Failed to delete variation:', error);
            showMessage('Fout bij verwijderen variatie: ' + (error.response?.data?.error || error.message), 'error');
        }
    };

    const handleCancelDelete = () => {
        setConfirmDialog({ open: false, variationId: null });
    };

    const parseAttributes = (attributesJson) => {
        if (!attributesJson) return '';
        try {
            const attrs = JSON.parse(attributesJson);
            return attrs.map(a => `${a.name}: ${a.option}`).join(', ');
        } catch {
            return attributesJson;
        }
    };

    const handleSubmit = async () => {
        if (!productName || !productPrice) {
            showMessage('Vul minimaal productnaam en prijs in', 'warning');
            return;
        }

        setLoading(true);
        try {
            // Update basic product info
            const updateData = {
                name: productName,
                sku: productSku || null,
                price: parseFloat(productPrice),
                description: productDescription,
                shortDescription: productShortDescription
            };

            await api.put(`/admin/sync/products/${productId}`, updateData);

            // Add new variations if any
            for (const variation of newVariations) {
                await api.post(`/admin/sync/products/${productId}/variations`, variation);
            }

            showMessage(`Product "${productName}" succesvol bijgewerkt!${newVariations.length > 0 ? ` ${newVariations.length} nieuwe variatie(s) toegevoegd` : ''}`, 'success');
            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Failed to update product:', error);
            showMessage('Fout bij bijwerken product: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setProductName('');
        setProductSku('');
        setProductPrice('');
        setProductDescription('');
        setProductShortDescription('');
        setExistingVariations([]);
        setNewVariations([]);
        setShowVariationForm(false);
        setVarAttributeName('');
        setVarAttributeValue('');
        setVarPrice('');
        setVarDescription('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                        <EditIcon />
                        <span>Product Bewerken</span>
                    </Box>
                    <IconButton onClick={handleClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {loadingProduct ? (
                    <Box textAlign="center" py={4}>
                        <Typography>Product laden...</Typography>
                    </Box>
                ) : (
                    <>
                        {/* Basic Product Info */}
                        <Box mb={3}>
                            <Typography variant="h6" gutterBottom>
                                Product Informatie
                            </Typography>
                            <Box display="flex" flexDirection="column" gap={2}>
                                <TextField
                                    label="Product naam *"
                                    fullWidth
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    required
                                />
                                <Box display="flex" gap={2}>
                                    <TextField
                                        label="SKU"
                                        value={productSku}
                                        onChange={(e) => setProductSku(e.target.value)}
                                        helperText="SKU van product"
                                        sx={{ flex: 1 }}
                                    />
                                    <TextField
                                        label="Basisprijs *"
                                        type="number"
                                        value={productPrice}
                                        onChange={(e) => setProductPrice(e.target.value)}
                                        inputProps={{ step: '0.01', min: '0' }}
                                        required
                                        sx={{ flex: 1 }}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">€</InputAdornment>,
                                        }}
                                    />
                                </Box>
                                <TextField
                                    label="Korte omschrijving"
                                    multiline
                                    rows={2}
                                    fullWidth
                                    value={productShortDescription}
                                    onChange={(e) => setProductShortDescription(e.target.value)}
                                />
                                <TextField
                                    label="Volledige omschrijving"
                                    multiline
                                    rows={3}
                                    fullWidth
                                    value={productDescription}
                                    onChange={(e) => setProductDescription(e.target.value)}
                                />
                            </Box>
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        {/* Existing Variations */}
                        {existingVariations.length > 0 && (
                            <Box mb={3}>
                                <Typography variant="h6" gutterBottom>
                                    Bestaande Variaties ({existingVariations.length})
                                </Typography>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Attributen</TableCell>
                                                <TableCell>SKU</TableCell>
                                                <TableCell align="right">Prijs</TableCell>
                                                <TableCell align="center">Acties</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {existingVariations.map((variation) => (
                                                <TableRow key={variation.id}>
                                                    <TableCell>
                                                        <Chip
                                                            label={parseAttributes(variation.attributes)}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="caption">
                                                            {variation.sku}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        €{variation.price?.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => deleteExistingVariation(variation.id)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}

                        {/* New Variations Section */}
                        <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">
                                    Nieuwe Variaties Toevoegen
                                </Typography>
                                <Button
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => setShowVariationForm(!showVariationForm)}
                                    variant={showVariationForm ? "outlined" : "contained"}
                                >
                                    {showVariationForm ? 'Annuleer' : 'Variatie Toevoegen'}
                                </Button>
                            </Box>

                            {showVariationForm && (
                                <Box p={2} border={1} borderColor="divider" borderRadius={1} mb={2}>
                                    <Typography variant="subtitle2" color="primary" gutterBottom>
                                        Nieuwe Variatie
                                    </Typography>
                                    <Box display="flex" flexDirection="column" gap={2}>
                                        <Box display="flex" gap={2}>
                                            <TextField
                                                label="Attribute naam *"
                                                placeholder="bijv. Gewicht, Kleur, Maat"
                                                value={varAttributeName}
                                                onChange={(e) => setVarAttributeName(e.target.value)}
                                                size="small"
                                                sx={{ flex: 1 }}
                                            />
                                            <TextField
                                                label="Attribute waarde *"
                                                placeholder="bijv. 300gr, Rood, Large"
                                                value={varAttributeValue}
                                                onChange={(e) => setVarAttributeValue(e.target.value)}
                                                size="small"
                                                sx={{ flex: 1 }}
                                            />
                                        </Box>
                                        <Box display="flex" gap={2}>
                                            <TextField
                                                label="Prijs *"
                                                type="number"
                                                value={varPrice}
                                                onChange={(e) => setVarPrice(e.target.value)}
                                                inputProps={{ step: '0.01', min: '0' }}
                                                size="small"
                                                sx={{ flex: 1 }}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">€</InputAdornment>,
                                                }}
                                            />
                                            <TextField
                                                label="Omschrijving"
                                                value={varDescription}
                                                onChange={(e) => setVarDescription(e.target.value)}
                                                size="small"
                                                sx={{ flex: 2 }}
                                            />
                                        </Box>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            onClick={addVariation}
                                            disabled={!varAttributeName || !varAttributeValue || !varPrice}
                                            fullWidth
                                        >
                                            Variatie Toevoegen
                                        </Button>
                                    </Box>
                                </Box>
                            )}

                            {/* New Variations List */}
                            {newVariations.length > 0 && (
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Nieuwe Variaties om Toe te Voegen ({newVariations.length})
                                    </Typography>
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        Deze variaties worden toegevoegd wanneer je op "Opslaan" klikt
                                    </Alert>
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Attributen</TableCell>
                                                    <TableCell align="right">Prijs</TableCell>
                                                    <TableCell align="center">Acties</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {newVariations.map((variation, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            <Chip
                                                                label={variation.attributeDisplay}
                                                                size="small"
                                                                color="success"
                                                                variant="outlined"
                                                            />
                                                            {variation.description && (
                                                                <Typography variant="caption" display="block" color="textSecondary">
                                                                    {variation.description}
                                                                </Typography>
                                                            )}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            €{variation.price.toFixed(2)}
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => removeNewVariation(index)}
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            )}
                        </Box>
                    </>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Annuleren
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || loadingProduct || !productName || !productPrice}
                >
                    {loading ? 'Bezig...' : 'Opslaan'}
                </Button>
            </DialogActions>

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmDialog.open}
                onClose={handleCancelDelete}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Variatie Verwijderen</DialogTitle>
                <DialogContent>
                    <Typography>
                        Weet je zeker dat je deze variatie wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete}>
                        Annuleren
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained">
                        Verwijderen
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Dialog>
    );
}

