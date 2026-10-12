import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import api from "../services/api";

/**
 * Dynamically load the Razorpay Checkout script if not already present on window.
 */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Checkout Page
 *
 * Provides a shipping details form, order summary, and Razorpay payment integration.
 * Flow:
 * 1. Validate shipping address inputs
 * 2. POST /orders/create-payment-order (ShopKart order + Razorpay order creation)
 * 3. Open Razorpay Checkout modal
 * 4. On payment success, POST /orders/verify-payment (HMAC signature verification)
 * 5. On verification success, clear cart and navigate to order-success page
 */
const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, loading, error, totalUnits, subtotal, fetchCart, clearCart } = useCart();

  // Controlled shipping form state
  const [shippingDetails, setShippingDetails] = useState({
    fullName: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Validation and payment processing states
  const [formErrors, setFormErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

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

    // Clear field-specific error as user types
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }

    // Clear general payment error if any
    if (paymentError) {
      setPaymentError("");
    }
  };

  /**
   * Validate shipping details form
   */
  const validateForm = () => {
    const errors = {};

    // 1. Full Name
    if (!shippingDetails.fullName || shippingDetails.fullName.trim() === "") {
      errors.fullName = "Full Name is required.";
    }

    // 2. Phone Number
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

    // 3. Address Line
    if (!shippingDetails.addressLine || shippingDetails.addressLine.trim() === "") {
      errors.addressLine = "Address Line is required.";
    }

    // 4. City
    if (!shippingDetails.city || shippingDetails.city.trim() === "") {
      errors.city = "City is required.";
    }

    // 5. State
    if (!shippingDetails.state || shippingDetails.state.trim() === "") {
      errors.state = "State is required.";
    }

    // 6. Pincode
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
   * Place Order & Razorpay Checkout handler
   */
  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0 || isProcessing) {
      return;
    }

    setPaymentError("");

    // 1. Validate form fields
    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    setIsProcessing(true);

    // 2. Dynamically load the Razorpay Checkout script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setIsProcessing(false);
      setPaymentError("Failed to load Razorpay payment gateway. Please check your connection.");
      return;
    }

    try {
      // 3. Call backend to create payment order
      const response = await api.post("/orders/create-payment-order", {
        shippingAddress: {
          fullName: shippingDetails.fullName.trim(),
          phone: shippingDetails.phone.trim(),
          addressLine: shippingDetails.addressLine.trim(),
          city: shippingDetails.city.trim(),
          state: shippingDetails.state.trim(),
          pincode: shippingDetails.pincode.trim(),
        },
      });

      const { order, razorpay: razorpayData } = response.data;
      const shopKartOrderId = order.id;

      // 4. Configure Razorpay options
      const options = {
        key: razorpayData.keyId,
        amount: razorpayData.amount,
        currency: razorpayData.currency,
        name: "ShopKart",
        description: "ShopKart Order Payment",
        order_id: razorpayData.orderId,
        prefill: {
          name: shippingDetails.fullName.trim(),
          contact: shippingDetails.phone.trim(),
        },
        theme: {
          color: "#111111",
        },
        // 5. Handler called by Razorpay upon successful payment authorization
        handler: async function (paymentResponse) {
          try {
            // 6. Call backend to verify HMAC signature
            const verifyRes = await api.post("/orders/verify-payment", {
              shopKartOrderId: shopKartOrderId,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });

            if (verifyRes.data?.success) {
              // 7. ONLY after successful signature verification:
              //    clear the frontend cart state immediately so
              //    the Navbar count drops to 0 before navigation.
              //    fetchCart() is intentionally NOT called here —
              //    the backend already cleared customer.cart, and
              //    the Navbar on the next page will re-sync on mount.
              clearCart();
              setIsProcessing(false);
              navigate(`/order-success/${shopKartOrderId}`, {
                state: {
                  orderId: shopKartOrderId,
                  order: verifyRes.data.order,
                },
              });
            } else {
              setIsProcessing(false);
              setPaymentError("Payment verification failed. Please contact support.");
            }
          } catch (verifyErr) {
            setIsProcessing(false);
            setPaymentError(
              verifyErr.response?.data?.message ||
              "Payment verification failed. Please contact support."
            );
          }
        },
        modal: {
          // 8. Handle modal dismissal / cancellation by user
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (failResponse) {
        setIsProcessing(false);
        setPaymentError(
          failResponse.error?.description || "Payment failed. Please try again."
        );
      });

      rzp.open();

    } catch (err) {
      setIsProcessing(false);
      setPaymentError(
        err.response?.data?.message || "Unable to initiate payment. Please try again."
      );
    }
  };

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
          <p>Please enter your shipping information and complete payment via Razorpay.</p>
        </header>

        <form onSubmit={handlePlaceOrder} noValidate>
          <div className="checkout-layout">
            {/* Left Column: Shipping Details Form */}
            <section className="checkout-section">
              <div className="checkout-section-header">
                <h2 className="checkout-section-title">Shipping Details</h2>
                <span className="checkout-step-badge">Step 1 of 2</span>
              </div>

              {/* Form-level validation error alert */}
              {Object.keys(formErrors).length > 0 && (
                <div className="error-alert" role="alert" style={{ marginBottom: "20px" }}>
                  Please fix the highlighted errors below before placing your order.
                </div>
              )}

              {/* Payment error alert */}
              {paymentError && (
                <div className="error-alert" role="alert" style={{ marginBottom: "20px" }}>
                  {paymentError}
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
                    disabled={isProcessing}
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
                    disabled={isProcessing}
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
                    disabled={isProcessing}
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
                    disabled={isProcessing}
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
                    disabled={isProcessing}
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
                    disabled={isProcessing}
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
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Place Order"}
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
