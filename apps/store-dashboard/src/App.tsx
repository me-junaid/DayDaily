import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Orders } from './pages/Orders';
import { OrderDetail } from './pages/OrderDetail';
import { Inventory } from './pages/Inventory';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
