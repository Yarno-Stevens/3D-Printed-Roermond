import React, { useState } from 'react';
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
    Divider
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
    Inventory as InventoryIcon
} from '@mui/icons-material';
import api from '../utils/api';

export default function CreateProductModal({ open, onClose, onSuccess }) {
    // Product basic info
    const [productName, setProductName] = useState('');
    const [productSku, setProductSku] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [productShortDescription, setProductShortDescription] = useState('');

    // Variations
    const [variations, setVariations] = useState([]);
    const [showVariationForm, setShowVariationForm] = useState(false);

    // New variation fields
    const [varAttributeName, setVarAttributeName] = useState('');
    const [varAttributeValue, setVarAttributeValue] = useState('');
    const [varPrice, setVarPrice] = useState('');
    const [varDescription, setVarDescription] = useState('');

    const [loading, setLoading] = useState(false);

    const addVariation = () => {
        if (!varAttributeName || !varAttributeValue || !varPrice) {
            alert('Vul minimaal attribute naam, waarde en prijs in');
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

        setVariations([...variations, variation]);

        // Reset variation form
        setVarAttributeName('');
        setVarAttributeValue('');
        setVarPrice('');
        setVarDescription('');
        setShowVariationForm(false);
    };

    const removeVariation = (index) => {
        setVariations(variations.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!productName || !productPrice) {
            alert('Vul minimaal productnaam en prijs in');
            return;
        }

        setLoading(true);
        try {
            const requestData = {
                name: productName,
                sku: productSku || null,
                price: parseFloat(productPrice),
                description: productDescription,
                shortDescription: productShortDescription,
                variations: variations
            };

            const response = await api.post('/admin/sync/products/create', requestData);

            alert(`Product "${productName}" succesvol aangemaakt!${variations.length > 0 ? `\nMet ${variations.length} variatie(s)` : ''}`);
            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Failed to create product:', error);
            alert('Fout bij aanmaken product: ' + (error.response?.data?.error || error.message));
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
        setVariations([]);
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
                        <InventoryIcon />
                        <span>Nieuw Product Aanmaken</span>
                    </Box>
                    <IconButton onClick={handleClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {/* Basic Product Info */}
                <Box mb={3}>
                    <Typography variant="h6" gutterBottom>
                        Product Informatie
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={2}>
                        <TextField
                            label="Product naam"
                            fullWidth
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            required
                        />
                        <Box display="flex" gap={2}>
                            <TextField
                                label="SKU (optioneel)"
                                value={productSku}
                                onChange={(e) => setProductSku(e.target.value)}
                                helperText="Leeg laten voor automatische generatie"
                                sx={{ flex: 1 }}
                            />
                            <TextField
                                label="Basisprijs"
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

                {/* Variations Section */}
                <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">
                            Product Variaties (optioneel)
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

                    {/* Variations List */}
                    {variations.length > 0 && (
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Toegevoegde Variaties ({variations.length})
                            </Typography>
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
                                        {variations.map((variation, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <Chip
                                                        label={variation.attributeDisplay}
                                                        size="small"
                                                        color="primary"
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
                                                        onClick={() => removeVariation(index)}
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

                    {variations.length === 0 && !showVariationForm && (
                        <Box textAlign="center" py={2}>
                            <Typography color="textSecondary" variant="body2">
                                Geen variaties toegevoegd. Product wordt aangemaakt als "simple" type.
                            </Typography>
                        </Box>
                    )}
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Annuleren
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || !productName || !productPrice}
                >
                    {loading ? 'Bezig...' : 'Product Aanmaken'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

