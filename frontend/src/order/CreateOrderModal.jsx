import React, {useState, useEffect} from 'react';
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
    Autocomplete,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    InputAdornment,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    Select,
    MenuItem,
    InputLabel,
    Snackbar,
    Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
    ShoppingCart,
    PostAdd
} from '@mui/icons-material';
import api from '../utils/api';
import {useSnackbar} from '../utils/useSnackbar';

export default function CreateOrderModal({open, onClose, onSuccess}) {
    const {snackbar, showSuccess, showError, showWarning, handleClose: handleCloseSnackbar} = useSnackbar();

    // Customer state
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [useExistingCustomer, setUseExistingCustomer] = useState(true);
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerFirstName, setCustomerFirstName] = useState('');
    const [customerLastName, setCustomerLastName] = useState('');
    // New customer extra fields
    const [customerCompanyName, setCustomerCompanyName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [customerAddress2, setCustomerAddress2] = useState('');
    const [customerCity, setCustomerCity] = useState('');
    const [customerPostalCode, setCustomerPostalCode] = useState('');
    const [customerState, setCustomerState] = useState('');
    const [customerCountry, setCustomerCountry] = useState('');

    // Product state
    const [orderItems, setOrderItems] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedVariation, setSelectedVariation] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    // Variation filter state
    const [variationAttributes, setVariationAttributes] = useState({}); // {attributeName: selectedValue}
    const [availableAttributes, setAvailableAttributes] = useState([]); // List of unique attributes
    const [filteredVariations, setFilteredVariations] = useState([]);

    // Create product state
    const [showCreateProduct, setShowCreateProduct] = useState(false);
    const [newProductName, setNewProductName] = useState('');
    const [newProductSku, setNewProductSku] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [newProductDescription, setNewProductDescription] = useState('');

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            fetchProducts();
            fetchCustomers();
        }
    }, [open, searchQuery, customerSearchQuery]);

    // Extract available attributes when product is selected
    useEffect(() => {
        if (selectedProduct && selectedProduct.variations && selectedProduct.variations.length > 0) {
            extractAvailableAttributes();
        } else {
            setAvailableAttributes([]);
            setVariationAttributes({});
            setFilteredVariations([]);
        }
    }, [selectedProduct]);

    // Filter variations when attribute filters change
    useEffect(() => {
        if (selectedProduct && selectedProduct.variations) {
            filterVariations();
        }
    }, [variationAttributes, selectedProduct]);

    const extractAvailableAttributes = () => {
        const variations = selectedProduct.variations;
        const attributeMap = {};

        variations.forEach(variation => {
            try {
                const attrs = JSON.parse(variation.attributes);
                attrs.forEach(attr => {
                    if (!attributeMap[attr.name]) {
                        attributeMap[attr.name] = new Set();
                    }
                    attributeMap[attr.name].add(attr.option);
                });
            } catch (e) {
                // Skip invalid JSON
            }
        });

        // Convert to array format
        const attributes = Object.keys(attributeMap).map(name => ({
            name: name,
            options: Array.from(attributeMap[name]).sort()
        }));

        setAvailableAttributes(attributes);

        // Initialize filters to empty
        const initialFilters = {};
        attributes.forEach(attr => {
            initialFilters[attr.name] = '';
        });
        setVariationAttributes(initialFilters);
    };

    const filterVariations = () => {
        const variations = selectedProduct.variations;

        // If no filters set, show all
        const hasFilters = Object.values(variationAttributes).some(val => val !== '');

        if (!hasFilters) {
            setFilteredVariations(variations);
            setSelectedVariation(null);
            return;
        }

        // Filter based on selected attributes
        const filtered = variations.filter(variation => {
            try {
                const attrs = JSON.parse(variation.attributes);

                return Object.entries(variationAttributes).every(([attrName, selectedValue]) => {
                    if (selectedValue === '') return true; // No filter for this attribute

                    const varAttr = attrs.find(a => a.name === attrName);
                    return varAttr && varAttr.option === selectedValue;
                });
            } catch (e) {
                return false;
            }
        });

        setFilteredVariations(filtered);

        // Auto-select if only one match
        if (filtered.length === 1) {
            setSelectedVariation(filtered[0]);
        } else {
            setSelectedVariation(null);
        }
    };

    const handleAttributeChange = (attributeName, value) => {
        setVariationAttributes(prev => ({
            ...prev,
            [attributeName]: value
        }));
    };

    const fetchProducts = async () => {
        try {
            const response = await api.get('/admin/sync/products/search', {
                params: {query: searchQuery}
            });
            setProducts(response.data);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await api.get('/admin/sync/customers/search', {
                params: {query: customerSearchQuery}
            });
            setCustomers(response.data);
        } catch (error) {
            console.error('Failed to fetch customers:', error);
        }
    };

    const addProductToOrder = () => {
        if (!selectedProduct || quantity <= 0) return;

        // Determine which price and name to use
        let itemPrice = selectedProduct.price || 0;
        let itemName = selectedProduct.name;
        let productId = selectedProduct.id;
        let variationId = null;

        // If a variation is selected, use its details
        if (selectedVariation) {
            itemPrice = selectedVariation.price || selectedProduct.price || 0;
            itemName = `${selectedProduct.name} - ${parseVariationAttributes(selectedVariation.attributes)}`;
            variationId = selectedVariation.id;
        }

        // Check if item already exists (same product and variation)
        const existingItem = orderItems.find(item =>
            item.productId === productId && item.variationId === variationId
        );

        if (existingItem) {
            // Update quantity if product+variation already in order
            setOrderItems(orderItems.map(item =>
                item.productId === productId && item.variationId === variationId
                    ? {...item, quantity: item.quantity + quantity}
                    : item
            ));
        } else {
            // Add new item
            setOrderItems([...orderItems, {
                productId: productId,
                variationId: variationId,
                productName: itemName,
                quantity: quantity,
                price: itemPrice
            }]);
        }

        // Reset selection
        setSelectedProduct(null);
        setSelectedVariation(null);
        setQuantity(1);
        setSearchQuery('');
        setVariationAttributes({});
        setAvailableAttributes([]);
        setFilteredVariations([]);
    };

    const parseVariationAttributes = (attributesJson) => {
        if (!attributesJson) return '';
        try {
            const attrs = JSON.parse(attributesJson);
            return attrs.map(attr => `${attr.name}: ${attr.option}`).join(', ');
        } catch (e) {
            return attributesJson;
        }
    };

    const createProduct = async () => {
        if (!newProductName || !newProductPrice) {
            showWarning('Vul minimaal naam en prijs in');
            return;
        }

        try {
            const response = await api.post('/admin/sync/products/create', {
                name: newProductName,
                sku: newProductSku || null, // Send null if empty, backend will generate
                price: parseFloat(newProductPrice),
                description: newProductDescription,
                shortDescription: ''
            });

            const createdProduct = response.data.product;

            // Add to order directly
            setOrderItems([...orderItems, {
                productId: createdProduct.id,
                productName: createdProduct.name,
                quantity: 1,
                price: createdProduct.price || 0
            }]);

            // Reset create product form
            setNewProductName('');
            setNewProductSku('');
            setNewProductPrice('');
            setNewProductDescription('');
            setShowCreateProduct(false);

            // Refresh product list
            await fetchProducts();

            const skuMessage = newProductSku ?
                `Product aangemaakt met SKU: ${createdProduct.sku}` :
                `Product aangemaakt met automatische SKU: ${createdProduct.sku}`;
            showSuccess(`${skuMessage}. Product is toegevoegd aan de order!`);
        } catch (error) {
            console.error('Failed to create product:', error);
            showError('Fout bij aanmaken product: ' + (error.response?.data?.error || error.message));
        }
    };

    const removeItem = (productId, variationId) => {
        setOrderItems(orderItems.filter(item =>
            !(item.productId === productId && item.variationId === variationId)
        ));
    };

    const updateQuantity = (productId, variationId, newQuantity) => {
        if (newQuantity <= 0) {
            removeItem(productId, variationId);
            return;
        }
        setOrderItems(orderItems.map(item =>
            item.productId === productId && item.variationId === variationId
                ? {...item, quantity: newQuantity}
                : item
        ));
    };

    const calculateTotal = () => {
        return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
    };

    const handleSubmit = async () => {
        // Validation
        if (useExistingCustomer) {
            if (!selectedCustomer || orderItems.length === 0) {
                showWarning('Selecteer een klant en voeg minimaal 1 product toe');
                return;
            }
        } else {
            if (!customerEmail || !customerFirstName || orderItems.length === 0) {
                showWarning('Vul alle verplichte velden in en voeg minimaal 1 product toe');
                return;
            }
        }

        setLoading(true);
        try {
            const requestData = {
                items: orderItems
            };

            if (useExistingCustomer && selectedCustomer) {
                requestData.customerId = selectedCustomer.id;
            } else {
                requestData.customerEmail = customerEmail;
                requestData.customerFirstName = customerFirstName;
                requestData.customerLastName = customerLastName;
                requestData.customerCompanyName = customerCompanyName;
                requestData.customerPhone = customerPhone;
                requestData.customerAddress = customerAddress;
                requestData.customerAddress2 = customerAddress2;
                requestData.customerCity = customerCity;
                requestData.customerPostalCode = customerPostalCode;
                requestData.customerState = customerState;
                requestData.customerCountry = customerCountry;
            }

            await api.post('/admin/sync/orders/create', requestData);

            showSuccess('Order succesvol aangemaakt!');
            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Failed to create order:', error);
            showError('Fout bij aanmaken order: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedCustomer(null);
        setCustomers([]);
        setCustomerSearchQuery('');
        setUseExistingCustomer(true);
        setCustomerEmail('');
        setCustomerFirstName('');
        setCustomerLastName('');
        setCustomerCompanyName('');
        setCustomerPhone('');
        setCustomerAddress('');
        setCustomerAddress2('');
        setCustomerCity('');
        setCustomerPostalCode('');
        setCustomerState('');
        setCustomerCountry('');
        setOrderItems([]);
        setSelectedProduct(null);
        setSelectedVariation(null);
        setQuantity(1);
        setSearchQuery('');
        setVariationAttributes({});
        setAvailableAttributes([]);
        setFilteredVariations([]);
        setShowCreateProduct(false);
        setNewProductName('');
        setNewProductSku('');
        setNewProductPrice('');
        setNewProductDescription('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                        <ShoppingCart/>
                        <span>Nieuwe Order Aanmaken</span>
                    </Box>
                    <IconButton onClick={handleClose}>
                        <CloseIcon/>
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {/* Customer Info Section */}
                <Box mb={3}>
                    <Typography variant="h6" gutterBottom>
                        Klantgegevens
                    </Typography>
                    <FormControl component="fieldset" sx={{mb: 2}}>
                        <RadioGroup
                            row
                            value={useExistingCustomer.toString()}
                            onChange={(e) => setUseExistingCustomer(e.target.value === 'true')}
                        >
                            <FormControlLabel value="true" control={<Radio/>} label="Bestaande klant"/>
                            <FormControlLabel value="false" control={<Radio/>} label="Nieuwe klant"/>
                        </RadioGroup>
                    </FormControl>

                    {useExistingCustomer ? (
                        <Autocomplete
                            fullWidth
                            options={customers}
                            getOptionLabel={(option) => `${option.firstName} ${option.lastName} - ${option.email}`}
                            value={selectedCustomer}
                            onChange={(event, newValue) => setSelectedCustomer(newValue)}
                            inputValue={customerSearchQuery}
                            onInputChange={(event, newInputValue) => setCustomerSearchQuery(newInputValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Selecteer klant *"
                                    placeholder="Type om te zoeken..."
                                />
                            )}
                            renderOption={(props, option) => (
                                <li {...props}>
                                    <Box>
                                        <Typography variant="body1">
                                            {option.firstName} {option.lastName}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {option.email}
                                        </Typography>
                                    </Box>
                                </li>
                            )}
                        />
                    ) : (
                        <Box display="flex" flexDirection="column" gap={2}>
                            <TextField
                                label="Email"
                                type="email"
                                fullWidth
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                required
                            />
                            <Box display="flex" gap={2}>
                                <TextField
                                    label="Voornaam"
                                    fullWidth
                                    value={customerFirstName}
                                    onChange={(e) => setCustomerFirstName(e.target.value)}
                                    required
                                />
                                <TextField
                                    label="Achternaam"
                                    fullWidth
                                    value={customerLastName}
                                    onChange={(e) => setCustomerLastName(e.target.value)}
                                />
                            </Box>
                            <Box display="flex" gap={2}>
                                <TextField
                                    label="Bedrijfsnaam"
                                    fullWidth
                                    value={customerCompanyName}
                                    onChange={(e) => setCustomerCompanyName(e.target.value)}
                                />
                                <TextField
                                    label="Telefoon"
                                    fullWidth
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                />
                            </Box>
                            <TextField
                                label="Adres"
                                fullWidth
                                value={customerAddress}
                                onChange={(e) => setCustomerAddress(e.target.value)}
                                required
                            />
                            <TextField
                                label="Adres 2"
                                fullWidth
                                value={customerAddress2}
                                onChange={(e) => setCustomerAddress2(e.target.value)}
                            />
                            <Box display="flex" gap={2}>
                                <TextField
                                    label="Plaats"
                                    fullWidth
                                    value={customerCity}
                                    onChange={(e) => setCustomerCity(e.target.value)}
                                    required
                                />
                                <TextField
                                    label="Postcode"
                                    fullWidth
                                    value={customerPostalCode}
                                    onChange={(e) => setCustomerPostalCode(e.target.value)}
                                    required
                                />
                            </Box>
                            <Box display="flex" gap={2}>
                                <TextField
                                    label="Land"
                                    fullWidth
                                    value={customerCountry}
                                    onChange={(e) => setCustomerCountry(e.target.value)}
                                    required
                                />
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* Product Selection Section */}
                <Box mb={3}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">
                            Producten Toevoegen
                        </Typography>
                        <Button
                            size="small"
                            startIcon={<PostAdd/>}
                            onClick={() => setShowCreateProduct(!showCreateProduct)}
                        >
                            {showCreateProduct ? 'Bestaand product' : 'Nieuw product'}
                        </Button>
                    </Box>

                    {showCreateProduct ? (
                        // Create new product form
                        <Box display="flex" flexDirection="column" gap={2} p={2} border={1} borderColor="divider"
                             borderRadius={1}>
                            <Typography variant="subtitle2" color="primary">
                                Nieuw Product Aanmaken
                            </Typography>
                            <TextField
                                label="Product naam *"
                                fullWidth
                                value={newProductName}
                                onChange={(e) => setNewProductName(e.target.value)}
                                size="small"
                            />
                            <Box display="flex" gap={2}>
                                <TextField
                                    label="SKU (optioneel)"
                                    value={newProductSku}
                                    onChange={(e) => setNewProductSku(e.target.value)}
                                    size="small"
                                    sx={{flex: 1}}
                                    helperText="Leeg laten voor automatische generatie"
                                    placeholder="3DP-260201-A3F2"
                                />
                                <TextField
                                    label="Prijs *"
                                    type="number"
                                    value={newProductPrice}
                                    onChange={(e) => setNewProductPrice(e.target.value)}
                                    inputProps={{step: '0.01', min: '0'}}
                                    size="small"
                                    sx={{flex: 1}}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">€</InputAdornment>,
                                    }}
                                />
                            </Box>
                            <TextField
                                label="Omschrijving"
                                multiline
                                rows={2}
                                fullWidth
                                value={newProductDescription}
                                onChange={(e) => setNewProductDescription(e.target.value)}
                                size="small"
                            />
                            <Button
                                variant="contained"
                                color="success"
                                onClick={createProduct}
                                disabled={!newProductName || !newProductPrice}
                            >
                                Aanmaken & Toevoegen aan Order
                            </Button>
                        </Box>
                    ) : (
                        // Existing product selection
                        <Box display="flex" flexDirection="column" gap={2}>
                            <Box display="flex" gap={2} alignItems="flex-start">
                                <Autocomplete
                                    fullWidth
                                    options={products}
                                    getOptionLabel={(option) => `${option.name} - €${option.price}`}
                                    value={selectedProduct}
                                    onChange={(event, newValue) => {
                                        setSelectedProduct(newValue);
                                        setSelectedVariation(null); // Reset variation when product changes
                                    }}
                                    inputValue={searchQuery}
                                    onInputChange={(event, newInputValue) => setSearchQuery(newInputValue)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Zoek product"
                                            placeholder="Type om te zoeken..."
                                        />
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
                                    label="Aantal"
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                    inputProps={{min: 1}}
                                    sx={{width: 120}}
                                />
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon/>}
                                    onClick={addProductToOrder}
                                    disabled={!selectedProduct || (selectedProduct?.variations?.length > 0 && !selectedVariation)}
                                    sx={{height: 56}}
                                >
                                    Toevoegen
                                </Button>
                            </Box>

                            {/* Variation selector - only show if product has variations */}
                            {selectedProduct && selectedProduct.variations && selectedProduct.variations.length > 0 && (
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                        Variatie Filters
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                                        Selecteer opties om de variaties te filteren ({filteredVariations.length} van {selectedProduct.variations.length} variaties getoond)
                                    </Typography>

                                    {/* Attribute Filter Dropdowns */}
                                    <Box display="flex" flexDirection="column" gap={2} mb={2}>
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

                                    {filteredVariations.length === 0 && Object.values(variationAttributes).some(v => v !== '') && (
                                        <Alert severity="warning">
                                            Geen variaties gevonden met de geselecteerde filters. Pas je filters aan.
                                        </Alert>
                                    )}
                                </Box>
                            )}
                        </Box>
                    )}
                </Box>

                {/* Order Items Table */}
                {orderItems.length > 0 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Order Items
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
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
                                    {orderItems.map((item, index) => (
                                        <TableRow key={`${item.productId}-${item.variationId || 'base'}-${index}`}>
                                            <TableCell>{item.productName}</TableCell>
                                            <TableCell align="right">€{item.price.toFixed(2)}</TableCell>
                                            <TableCell align="center">
                                                <TextField
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateQuantity(item.productId, item.variationId, parseInt(e.target.value) || 0)}
                                                    inputProps={{min: 1}}
                                                    size="small"
                                                    sx={{width: 80}}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                €{(item.price * item.quantity).toFixed(2)}
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => removeItem(item.productId, item.variationId)}
                                                >
                                                    <DeleteIcon/>
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell colSpan={3} align="right">
                                            <Typography variant="h6">Totaal:</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="h6" color="primary">
                                                €{calculateTotal()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell/>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {orderItems.length === 0 && (
                    <Box textAlign="center" py={3}>
                        <Typography color="textSecondary">
                            Nog geen producten toegevoegd
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Annuleren
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={
                        loading ||
                        orderItems.length === 0 ||
                        (useExistingCustomer ? !selectedCustomer : (!customerEmail || !customerFirstName))
                    }
                >
                    {loading ? 'Bezig...' : 'Order Aanmaken'}
                </Button>
            </DialogActions>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{width: '100%'}}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Dialog>
    );
}

