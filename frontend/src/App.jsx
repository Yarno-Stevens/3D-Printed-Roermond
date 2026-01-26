import './index.css'
import Header from "./components/Header.jsx";
import {Route, Routes} from "react-router";
import Dashboard from "./Dashboard.jsx";
import OrderOverview from "./order/OrderOverview.jsx";
import ProductOverview from "./product/ProductOverview.jsx";
import CustomerOverview from "./customer/CustomerOverview.jsx";
import SyncDashboard from "./sync/SyncDashboard.jsx";
import CustomerDetail from "./customer/CustomerDetail.jsx";
import OrderDetail from "./order/OrderDetail.jsx";

function App() {
    return (
        <>
            <Header/>
            <div className="container mx-auto px-4">
                <Routes>
                    <Route path="/" element={<Dashboard/>}/>
                    <Route path="/orders" element={<OrderOverview/>}/>
                    <Route path="/products" element={<ProductOverview/>}/>
                    <Route path="/customers" element={<CustomerOverview/>}/>
                    <Route path="/sync" element={<SyncDashboard/>}/>
                    <Route path="/orders/:id" element={<OrderDetail />} />
                    <Route path="/customers/:id" element={<CustomerDetail />} />
                </Routes>
            </div>
        </>
    )
}

export default App
