import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import api from '../utils/api';
import { useSnackbar } from '../utils/useSnackbar';
import EditOrderModal from './EditOrderModal';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    Grid,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert,
    IconButton,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
import {
    ArrowBack,
    Person,
    Email,
    Phone,
    Home,
    LocalShipping,
    Receipt,
    AccessTime,
    Sync,
    PictureAsPdf,
    Download,
    Edit,
    Delete
    } from '@mui/icons-material';


export default function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { snackbar, showError, handleClose: handleCloseSnackbar } = useSnackbar();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchOrderDetail();
    }, [id]);

    const fetchOrderDetail = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/sync/orders/${id}`);
            setOrder(response.data);
            setError(null);
        } catch (err) {
            setError('Fout bij ophalen van order details: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        try {
            const response = await api.get(`/admin/sync/orders/${id}/pdf`, {
                responseType: 'blob'
            });

            // Create a blob URL and trigger download
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `order-${order.orderNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download PDF:', error);
            showError('Fout bij downloaden PDF: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleDeleteOrder = async () => {
        setDeleting(true);
        try {
            await api.delete(`/admin/sync/orders/${id}`);

            // Show success message and navigate back
            navigate('/orders', {
                state: { message: `Order #${order.orderNumber} succesvol verwijderd` }
            });
        } catch (error) {
            console.error('Failed to delete order:', error);
            showError('Fout bij verwijderen order: ' + (error.response?.data?.error || error.message));
            setDeleteDialogOpen(false);
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('nl-NL');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const getStatusColor = (status) => {
        const statusColors = {
            'pending': 'warning',
            'processing': 'info',
            'on-hold': 'default',
            'completed': 'success',
            'cancelled': 'error',
            'refunded': 'error',
            'failed': 'error'
        };
        return statusColors[status] || 'default';
    };

    const getStatusLabel = (status) => {
        const statusLabels = {
            'pending': 'In Afwachting',
            'processing': 'In Behandeling',
            'on-hold': 'In de Wacht',
            'completed': 'Voltooid',
            'cancelled': 'Geannuleerd',
            'refunded': 'Terugbetaald',
            'failed': 'Mislukt'
        };
        return statusLabels[status] || status;
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
                <Alert severity="error">{error}</Alert>
                <Button startIcon={<ArrowBack />} onClick={() => navigate('/orders')} sx={{ mt: 2 }}>
                    Terug naar Orders
                </Button>
            </Box>
        );
    }

    if (!order) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="warning">Order niet gevonden</Alert>
                <Button startIcon={<ArrowBack />} onClick={() => navigate('/orders')} sx={{ mt: 2 }}>
                    Terug naar Orders
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <IconButton onClick={() => navigate('/orders')}>
                        <ArrowBack />
                    </IconButton>
                    <Box>
                        <Typography variant="h4">Order #{order.orderNumber}</Typography>
                        {order.wooCommerceId && (
                            <Typography variant="body2" color="textSecondary">
                                WooCommerce ID: {order.wooCommerceId}
                            </Typography>
                        )}
                    </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                    {!order.wooCommerceId && (
                        <>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<Delete />}
                                onClick={() => setDeleteDialogOpen(true)}
                            >
                                Verwijderen
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<Edit />}
                                onClick={() => setEditModalOpen(true)}
                            >
                                Bewerken
                            </Button>
                        </>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<PictureAsPdf />}
                        onClick={handleDownloadPdf}
                    >
                        Download PDF
                    </Button>
                    <Chip
                        label={getStatusLabel(order.status)}
                        color={getStatusColor(order.status)}
                        size="large"
                    />
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Order Informatie */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <Receipt sx={{ verticalAlign: 'middle', mr: 1 }} />
                                Order Informatie
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        Order Nummer
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {order.orderNumber}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        Status
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {getStatusLabel(order.status)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        <AccessTime fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                        Aangemaakt
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatDate(order.createdAt)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        <Sync fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                        Gesynchroniseerd
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatDate(order.syncedAt)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }} />
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        Totaal Bedrag
                                    </Typography>
                                    <Typography variant="h5" color="primary" fontWeight="bold">
                                        {formatCurrency(order.total)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        Aantal Items
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold">
                                        {order.itemsCount || 0}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Producten ({order.items.length})
                                </Typography>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Product</TableCell>
                                                <TableCell align="center">Aantal</TableCell>
                                                <TableCell align="right">Totaal</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {order.items.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="bold">
                                                                {item.productName}
                                                            </Typography>

                                                            {/* Display metadata/addons */}
                                                            {item.metadata && item.metadata.length > 0 && (
                                                                <Box mt={1} pl={2} sx={{
                                                                    borderLeft: '3px solid',
                                                                    borderColor: 'primary.light',
                                                                    bgcolor: 'grey.50',
                                                                    p: 1,
                                                                    borderRadius: 1
                                                                }}>
                                                                    {item.metadata.map((meta, metaIndex) => (
                                                                        <Box key={metaIndex} mb={0.5}>
                                                                            <Typography
                                                                                variant="caption"
                                                                                component="div"
                                                                                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                                                                            >
                                                                                <strong>{meta.displayKey || meta.key}:</strong>
                                                                                <Chip
                                                                                    label={meta.displayValue || meta.value}
                                                                                    size="small"
                                                                                    variant="outlined"
                                                                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                                                                />
                                                                            </Typography>
                                                                        </Box>
                                                                    ))}
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={`${item.quantity}x`}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography fontWeight="bold" variant="body1">
                                                            {formatCurrency(item.total)}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {/* Subtotal Row */}
                                            <TableRow>
                                                <TableCell colSpan={2} align="right">
                                                    <Typography variant="body1">
                                                        Subtotaal:
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body1">
                                                        {formatCurrency(order.subtotal || order.total)}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                            {/* Discount Row (if applicable) */}
                                            {order.discountPercentage > 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={2} align="right">
                                                        <Typography variant="body1" color="success.main">
                                                            Korting ({Number(order.discountPercentage).toFixed(2)}%):
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body1" color="success.main">
                                                            -{formatCurrency(order.discountAmount)}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {/* Total Row */}
                                            <TableRow>
                                                <TableCell colSpan={2} align="right">
                                                    <Typography variant="h6" fontWeight="bold">
                                                        Totaal:
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="h6" fontWeight="bold" color="primary">
                                                        {formatCurrency(order.total)}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    )}
                </Grid>

                {/* Klant Informatie */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <Person sx={{ verticalAlign: 'middle', mr: 1 }} />
                                Klant Informatie
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            
                            {order.customer ? (
                                <Box>
                                    <Box mb={2}>
                                        <Typography variant="body2" color="textSecondary" gutterBottom>
                                            Naam
                                        </Typography>
                                        <Typography variant="body1" fontWeight="bold">
                                            {order.customer.firstName} {order.customer.lastName}
                                        </Typography>
                                    </Box>

                                    <Box mb={2}>
                                        <Typography variant="body2" color="textSecondary" gutterBottom>
                                            <Email fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                            Email
                                        </Typography>
                                        <Typography variant="body1">
                                            {order.customer.email}
                                        </Typography>
                                    </Box>

                                    <Divider sx={{ my: 2 }} />

                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        onClick={() => navigate(`/customers/${order.customer.id}`)}
                                    >
                                        Bekijk Klantprofiel
                                    </Button>
                                </Box>
                            ) : (
                                <Box>
                                    <Alert severity="info">Gastbestelling - geen klantgegevens beschikbaar</Alert>
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    {/* Adres Informatie (als beschikbaar) */}
                    {order.shippingAddress && (
                        <Card sx={{ mt: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    <LocalShipping sx={{ verticalAlign: 'middle', mr: 1 }} />
                                    Verzendadres
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="body2">
                                    {order.shippingAddress.address1}<br />
                                    {order.shippingAddress.address2 && <>{order.shippingAddress.address2}<br /></>}
                                    {order.shippingAddress.postcode} {order.shippingAddress.city}<br />
                                    {order.shippingAddress.country}
                                </Typography>
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Grid>

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

            {/* Edit Order Modal */}
            <EditOrderModal
                open={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                onSuccess={() => {
                    fetchOrderDetail();
                    setEditModalOpen(false);
                }}
                order={order}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => !deleting && setDeleteDialogOpen(false)}
            >
                <DialogTitle>
                    Order Verwijderen
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Weet je zeker dat je order <strong>#{order?.orderNumber}</strong> wilt verwijderen?
                        <br /><br />
                        Deze actie kan niet ongedaan worden gemaakt.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setDeleteDialogOpen(false)}
                        disabled={deleting}
                    >
                        Annuleren
                    </Button>
                    <Button
                        onClick={handleDeleteOrder}
                        color="error"
                        variant="contained"
                        disabled={deleting}
                        startIcon={deleting ? <CircularProgress size={20} /> : <Delete />}
                    >
                        {deleting ? 'Verwijderen...' : 'Verwijderen'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
