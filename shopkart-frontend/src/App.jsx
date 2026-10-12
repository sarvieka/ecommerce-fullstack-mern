import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Lab 02 — Authentication pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

// Lab 03 — Product catalog pages
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";

// Lab 04 — Wishlist
import Wishlist from "./pages/Wishlist";

// Lab 05 — Cart
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import { CartProvider } from "./context/CartContext";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          {/* Auth routes  */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home"     element={<Home />} />

          {/* Product catalog routes  */}
          <Route path="/products"     element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />

          {/* Wishlist route */}
          <Route path="/wishlist" element={<Wishlist />} />

          {/* Cart route */}
          <Route path="/cart" element={<Cart />} />

          {/* Checkout route */}
          <Route path="/checkout" element={<Checkout />} />

          {/* Lab 06 — Order success route */}
          <Route path="/order-success/:orderId" element={<OrderSuccess />} />

          {/* Fallback */}
          <Route path="/"  element={<Navigate to="/login" replace />} />
          <Route path="*"  element={<Navigate to="/login" replace />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
