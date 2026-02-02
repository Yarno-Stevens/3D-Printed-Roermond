import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    InputAdornment,
    Snackbar
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh,
    FilterList
} from '@mui/icons-material';

export default function ExpensesOverview() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [totalExpenses, setTotalExpenses] = useState(0);

    // Modal states
    const [modalOpen, setModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    // Form states
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [supplier, setSupplier] = useState('');
    const [notes, setNotes] = useState('');
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

    // Filter states
    const [categoryFilter, setCategoryFilter] = useState('');
    const [supplierFilter, setSupplierFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Categories and suppliers
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    // Stats
    const [stats, setStats] = useState(null);

    // Snackbar state
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' // 'success' | 'error' | 'warning' | 'info'
    });

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        expenseId: null
    });

    useEffect(() => {
        fetchExpenses();
        fetchCategories();
        fetchSuppliers();
        fetchStats();
    }, [page, rowsPerPage, categoryFilter, supplierFilter]);

    const showMessage = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                size: rowsPerPage,
                category: categoryFilter || undefined,
                supplier: supplierFilter || undefined
            };

            const response = await api.get('/admin/sync/expenses', { params });
            setExpenses(response.data.content || []);
            setTotalExpenses(response.data.totalElements || 0);
            setError(null);
        } catch (err) {
            setError('Fout bij ophalen van uitgaven: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/admin/sync/expenses/categories');
            setCategories(response.data || []);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await api.get('/admin/sync/expenses/suppliers');
            setSuppliers(response.data || []);
        } catch (err) {
            console.error('Failed to fetch suppliers:', err);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/sync/expenses/stats');
            setStats(response.data);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    };

    const handleOpenModal = (expense = null) => {
        if (expense) {
            setEditingExpense(expense);
            setDescription(expense.description);
            setAmount(expense.amount.toString());
            setCategory(expense.category);
            setSupplier(expense.supplier || '');
            setNotes(expense.notes || '');
            setExpenseDate(expense.expenseDate.split('T')[0]);
        } else {
            setEditingExpense(null);
            resetForm();
        }
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingExpense(null);
        resetForm();
    };

    const resetForm = () => {
        setDescription('');
        setAmount('');
        setCategory('');
        setSupplier('');
        setNotes('');
        setExpenseDate(new Date().toISOString().split('T')[0]);
    };

    const handleSubmit = async () => {
        if (!description || !amount || !category) {
            showMessage('Vul minimaal omschrijving, bedrag en categorie in', 'warning');
            return;
        }

        try {
            const data = {
                description,
                amount: parseFloat(amount),
                category,
                supplier: supplier || null,
                notes: notes || null,
                expenseDate: new Date(expenseDate + 'T12:00:00').toISOString()
            };

            if (editingExpense) {
                await api.put(`/admin/sync/expenses/${editingExpense.id}`, data);
                showMessage('Uitgave bijgewerkt!', 'success');
            } else {
                await api.post('/admin/sync/expenses', data);
                showMessage('Uitgave toegevoegd!', 'success');
            }

            handleCloseModal();
            fetchExpenses();
            fetchCategories();
            fetchSuppliers();
            fetchStats();
        } catch (error) {
            console.error('Failed to save expense:', error);
            showMessage('Fout bij opslaan: ' + (error.response?.data?.error || error.message), 'error');
        }
    };

    const handleDelete = async (id) => {
        setConfirmDialog({ open: true, expenseId: id });
    };

    const handleConfirmDelete = async () => {
        const id = confirmDialog.expenseId;
        setConfirmDialog({ open: false, expenseId: null });

        try {
            await api.delete(`/admin/sync/expenses/${id}`);
            showMessage('Uitgave verwijderd!', 'success');
            fetchExpenses();
            fetchStats();
        } catch (error) {
            console.error('Failed to delete expense:', error);
            showMessage('Fout bij verwijderen: ' + (error.response?.data?.error || error.message), 'error');
        }
    };

    const handleCancelDelete = () => {
        setConfirmDialog({ open: false, expenseId: null });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('nl-NL');
    };

    const getCategoryColor = (category) => {
        const colors = {
            'Materialen': 'primary',
            'Tools': 'secondary',
            'Onderhoud': 'warning',
            'Software': 'info',
            'Marketing': 'success',
            'Overig': 'default'
        };
        return colors[category] || 'default';
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Uitgaven</Typography>
                <Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenModal()}
                        sx={{ mr: 1 }}
                    >
                        Nieuwe Uitgave
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchExpenses}
                    >
                        Ververs
                    </Button>
                </Box>
            </Box>

            {/* Stats Cards */}
            {stats && (
                <Grid container spacing={2} mb={3}>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Totaal Uitgaven
                                </Typography>
                                <Typography variant="h5">
                                    {formatCurrency(stats.totalExpenses)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom>
                                    Aantal Uitgaven
                                </Typography>
                                <Typography variant="h5">
                                    {stats.expenseCount}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Button
                            variant="outlined"
                            startIcon={<FilterList />}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            {showFilters ? 'Verberg Filters' : 'Toon Filters'}
                        </Button>

                        {showFilters && (
                            <>
                                <FormControl sx={{ minWidth: 200 }}>
                                    <InputLabel>Categorie</InputLabel>
                                    <Select
                                        value={categoryFilter}
                                        label="Categorie"
                                        variant="outlined"
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                    >
                                        <MenuItem value="">Alle</MenuItem>
                                        {categories.map(cat => (
                                            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl sx={{ minWidth: 200 }}>
                                    <InputLabel>Leverancier</InputLabel>
                                    <Select
                                        value={supplierFilter}
                                        label="Leverancier"
                                        variant="outlined"
                                        onChange={(e) => setSupplierFilter(e.target.value)}
                                    >
                                        <MenuItem value="">Alle</MenuItem>
                                        {suppliers.map(sup => (
                                            <MenuItem key={sup} value={sup}>{sup}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        setCategoryFilter('');
                                        setSupplierFilter('');
                                    }}
                                >
                                    Wis Filters
                                </Button>
                            </>
                        )}
                    </Box>
                </CardContent>
            </Card>

            {/* Expenses Table */}
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
                                            <TableCell>Datum</TableCell>
                                            <TableCell>Omschrijving</TableCell>
                                            <TableCell>Categorie</TableCell>
                                            <TableCell>Leverancier</TableCell>
                                            <TableCell align="right">Bedrag</TableCell>
                                            <TableCell align="center">Acties</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {expenses.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center">
                                                    <Typography color="textSecondary" sx={{ py: 3 }}>
                                                        Geen uitgaven gevonden
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            expenses.map((expense) => (
                                                <TableRow key={expense.id} hover>
                                                    <TableCell>
                                                        {formatDate(expense.expenseDate)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {expense.description}
                                                        </Typography>
                                                        {expense.notes && (
                                                            <Typography variant="caption" color="textSecondary">
                                                                {expense.notes}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={expense.category}
                                                            size="small"
                                                            color={getCategoryColor(expense.category)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {expense.supplier || '-'}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" fontWeight="bold" color="error">
                                                            {formatCurrency(expense.amount)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Tooltip title="Bewerken">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleOpenModal(expense)}
                                                            >
                                                                <EditIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Verwijderen">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleDelete(expense.id)}
                                                            >
                                                                <DeleteIcon fontSize="small" />
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
                                count={totalExpenses}
                                page={page}
                                onPageChange={(e, newPage) => setPage(newPage)}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={(e) => {
                                    setRowsPerPage(parseInt(e.target.value, 10));
                                    setPage(0);
                                }}
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

            {/* Create/Edit Modal */}
            <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingExpense ? 'Uitgave Bewerken' : 'Nieuwe Uitgave'}
                </DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} mt={1}>
                        <TextField
                            label="Omschrijving *"
                            fullWidth
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        <TextField
                            label="Bedrag *"
                            type="number"
                            fullWidth
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            inputProps={{ step: '0.01', min: '0' }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">€</InputAdornment>
                            }}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Categorie *</InputLabel>
                            <Select
                                value={category}
                                label="Categorie *"
                                variant="outlined"
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <MenuItem value="Materialen">Materialen</MenuItem>
                                <MenuItem value="Tools">Tools</MenuItem>
                                <MenuItem value="Onderhoud">Onderhoud</MenuItem>
                                <MenuItem value="Software">Software</MenuItem>
                                <MenuItem value="Marketing">Marketing</MenuItem>
                                <MenuItem value="Overig">Overig</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="Leverancier"
                            fullWidth
                            value={supplier}
                            onChange={(e) => setSupplier(e.target.value)}
                        />
                        <TextField
                            label="Datum"
                            type="date"
                            fullWidth
                            value={expenseDate}
                            onChange={(e) => setExpenseDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Notities"
                            multiline
                            rows={3}
                            fullWidth
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal}>Annuleren</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={!description || !amount || !category}
                    >
                        {editingExpense ? 'Bijwerken' : 'Toevoegen'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmDialog.open}
                onClose={handleCancelDelete}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Uitgave Verwijderen</DialogTitle>
                <DialogContent>
                    <Typography>
                        Weet je zeker dat je deze uitgave wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
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

            {/* Snackbar for notifications */}
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
        </Box>
    );
}

