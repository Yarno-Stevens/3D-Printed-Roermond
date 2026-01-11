import './index.css'
import Header from "./components/Header.jsx";
import {Route, Routes} from "react-router";
import Dashboard from "./Dashboard.jsx";
import OrderOverview from "./order/OrderOverview.jsx";
import ProductOverview from "./product/ProductOverview.jsx";
import ClientOverview from "./client/ClientOverview.jsx";
import SyncDashboard from "./sync/SyncDashboard.jsx";

function App() {
    return (
        <>
            <Header/>
            <div className="container mx-auto px-4">
                <Routes>
                    <Route path="/" element={<Dashboard/>}/>
                    <Route path="/orders" element={<OrderOverview/>}/>
                    <Route path="/products" element={<ProductOverview/>}/>
                    <Route path="/clients" element={<ClientOverview/>}/>
                    <Route path="/sync" element={<SyncDashboard/>}/>
                </Routes>
            </div>
        </>
    )
}

export default App
