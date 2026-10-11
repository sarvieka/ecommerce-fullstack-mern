import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";

/**
 * Checkout Page
 *
 * Provides a shipping details form and an order summary of current cart items.
 * Uses shared CartContext state to read items and calculate order total.
 * Controlled form inputs capture the customer's shipping address with validation.
 */
const Checkout = () => {
  const { cartItems, loading, error, totalUnits, subtotal, fetchCart } = useCart();

  // Controlled shipping form state
  const [shippingDetails, setShippingDetails] = useState({
    fullName: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
  });

  // State for field-level and form-level validation errors
  const [formErrors, setFormErrors] = useState({});
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Ensure cart is fetched on component mount
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Controlled input change handler: updates state and clears field error on user edit
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingDetails((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear the specific field error when the user updates/corrects the field
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  /**
   * Validate shipping details form
   *
   * Rules:
   * 1. No required field can be empty.
   * 2. Whitespace-only input must be treated as empty/invalid (.trim()).
   * 3. Phone must contain a valid number format (10-digit number).
   * 4. Pincode must contain exactly 6 digits.
   * 5. Returns boolean indicating validity.
   */
  const validateForm = () => {
    const errors = {};

    // 1. Full Name: required, non-empty after trimming
    if (!shippingDetails.fullName || shippingDetails.fullName.trim() === "") {
      errors.fullName = "Full Name is required.";
    }

    // 2. Phone Number: required, non-empty, and valid format
    const trimmedPhone = (shippingDetails.phone || "").trim();
    if (!trimmedPhone) {
      errors.phone = "Phone Number is required.";
    } else {
      const cleanedDigits = trimmedPhone.replace(/[\s\-()]/g, "");
      const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$|^\d{10}$/;
      if (!phoneRegex.test(cleanedDigits)) {
        errors.phone = "Phone Number must be a valid 10-digit number.";
      }
    }

    // 3. Address Line: required, non-empty after trimming
    if (!shippingDetails.addressLine || shippingDetails.addressLine.trim() === "") {
      errors.addressLine = "Address Line is required.";
    }

    // 4. City: required, non-empty after trimming
    if (!shippingDetails.city || shippingDetails.city.trim() === "") {
      errors.city = "City is required.";
    }

    // 5. State: required, non-empty after trimming
    if (!shippingDetails.state || shippingDetails.state.trim() === "") {
      errors.state = "State is required.";
    }

    // 6. Pincode: required, non-empty, exactly 6 digits
    const trimmedPincode = (shippingDetails.pincode || "").trim();
    if (!trimmedPincode) {
      errors.pincode = "Pincode is required.";
    } else if (!/^\d{6}$/.test(trimmedPincode)) {
      errors.pincode = "Pincode must contain 6 digits.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * "Place Order" submit handler
   *
   * Validates form inputs before proceeding.
   * If validation fails, halts immediately to prevent any API/backend call.
   */
  const handlePlaceOrder = (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      return;
    }

    // Validate inputs
    const isValid = validateForm();
    if (!isValid) {
      // Validation failed: halt and do NOT call any backend API
      return;
    }

    // Validation passed: proceed with order placement UI
    setOrderPlaced(true);
  };

  // ── Render: Order Success View ────────────────────────────
  if (orderPlaced) {
    return (
      <div className="checkout-page">
        <Navbar />
        <main className="checkout-container">
          <div className="state-container">
            <p className="state-eyebrow">Confirmation</p>
            <h1 className="state-title">Order Placed Successfully!</h1>
            <p className="state-sub">
              Thank you, <strong>{shippingDetails.fullName}</strong>. Your order of{" "}
              {totalUnits} {totalUnits === 1 ? "item" : "items"} totalling ₹
              {subtotal.toLocaleString("en-IN")} has been received.
            </p>

            <div className="order-confirmation-details">
              <h3>Shipping to:</h3>
              <p>
                {shippingDetails.fullName}
                <br />
                {shippingDetails.addressLine}
                <br />
                {shippingDetails.city}, {shippingDetails.state} — {shippingDetails.pincode}
                <br />
                Phone: {shippingDetails.phone}
              </p>
            </div>

            <div style={{ marginTop: "24px", display: "flex", gap: "16px", justifyContent: "center" }}>
              <Link to="/products" className="btn-primary">
                Continue Shopping
              </Link>
              <Link to="/home" className="btn-secondary">
                Return to Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Render: Loading State ─────────────────────────────────
  if (loading && cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <Navbar />
        <main className="checkout-container">
          <div className="state-container">
            <div className="loading-bar" />
            <p className="state-sub">Loading checkout details...</p>
          </div>
        </main>
      </div>
    );
  }

  // ── Render: Error State ───────────────────────────────────
  if (error && cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <Navbar />
        <main className="checkout-container">
          <div className="state-container">
            <p className="state-eyebrow">Error</p>
            <p className="state-title">Unable to load checkout</p>
            <p className="state-sub">Please return to your cart and try again.</p>
            <Link to="/cart" className="btn-primary" style={{ marginTop: "16px" }}>
              Back to Cart
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ── Render: Empty Cart State ──────────────────────────────
  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <Navbar />
        <main className="checkout-container">
          <div className="state-container">
            <p className="state-title">Your cart is empty 🛒</p>
            <p className="state-sub">
              You do not have any items to checkout. Add products to your cart to proceed.
            </p>
            <div style={{ marginTop: "20px", display: "flex", gap: "12px", justifyContent: "center" }}>
              <Link to="/products" className="btn-primary">
                Browse Products
              </Link>
              <Link to="/cart" className="btn-secondary">
                View Cart
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Render: Checkout Page ─────────────────────────────────
  return (
    <div className="checkout-page">
      <Navbar />
      <main className="checkout-container">
        {/* Page Header */}
        <header className="page-header">
          <p className="page-eyebrow">ShopKart — Order</p>
          <h1>Checkout</h1>
          <p>Please enter your shipping information and verify your order summary.</p>
        </header>

        <form onSubmit={handlePlaceOrder} noValidate>
          <div className="checkout-layout">
            {/* Left Column: Shipping Details Form */}
            <section className="checkout-section">
              <div className="checkout-section-header">
                <h2 className="checkout-section-title">Shipping Details</h2>
                <span className="checkout-step-badge">Step 1 of 2</span>
              </div>

              {/* Form-level error alert */}
              {Object.keys(formErrors).length > 0 && (
                <div className="error-alert" role="alert" style={{ marginBottom: "20px" }}>
                  Please fix the highlighted errors below before placing your order.
                </div>
              )}

              <div className="checkout-form-grid">
                {/* Full Name */}
                <div className="form-group grid-col-full">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="e.g. John Doe"
                    value={shippingDetails.fullName}
                    onChange={handleInputChange}
                    className={formErrors.fullName ? "input-error" : ""}
                  />
                  {formErrors.fullName && (
                    <span className="field-error-msg">{formErrors.fullName}</span>
                  )}
                </div>

                {/* Phone Number */}
                <div className="form-group grid-col-full">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={shippingDetails.phone}
                    onChange={handleInputChange}
                    className={formErrors.phone ? "input-error" : ""}
                  />
                  {formErrors.phone && (
                    <span className="field-error-msg">{formErrors.phone}</span>
                  )}
                </div>

                {/* Address Line */}
                <div className="form-group grid-col-full">
                  <label htmlFor="addressLine">Address Line</label>
                  <input
                    id="addressLine"
                    name="addressLine"
                    type="text"
                    placeholder="Street address, flat, suite, building, etc."
                    value={shippingDetails.addressLine}
                    onChange={handleInputChange}
                    className={formErrors.addressLine ? "input-error" : ""}
                  />
                  {formErrors.addressLine && (
                    <span className="field-error-msg">{formErrors.addressLine}</span>
                  )}
                </div>

                {/* City */}
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={shippingDetails.city}
                    onChange={handleInputChange}
                    className={formErrors.city ? "input-error" : ""}
                  />
                  {formErrors.city && (
                    <span className="field-error-msg">{formErrors.city}</span>
                  )}
                </div>

                {/* State */}
                <div className="form-group">
                  <label htmlFor="state">State</label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    placeholder="e.g. Maharashtra"
                    value={shippingDetails.state}
                    onChange={handleInputChange}
                    className={formErrors.state ? "input-error" : ""}
                  />
                  {formErrors.state && (
                    <span className="field-error-msg">{formErrors.state}</span>
                  )}
                </div>

                {/* Pincode */}
                <div className="form-group grid-col-full">
                  <label htmlFor="pincode">Pincode</label>
                  <input
                    id="pincode"
                    name="pincode"
                    type="text"
                    placeholder="e.g. 400001"
                    value={shippingDetails.pincode}
                    onChange={handleInputChange}
                    className={formErrors.pincode ? "input-error" : ""}
                  />
                  {formErrors.pincode && (
                    <span className="field-error-msg">{formErrors.pincode}</span>
                  )}
                </div>
              </div>
            </section>

            {/* Right Column: Order Summary */}
            <aside className="checkout-summary">
              <div className="checkout-summary-header">
                <h2 className="cart-summary-title">Order Summary</h2>
                <span className="checkout-item-count">
                  {totalUnits} {totalUnits === 1 ? "item" : "items"}
                </span>
              </div>

              {/* Items List */}
              <div className="checkout-items-list">
                {cartItems.map((item) => {
                  const product = item.product;
                  if (!product) return null;
                  const itemPrice = product.price || 0;
                  const itemTotal = itemPrice * item.quantity;

                  return (
                    <div className="checkout-item-row" key={product._id || item._id}>
                      <div className="checkout-item-image">
                        {product.image ? (
                          <img src={product.image} alt={product.name} />
                        ) : (
                          <div className="checkout-item-img-placeholder">No img</div>
                        )}
                      </div>
                      <div className="checkout-item-details">
                        <p className="checkout-item-name">{product.name}</p>
                        <p className="checkout-item-meta">
                          Qty: <span className="checkout-item-qty">{item.quantity}</span>
                          {" × "}
                          ₹{itemPrice.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="checkout-item-price">
                        ₹{itemTotal.toLocaleString("en-IN")}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Breakdown */}
              <div className="cart-summary-rows">
                <div className="cart-summary-row">
                  <span>Subtotal ({totalUnits} items)</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="cart-summary-row">
                  <span>Shipping</span>
                  <span className="cart-summary-free">Free</span>
                </div>
              </div>

              <hr className="cart-summary-divider" />

              {/* Total Amount */}
              <div className="cart-summary-row cart-summary-total">
                <span>Total amount</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>

              {/* Place Order Button */}
              <button
                type="submit"
                className="btn-primary checkout-place-order-btn"
              >
                Place Order
              </button>

              <p className="checkout-note">
                By placing your order, you agree to ShopKart&apos;s Terms and Conditions.
              </p>
            </aside>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Checkout;
