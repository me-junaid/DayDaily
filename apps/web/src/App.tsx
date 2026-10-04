import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { CartConfirm } from './pages/CartConfirm';
import { Checkout } from './pages/Checkout';
import { OrderTracking } from './pages/OrderTracking';
import { OrderHistory } from './pages/OrderHistory';
import { Login } from './pages/Login';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart-confirm" element={<CartConfirm />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders/:id" element={<OrderTracking />} />
        <Route path="/history" element={<OrderHistory />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
