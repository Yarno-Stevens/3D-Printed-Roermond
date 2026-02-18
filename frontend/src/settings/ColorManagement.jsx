import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    DialogContentText
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Palette as PaletteIcon
} from '@mui/icons-material';
import api from '../utils/api';

export default function ColorManagement() {
    const [colors, setColors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingColor, setEditingColor] = useState(null);
    const [colorName, setColorName] = useState('');
    const [colorValue, setColorValue] = useState('');
    const [hexCode, setHexCode] = useState('#000000');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Delete confirmation dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [colorToDelete, setColorToDelete] = useState(null);

    useEffect(() => {
        loadColors();
    }, []);

    const loadColors = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/sync/colors');
            setColors(response.data);
        } catch (error) {
            showMessage('Fout bij laden kleuren: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleAdd = () => {
        setEditingColor(null);
        setColorName('');
        setColorValue('');
        setHexCode('#000000');
        setOpenDialog(true);
    };

    const handleEdit = (color) => {
        setEditingColor(color);
        setColorName(color.attributeName);
        setColorValue(color.attributeValue || color.attributeName.toLowerCase());
        setHexCode(color.hexCode || '#000000');
        setOpenDialog(true);
    };

    const handleSave = async () => {
        if (!colorName.trim()) {
            showMessage('Kleurnaam is verplicht', 'warning');
            return;
        }

        setLoading(true);
        try {
            const data = {
                attributeName: colorName,
                attributeValue: colorValue || colorName.toLowerCase(),
                hexCode: hexCode,
                sortOrder: editingColor?.sortOrder || 0
            };

            if (editingColor) {
                await api.put(`/admin/sync/colors/${editingColor.id}`, data);
                showMessage('Kleur bijgewerkt');
            } else {
                const response = await api.post('/admin/sync/colors', data);

                // Show detailed message from backend
                if (response.data && response.data.message) {
                    showMessage(response.data.message, 'success');
                } else if (response.data && response.data.addedToProducts !== undefined) {
                    const productsCount = response.data.addedToProducts || 0;
                    const variationsCount = response.data.totalVariationsAdded || 0;

                    if (productsCount > 0) {
                        showMessage(
                            `✅ Kleur toegevoegd en automatisch gekoppeld aan ${productsCount} product(en) (${variationsCount} nieuwe variaties)`,
                            'success'
                        );
                    } else {
                        showMessage('Kleur toegevoegd. Geen bestaande producten met kleurvariaties gevonden.', 'info');
                    }
                } else {
                    showMessage('Kleur toegevoegd');
                }
            }
            loadColors();
            setOpenDialog(false);
        } catch (error) {
            showMessage('Fout: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (color) => {
        setColorToDelete(color);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!colorToDelete) return;

        setLoading(true);
        try {
            await api.delete(`/admin/sync/colors/${colorToDelete.id}`);
            showMessage('Kleur en alle bijbehorende variaties verwijderd');
            loadColors();
            setDeleteDialogOpen(false);
            setColorToDelete(null);
        } catch (error) {
            showMessage('Fout: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setLoading(false);
        }
    };

    const cancelDelete = () => {
        setDeleteDialogOpen(false);
        setColorToDelete(null);
    };

    return (
        <Box p={3}>
            <Paper sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <PaletteIcon color="primary" sx={{ fontSize: 40 }} />
                        <Box>
                            <Typography variant="h4">
                                Kleuren Beheer
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Kleuren worden automatisch als variaties toegevoegd aan alle producten zonder WooCommerce ID
                            </Typography>
                        </Box>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAdd}
                        disabled={loading}
                    >
                        Kleur Toevoegen
                    </Button>
                </Box>

                <List>
                    {colors.map((color) => (
                        <ListItem key={color.id} divider>
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 1,
                                    backgroundColor: color.hexCode || '#cccccc',
                                    border: '2px solid #ddd',
                                    mr: 2
                                }}
                            />
                            <ListItemText
                                primary={color.attributeName}
                                secondary={
                                    <Box>
                                        <Typography variant="body2" component="span">
                                            {color.hexCode || 'Geen kleurcode'}
                                        </Typography>
                                        <Typography variant="caption" component="span" display="block">
                                            Toegevoegd op: {new Date(color.createdAt).toLocaleDateString('nl-NL')}
                                        </Typography>
                                    </Box>
                                }
                            />
                            <ListItemSecondaryAction>
                                <IconButton
                                    edge="end"
                                    onClick={() => handleEdit(color)}
                                    sx={{ mr: 1 }}
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    edge="end"
                                    onClick={() => handleDelete(color)}
                                    color="error"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>

                {colors.length === 0 && !loading && (
                    <Box textAlign="center" py={4}>
                        <Typography color="textSecondary">
                            Geen kleuren gevonden. Voeg een kleur toe om te beginnen.
                        </Typography>
                    </Box>
                )}
            </Paper>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingColor ? 'Kleur Bewerken' : 'Kleur Toevoegen'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        label="Kleurnaam"
                        fullWidth
                        value={colorName}
                        onChange={(e) => setColorName(e.target.value)}
                        sx={{ mt: 2 }}
                        placeholder="bijv. Rood, Blauw, Groen"
                    />
                    <TextField
                        label="Kleurwaarde (optioneel)"
                        fullWidth
                        value={colorValue}
                        onChange={(e) => setColorValue(e.target.value)}
                        sx={{ mt: 2 }}
                        placeholder="bijv. rood, blauw, groen (kleine letters)"
                        helperText="Wordt gebruikt voor filtering. Wordt automatisch gegenereerd als leeg gelaten."
                    />
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                            Hex kleurcode
                        </Typography>
                        <Box display="flex" alignItems="center" gap={2}>
                            <input
                                type="color"
                                value={hexCode}
                                onChange={(e) => setHexCode(e.target.value)}
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    border: '2px solid #ddd',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            />
                            <TextField
                                label="Hex Code"
                                value={hexCode}
                                onChange={(e) => setHexCode(e.target.value)}
                                placeholder="#000000"
                                sx={{ flex: 1 }}
                            />
                        </Box>
                    </Box>
                    {!editingColor && (
                        <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 2 }}>
                            Deze kleur wordt automatisch toegevoegd aan alle bestaande producten zonder WooCommerce ID
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>
                        Annuleren
                    </Button>
                    <Button onClick={handleSave} variant="contained" disabled={loading}>
                        {editingColor ? 'Bijwerken' : 'Toevoegen'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={cancelDelete}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Kleur Verwijderen
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Weet je zeker dat je de kleur <strong>"{colorToDelete?.attributeName}"</strong> wilt verwijderen?
                    </DialogContentText>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                            <strong>Let op:</strong> Alle productvariaties met deze kleur worden ook verwijderd.
                        </Typography>
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelDelete} disabled={loading}>
                        Annuleren
                    </Button>
                    <Button
                        onClick={confirmDelete}
                        variant="contained"
                        color="error"
                        disabled={loading}
                    >
                        {loading ? 'Bezig met verwijderen...' : 'Verwijderen'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

