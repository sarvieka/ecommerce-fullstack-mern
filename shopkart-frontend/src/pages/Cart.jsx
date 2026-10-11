import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import api from "../services/api";

/**
 * Cart Page
 *
 * Displays the authenticated user's cart items with quantity controls,
 * remove actions, and an order summary panel.
 * All mutations go through CartContext which calls the backend API.
 */
const Cart = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    loading,
    error,
    totalUnits,
    subtotal,
    fetchCart,
    updateQuantity,
    removeFromCart,
  } = useCart();

  // Per-item loading states for quantity and remove actions
  const [itemLoading, setItemLoading] = useState({});
  // Per-item error messages
  const [itemErrors, setItemErrors] = useState({});

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ── Quantity change handler ─────────────────────────────
  const handleQuantityChange = async (productId, newQuantity, stock) => {
    if (newQuantity < 1 || newQuantity > stock) return;

    setItemLoading((prev) => ({ ...prev, [productId]: "quantity" }));
    setItemErrors((prev) => ({ ...prev, [productId]: "" }));

    try {
      await updateQuantity(productId, newQuantity);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      setItemErrors((prev) => ({
        ...prev,
        [productId]:
          err.response?.data?.message || "Could not update quantity.",
      }));
    } finally {
      setItemLoading((prev) => ({ ...prev, [productId]: null }));
    }
  };

  // ── Remove handler ──────────────────────────────────────
  const handleRemove = async (productId) => {
    setItemLoading((prev) => ({ ...prev, [productId]: "remove" }));
    setItemErrors((prev) => ({ ...prev, [productId]: "" }));

    try {
      await removeFromCart(productId);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      setItemErrors((prev) => ({
        ...prev,
        [productId]:
          err.response?.data?.message || "Could not remove item.",
      }));
    } finally {
      setItemLoading((prev) => ({ ...prev, [productId]: null }));
    }
  };

  // ── Render: Loading state ───────────────────────────────
  const renderContent = () => {
    if (loading) {
      return (
        <div className="state-container">
          <div className="loading-bar" />
          <p className="state-sub">Loading your cart...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="state-container">
          <p className="state-eyebrow">Error</p>
          <p className="state-title">Unable to load your cart.</p>
          <p className="state-sub">Check your connection and try again.</p>
          <button
            className="btn-primary"
            onClick={fetchCart}
            style={{ marginTop: "16px" }}
          >
            Try Again
          </button>
        </div>
      );
    }

    if (cartItems.length === 0) {
      return (
        <div className="state-container">
          <p className="state-title">Your cart is empty 🛒</p>
          <p className="state-sub">
            Looks like you haven't added anything yet. Start exploring our
            catalog to find products you'll love.
          </p>
          <Link
            to="/products"
            className="btn-primary"
            style={{ marginTop: "16px" }}
          >
            Browse Products
          </Link>
        </div>
      );
    }

    // ── Cart items + summary ────────────────────────────────
    return (
      <div className="cart-layout">
        {/* Cart items list */}
        <div className="cart-items">
          <p className="results-meta">
            {totalUnits} {totalUnits === 1 ? "item" : "items"} in your cart
          </p>

          <div className="cart-items-list">
            {cartItems.map((item) => {
              const product = item.product;
              if (!product) return null;

              const productId = product._id;
              const isUpdating = itemLoading[productId] === "quantity";
              const isRemoving = itemLoading[productId] === "remove";
              const itemError = itemErrors[productId];

              return (
                <div className="cart-item" key={productId}>
                  {/* Product image */}
                  <div className="cart-item-image-wrap">
                    {product.image ? (
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <div className="cart-item-img-placeholder">No image</div>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="cart-item-info">
                    <Link
                      to={`/products/${productId}`}
                      className="cart-item-name"
                    >
                      {product.name}
                    </Link>
                    <p className="cart-item-price">
                      ₹{product.price?.toLocaleString("en-IN")}
                    </p>
                    <p className="cart-item-stock">
                      {product.stock > 0
                        ? `${product.stock} in stock`
                        : "Out of stock"}
                    </p>

                    {/* Quantity controls */}
                    <div className="cart-item-qty-row">
                      <div className="quantity-row">
                        <button
                          className="qty-btn"
                          onClick={() =>
                            handleQuantityChange(
                              productId,
                              item.quantity - 1,
                              product.stock
                            )
                          }
                          disabled={
                            item.quantity <= 1 || isUpdating || isRemoving
                          }
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <input
                          className="qty-value"
                          type="number"
                          value={item.quantity}
                          readOnly
                          aria-label="Quantity"
                        />
                        <button
                          className="qty-btn"
                          onClick={() =>
                            handleQuantityChange(
                              productId,
                              item.quantity + 1,
                              product.stock
                            )
                          }
                          disabled={
                            item.quantity >= product.stock ||
                            isUpdating ||
                            isRemoving
                          }
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {isUpdating && (
                        <span className="cart-item-updating">Updating...</span>
                      )}
                    </div>

                    {/* Item line total */}
                    <p className="cart-item-line-total">
                      Subtotal: ₹
                      {(product.price * item.quantity).toLocaleString("en-IN")}
                    </p>

                    {/* Error message */}
                    {itemError && (
                      <p className="cart-item-error">{itemError}</p>
                    )}
                  </div>

                  {/* Remove button */}
                  <div className="cart-item-actions">
                    <button
                      className="cart-remove-btn"
                      onClick={() => handleRemove(productId)}
                      disabled={isRemoving || isUpdating}
                    >
                      {isRemoving ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order summary */}
        <aside className="cart-summary">
          <h2 className="cart-summary-title">Order Summary</h2>
          <div className="cart-summary-rows">
            <div className="cart-summary-row">
              <span>Items ({totalUnits})</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="cart-summary-row">
              <span>Shipping</span>
              <span className="cart-summary-free">Free</span>
            </div>
          </div>
          <hr className="cart-summary-divider" />
          <div className="cart-summary-row cart-summary-total">
            <span>Total</span>
            <span>₹{subtotal.toLocaleString("en-IN")}</span>
          </div>
          <button className="btn-primary cart-checkout-btn" disabled>
            Checkout
          </button>
          <p className="cart-checkout-note">
            Checkout functionality coming soon.
          </p>
        </aside>
      </div>
    );
  };

  return (
    <div className="cart-page">
      <Navbar />
      <main className="cart-container">
        {/* Page header */}
        <header className="page-header">
          <p className="page-eyebrow">ShopKart — Cart</p>
          <h1>Shopping Cart</h1>
          <p>Review and manage the items in your cart.</p>
        </header>

        {/* Cart content / states */}
        {renderContent()}
      </main>
    </div>
  );
};

export default Cart;
