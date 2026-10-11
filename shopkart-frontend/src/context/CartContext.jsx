import React, { createContext, useContext, useState, useCallback } from "react";
import api from "../services/api";

/**
 * CartContext
 *
 * Shared cart state across the entire application.
 * The backend (MongoDB) is the single source of truth.
 * Every mutation calls the API first, then updates local state
 * from the populated `cart` array returned in every response.
 */
const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Derived values (computed, never stored) ─────────────
  const totalUnits = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  // ── Fetch cart from backend ─────────────────────────────
  const fetchCart = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/cart");
      setCartItems(response.data.cart || []);
    } catch (err) {
      // Don't treat 401 as a cart error — the auth flow handles it
      if (err.response?.status === 401) {
        setCartItems([]);
        return;
      }
      setError("Unable to load your cart.");
      console.error("Cart fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Add product to cart ─────────────────────────────────
  const addToCart = useCallback(async (productId) => {
    const response = await api.post(`/cart/${productId}`);
    setCartItems(response.data.cart || []);
    return response.data;
  }, []);

  // ── Update quantity ─────────────────────────────────────
  const updateQuantity = useCallback(async (productId, quantity) => {
    const response = await api.patch(`/cart/${productId}`, { quantity });
    setCartItems(response.data.cart || []);
    return response.data;
  }, []);

  // ── Remove from cart ────────────────────────────────────
  const removeFromCart = useCallback(async (productId) => {
    const response = await api.delete(`/cart/${productId}`);
    setCartItems(response.data.cart || []);
    return response.data;
  }, []);

  // ── Check if a product is already in the cart ───────────
  const isInCart = useCallback(
    (productId) => cartItems.some((item) => item.product?._id === productId),
    [cartItems]
  );

  const value = {
    cartItems,
    loading,
    error,
    totalUnits,
    subtotal,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    isInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
