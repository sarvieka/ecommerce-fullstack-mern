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
import { CartProvider } from "./context/CartContext";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          {/* Auth routes (Lab 02) */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home"     element={<Home />} />

          {/* Product catalog routes (Lab 03) */}
          <Route path="/products"     element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />

          {/* Wishlist route (Lab 04) */}
          <Route path="/wishlist" element={<Wishlist />} />

          {/* Cart route (Lab 05) */}
          <Route path="/cart" element={<Cart />} />

          {/* Fallback */}
          <Route path="/"  element={<Navigate to="/login" replace />} />
          <Route path="*"  element={<Navigate to="/login" replace />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
