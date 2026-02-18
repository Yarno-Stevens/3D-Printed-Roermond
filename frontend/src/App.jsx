import './index.css'
import Header from "./components/Header.jsx";
import {Route, Routes, Navigate} from "react-router";
import Dashboard from "./Dashboard.jsx";
import OrderOverview from "./order/OrderOverview.jsx";
import ProductOverview from "./product/ProductOverview.jsx";
import CustomerOverview from "./customer/CustomerOverview.jsx";
import ExpenseOverview from "./expense/ExpenseOverview.jsx";
import SyncDashboard from "./sync/SyncDashboard.jsx";
import CustomerDetail from "./customer/CustomerDetail.jsx";
import OrderDetail from "./order/OrderDetail.jsx";
import ProductDetail from "./product/ProductDetail.jsx";
import ColorManagement from "./settings/ColorManagement.jsx";
import Login from "./Login.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function App() {
    const token = localStorage.getItem('token');

    return (
        <Routes>
            <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />

            <Route path="*" element={
                <ProtectedRoute>
                    <>
                        <Header/>
                        <div className="container mx-auto px-4">
                            <Routes>
                                <Route path="/" element={<Dashboard/>}/>
                                <Route path="/orders" element={<OrderOverview/>}/>
                                <Route path="/products" element={<ProductOverview/>}/>
                                <Route path="/customers" element={<CustomerOverview/>}/>
                                <Route path="/expenses" element={<ExpenseOverview/>}/>
                                <Route path="/sync" element={<SyncDashboard/>}/>
                                <Route path="/orders/:id" element={<OrderDetail />} />
                                <Route path="/customers/:id" element={<CustomerDetail />} />
                                <Route path="/products/:id" element={<ProductDetail />} />
                                <Route path="/settings/colors" element={<ColorManagement />} />
                            </Routes>
                        </div>
                    </>
                </ProtectedRoute>
            } />
        </Routes>
    )
}

export default App
