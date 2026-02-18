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
    InputAdornment,
    Snackbar,
    Alert,
    Chip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Checkbox,
    ListItemText,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Divider,
    Card,
    CardContent,
    ToggleButtonGroup,
    ToggleButton
} from '@mui/material';
import {
    Close as CloseIcon,
    Inventory as InventoryIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Palette as PaletteIcon,
    TextFields as TextFieldsIcon
} from '@mui/icons-material';
import api from '../utils/api';

export default function CreateProductModal({ open, onClose, onSuccess }) {
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [productName, setProductName] = useState('');
    const [productSku, setProductSku] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [productDescription, setProductDescription] = useState('');
    const [productShortDescription, setProductShortDescription] = useState('');
    const [loading, setLoading] = useState(false);

    // Available colors from database
    const [availableColors, setAvailableColors] = useState([]);

    // Attributes configuration
    const [attributes, setAttributes] = useState([]);
    const [showAttributeForm, setShowAttributeForm] = useState(false);
    const [attributeType, setAttributeType] = useState('color'); // 'color' or 'text'
    const [attributeName, setAttributeName] = useState('');
    const [selectedColors, setSelectedColors] = useState([]);
    const [textOptions, setTextOptions] = useState('');

    // Generated variations
    const [generatedVariations, setGeneratedVariations] = useState([]);

    useEffect(() => {
        if (open) {
            loadColors();
        }
    }, [open]);

    useEffect(() => {
        // Auto-select all colors when switching to color type
        if (attributeType === 'color' && availableColors.length > 0 && selectedColors.length === 0) {
            setSelectedColors(availableColors.map(c => c.id));
        }
    }, [attributeType, availableColors]);

    useEffect(() => {
        // Regenerate variations when attributes change
        if (attributes.length > 0) {
            generateVariations();
        } else {
            setGeneratedVariations([]);
        }
    }, [attributes, productPrice]);

    const loadColors = async () => {
        try {
            const response = await api.get('/admin/sync/colors');
            setAvailableColors(response.data);
        } catch (error) {
            console.error('Failed to load colors:', error);
            showMessage('Fout bij laden kleuren', 'error');
        }
    };

    const showMessage = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const addAttribute = () => {
        if (!attributeName.trim()) {
            showMessage('Attribuutnaam is verplicht', 'warning');
            return;
        }

        if (attributeType === 'color' && selectedColors.length === 0) {
            showMessage('Selecteer minimaal één kleur', 'warning');
            return;
        }

        if (attributeType === 'text' && !textOptions.trim()) {
            showMessage('Voer minimaal één optie in', 'warning');
            return;
        }

        const newAttribute = {
            id: Date.now(),
            name: attributeName,
            type: attributeType,
            options: attributeType === 'color'
                ? selectedColors.map(colorId => {
                    const color = availableColors.find(c => c.id === colorId);
                    return {
                        value: color.attributeValue,
                        label: color.attributeName,
                        hexCode: color.hexCode
                    };
                })
                : textOptions.split('\n').filter(opt => opt.trim()).map(opt => ({
                    value: opt.trim(),
                    label: opt.trim()
                }))
        };

        setAttributes([...attributes, newAttribute]);

        // Reset form
        setAttributeName('');
        setSelectedColors([]);
        setTextOptions('');
        // Auto-select all colors for next attribute if staying in color mode
        if (attributeType === 'color') {
            setTimeout(() => setSelectedColors(availableColors.map(c => c.id)), 0);
        }
    };

    const removeAttribute = (attributeId) => {
        setAttributes(attributes.filter(attr => attr.id !== attributeId));
    };

    const generateVariations = () => {
        if (attributes.length === 0) {
            setGeneratedVariations([]);
            return;
        }

        // Generate all combinations
        const combinations = generateCombinations(attributes);

        const variations = combinations.map((combination, index) => {
            const attributesArray = combination.map(item => ({
                name: item.attributeName,
                option: item.value
            }));

            return {
                attributes: JSON.stringify(attributesArray),
                attributeDisplay: combination.map(item =>
                    `${item.attributeName}: ${item.label}`
                ).join(', '),
                price: parseFloat(productPrice) || 0,
                regularPrice: parseFloat(productPrice) || 0,
                description: combination.map(item =>
                    `${item.attributeName}: ${item.label}`
                ).join(' - ')
            };
        });

        setGeneratedVariations(variations);
    };

    const generateCombinations = (attrs) => {
        if (attrs.length === 0) return [];
        if (attrs.length === 1) {
            return attrs[0].options.map(opt => [{
                attributeName: attrs[0].name,
                value: opt.value,
                label: opt.label
            }]);
        }

        const [first, ...rest] = attrs;
        const restCombinations = generateCombinations(rest);
        const result = [];

        for (const option of first.options) {
            for (const restCombo of restCombinations) {
                result.push([{
                    attributeName: first.name,
                    value: option.value,
                    label: option.label
                }, ...restCombo]);
            }
        }

        return result;
    };

    const handleSubmit = async () => {
        if (!productName || !productPrice) {
            showMessage('Vul minimaal productnaam en prijs in', 'warning');
            return;
        }

        if (attributes.length > 0 && generatedVariations.length === 0) {
            showMessage('Geen variaties gegenereerd', 'warning');
            return;
        }

        setLoading(true);
        try {
            const productData = {
                name: productName,
                sku: productSku || null,
                price: parseFloat(productPrice),
                description: productDescription,
                shortDescription: productShortDescription,
                variations: generatedVariations
            };

            await api.post('/admin/sync/products/create', productData);

            const message = generatedVariations.length > 0
                ? `Product "${productName}" succesvol aangemaakt met ${generatedVariations.length} variaties!`
                : `Product "${productName}" succesvol aangemaakt!`;

            showMessage(message, 'success');
            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Failed to create product:', error);
            showMessage('Fout bij aanmaken product: ' + (error.response?.data?.error || error.message), 'error');
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
        setAttributes([]);
        setGeneratedVariations([]);
        setShowAttributeForm(false);
        setAttributeName('');
        setSelectedColors([]);
        setTextOptions('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
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
                <Box display="flex" flexDirection="column" gap={3}>
                    {/* Product Basic Info */}
                    <Card variant="outlined">
                        <CardContent>
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
                        </CardContent>
                    </Card>

                    <Divider />

                    {/* Attributes Section */}
                    <Card variant="outlined">
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">
                                    Product Attributen
                                </Typography>
                                <Button
                                    size="small"
                                    startIcon={<AddIcon />}
                                    onClick={() => setShowAttributeForm(!showAttributeForm)}
                                    variant={showAttributeForm ? "outlined" : "contained"}
                                >
                                    {showAttributeForm ? 'Annuleer' : 'Attribuut Toevoegen'}
                                </Button>
                            </Box>

                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                Voeg attributen toe zoals "Kleur poten", "Kleur frame", "Uitvoering", etc.
                                Bij kleurattributen worden automatisch alle beschikbare kleuren geselecteerd.
                            </Typography>

                            {/* Add Attribute Form */}
                            {showAttributeForm && (
                                <Paper variant="outlined" sx={{ p: 2, mt: 2, mb: 2 }}>
                                    <Typography variant="subtitle2" color="primary" gutterBottom>
                                        Nieuw Attribuut
                                    </Typography>

                                    <Box display="flex" flexDirection="column" gap={2}>
                                        <ToggleButtonGroup
                                            value={attributeType}
                                            exclusive
                                            onChange={(e, val) => val && setAttributeType(val)}
                                            fullWidth
                                        >
                                            <ToggleButton value="color">
                                                <PaletteIcon sx={{ mr: 1 }} />
                                                Kleur Attribuut
                                            </ToggleButton>
                                            <ToggleButton value="text">
                                                <TextFieldsIcon sx={{ mr: 1 }} />
                                                Text Attribuut
                                            </ToggleButton>
                                        </ToggleButtonGroup>

                                        <TextField
                                            label="Attribuut naam"
                                            placeholder={attributeType === 'color' ? 'bijv. Kleur poten, Kleur frame' : 'bijv. Uitvoering, Type'}
                                            value={attributeName}
                                            onChange={(e) => setAttributeName(e.target.value)}
                                            fullWidth
                                        />

                                        {attributeType === 'color' ? (
                                            <Box>
                                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                                    <Typography variant="body2" color="textSecondary">
                                                        Selecteer kleuren (standaard zijn alle kleuren geselecteerd)
                                                    </Typography>
                                                    <Box display="flex" gap={1}>
                                                        <Button
                                                            size="small"
                                                            onClick={() => setSelectedColors(availableColors.map(c => c.id))}
                                                        >
                                                            Alles
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            onClick={() => setSelectedColors([])}
                                                        >
                                                            Geen
                                                        </Button>
                                                    </Box>
                                                </Box>
                                                <FormControl fullWidth>
                                                    <InputLabel>Geselecteerde kleuren ({selectedColors.length})</InputLabel>
                                                    <Select
                                                        multiple
                                                        value={selectedColors}
                                                        onChange={(e) => setSelectedColors(e.target.value)}
                                                        renderValue={(selected) => (
                                                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                                                                {selected.length === availableColors.length ? (
                                                                    <Chip
                                                                        label="Alle kleuren geselecteerd"
                                                                        size="small"
                                                                        color="primary"
                                                                    />
                                                                ) : (
                                                                    selected.map((colorId) => {
                                                                        const color = availableColors.find(c => c.id === colorId);
                                                                        return (
                                                                            <Chip
                                                                                key={colorId}
                                                                                label={color?.attributeName}
                                                                                size="small"
                                                                                sx={{
                                                                                    backgroundColor: color?.hexCode,
                                                                                    color: '#fff',
                                                                                    fontWeight: 'bold'
                                                                                }}
                                                                            />
                                                                        );
                                                                    })
                                                                )}
                                                            </Box>
                                                        )}
                                                    >
                                                        {availableColors.map((color) => (
                                                            <MenuItem key={color.id} value={color.id}>
                                                                <Checkbox checked={selectedColors.includes(color.id)} />
                                                                <Box display="flex" alignItems="center" gap={1}>
                                                                    <Box
                                                                        sx={{
                                                                            width: 24,
                                                                            height: 24,
                                                                            borderRadius: 1,
                                                                            backgroundColor: color.hexCode,
                                                                            border: '1px solid #ddd'
                                                                        }}
                                                                    />
                                                                    <ListItemText primary={color.attributeName} />
                                                                </Box>
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Box>
                                        ) : (
                                            <TextField
                                                label="Opties (één per regel)"
                                                placeholder="bijv.&#10;Hertog Jan&#10;Heineken&#10;Grolsch"
                                                multiline
                                                rows={4}
                                                value={textOptions}
                                                onChange={(e) => setTextOptions(e.target.value)}
                                                fullWidth
                                                helperText="Voer elke optie op een nieuwe regel in"
                                            />
                                        )}

                                        <Button
                                            variant="contained"
                                            color="success"
                                            onClick={addAttribute}
                                            fullWidth
                                        >
                                            Attribuut Toevoegen
                                        </Button>
                                    </Box>
                                </Paper>
                            )}

                            {/* Added Attributes List */}
                            {attributes.length > 0 && (
                                <Box mt={2}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Toegevoegde Attributen ({attributes.length})
                                    </Typography>
                                    <Box display="flex" flexDirection="column" gap={1}>
                                        {attributes.map((attr) => (
                                            <Paper key={attr.id} variant="outlined" sx={{ p: 2 }}>
                                                <Box display="flex" justifyContent="space-between" alignItems="start">
                                                    <Box flex={1}>
                                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                            {attr.type === 'color' ? (
                                                                <PaletteIcon fontSize="small" color="primary" />
                                                            ) : (
                                                                <TextFieldsIcon fontSize="small" color="primary" />
                                                            )}
                                                            <Typography variant="subtitle2">
                                                                {attr.name}
                                                            </Typography>
                                                        </Box>
                                                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                                                            {attr.options.map((opt, idx) => (
                                                                <Chip
                                                                    key={idx}
                                                                    label={opt.label}
                                                                    size="small"
                                                                    sx={attr.type === 'color' ? {
                                                                        backgroundColor: opt.hexCode,
                                                                        color: '#fff'
                                                                    } : {}}
                                                                />
                                                            ))}
                                                        </Box>
                                                    </Box>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => removeAttribute(attr.id)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                            </Paper>
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    {/* Generated Variations Preview */}
                    {generatedVariations.length > 0 && (
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Gegenereerde Variaties ({generatedVariations.length})
                                </Typography>
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    {generatedVariations.length} variatie(s) worden automatisch aangemaakt bij opslaan
                                </Alert>
                                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>#</TableCell>
                                                <TableCell>Attributen</TableCell>
                                                <TableCell align="right">Prijs</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {generatedVariations.map((variation, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {variation.attributeDisplay}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        €{variation.price.toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    )}

                    {attributes.length === 0 && !showAttributeForm && (
                        <Alert severity="info">
                            💡 Voeg attributen toe om automatisch variaties te genereren, of laat leeg voor automatische kleurvariaties
                        </Alert>
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
                    {loading ? 'Bezig...' : `Product Aanmaken ${generatedVariations.length > 0 ? `(${generatedVariations.length} variaties)` : ''}`}
                </Button>
            </DialogActions>

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

