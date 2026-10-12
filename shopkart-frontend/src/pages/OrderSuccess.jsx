import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

/**
 * OrderSuccess page
 *
 * Rendered at /order-success/:orderId after a successful Razorpay payment.
 *
 * The order ID is read from the URL param (:orderId).
 * Additional order details (totalAmount, status) are read from
 * React Router location.state, which Checkout.jsx passes via navigate().
 */
const OrderSuccess = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // location.state is passed by Checkout.jsx on navigation
  const order = location.state?.order || null;

  return (
    <>
      <Navbar />
      <div className="order-success-page">
        {/* ── Success card ───────────────────────────────── */}
        <div className="order-success-card">
          {/* Animated checkmark */}
          <div className="order-success-icon" aria-hidden="true">
            <svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg">
              <circle className="order-success-circle" cx="26" cy="26" r="25" fill="none" />
              <path  className="order-success-check"  fill="none"
                     d="M14 27 l8 8 l16-16" />
            </svg>
          </div>

          <h1 className="order-success-heading">Order Placed Successfully!</h1>

          <p className="order-success-sub">
            Thank you for shopping with <strong>ShopKart</strong>. Your payment
            has been confirmed and your order is being processed.
          </p>

          {/* ── Order meta ─────────────────────────────────── */}
          <div className="order-success-meta">
            <div className="order-success-meta-row">
              <span className="order-success-meta-label">Order ID</span>
              <span className="order-success-meta-value order-success-id">
                {orderId}
              </span>
            </div>

            {order?.totalAmount != null && (
              <div className="order-success-meta-row">
                <span className="order-success-meta-label">Amount Paid</span>
                <span className="order-success-meta-value">
                  ₹{order.totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
            )}

            <div className="order-success-meta-row">
              <span className="order-success-meta-label">Payment Status</span>
              <span className="order-success-badge">Paid ✓</span>
            </div>

            {order?.status && (
              <div className="order-success-meta-row">
                <span className="order-success-meta-label">Order Status</span>
                <span className="order-success-meta-value">
                  {order.status.replace(/_/g, " ")}
                </span>
              </div>
            )}
          </div>

          {/* ── Actions ────────────────────────────────────── */}
          <div className="order-success-actions">
            <button
              id="btn-continue-shopping"
              className="order-success-btn-primary"
              onClick={() => navigate("/products")}
            >
              Continue Shopping
            </button>
          </div>

          {/* ── Note: Order History not yet implemented ─────── */}
          <p className="order-success-note">
            Order History is not yet available. Once implemented, you will be
            able to view all your past orders from My Orders.
          </p>
        </div>
      </div>

      {/* ── Scoped styles ─────────────────────────────────── */}
      <style>{`
        /* Page layout */
        .order-success-page {
          min-height: calc(100vh - var(--nav-height));
          background-color: var(--bg-page);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
        }

        /* Card */
        .order-success-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 4px;
          max-width: 520px;
          width: 100%;
          padding: 3rem 2.5rem;
          text-align: center;
        }

        /* SVG animated checkmark */
        .order-success-icon {
          width: 72px;
          height: 72px;
          margin: 0 auto 1.75rem;
        }

        .order-success-icon svg {
          width: 100%;
          height: 100%;
        }

        .order-success-circle {
          stroke: var(--success-text);
          stroke-width: 2;
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          animation: draw-circle 0.55s ease forwards;
        }

        .order-success-check {
          stroke: var(--success-text);
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: draw-check 0.4s 0.5s ease forwards;
        }

        @keyframes draw-circle {
          to { stroke-dashoffset: 0; }
        }

        @keyframes draw-check {
          to { stroke-dashoffset: 0; }
        }

        /* Heading */
        .order-success-heading {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
        }

        /* Sub-text */
        .order-success-sub {
          font-size: 0.9375rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        /* Meta rows */
        .order-success-meta {
          border: 1px solid var(--border);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 2rem;
          text-align: left;
        }

        .order-success-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border);
        }

        .order-success-meta-row:last-child {
          border-bottom: none;
        }

        .order-success-meta-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        .order-success-meta-value {
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--text-primary);
          text-align: right;
        }

        .order-success-id {
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.8125rem;
          color: var(--text-secondary);
          word-break: break-all;
        }

        .order-success-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          background: var(--success-bg);
          color: var(--success-text);
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 0.2rem 0.65rem;
          border-radius: 2px;
        }

        /* Actions */
        .order-success-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }

        .order-success-btn-primary {
          background: var(--accent);
          color: var(--text-inverse);
          border: none;
          padding: 0.75rem 2rem;
          font-size: 0.9375rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          border-radius: 2px;
          transition: background var(--transition);
        }

        .order-success-btn-primary:hover {
          background: var(--accent-hover);
        }

        /* Note */
        .order-success-note {
          font-size: 0.8125rem;
          color: var(--text-muted);
          line-height: 1.5;
          margin-top: 0.5rem;
        }

        /* Responsive */
        @media (max-width: 560px) {
          .order-success-card {
            padding: 2rem 1.25rem;
          }
          .order-success-heading {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </>
  );
};

export default OrderSuccess;
