import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";

const Navbar = ({ wishlistCount: propCount }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Cart state from context
  const { totalUnits, fetchCart } = useCart();

  // Fetch cart on mount so the navbar count is always up-to-date
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Fetch wishlist count on mount (unless provided via props from Wishlist page)
  useEffect(() => {
    if (propCount !== undefined) {
      setWishlistCount(propCount);
      return;
    }

    const fetchCount = async () => {
      try {
        const response = await api.get("/wishlist");
        setWishlistCount(response.data.count || 0);
      } catch {
        // Silently fail — count is a bonus feature
        setWishlistCount(0);
      }
    };

    fetchCount();
  }, [propCount]);

  const handleLogout = async () => {
    try {
      await api.post("/customers/logout");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/login");
    }
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  const NavLinks = () => (
    <>
      <Link
        to="/home"
        className={`nav-link ${isActive("/home") ? "active" : ""}`}
        onClick={() => setMobileOpen(false)}
      >
        Home
      </Link>
      <Link
        to="/products"
        className={`nav-link ${isActive("/products") ? "active" : ""}`}
        onClick={() => setMobileOpen(false)}
      >
        Products
      </Link>
      <Link
        to="/wishlist"
        className={`nav-link ${isActive("/wishlist") ? "active" : ""}`}
        onClick={() => setMobileOpen(false)}
      >
        Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ""}
      </Link>
      <Link
        to="/cart"
        className={`nav-link ${isActive("/cart") ? "active" : ""}`}
        onClick={() => setMobileOpen(false)}
      >
        Cart{totalUnits > 0 ? ` (${totalUnits})` : ""}
      </Link>
      <div className="nav-separator" />
      <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="logout-btn">
        Logout
      </button>
    </>
  );

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Brand */}
          <Link to="/home" className="navbar-brand">
            <span className="navbar-brand-name">ShopKart</span>
            <span className="navbar-brand-sub">Commerce</span>
          </Link>

          {/* Desktop nav */}
          <div className="navbar-menu">
            <NavLinks />
          </div>

          {/* Mobile toggle */}
          <button
            className="nav-mobile-toggle"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`nav-mobile-menu ${mobileOpen ? "open" : ""}`}>
        <NavLinks />
      </div>
    </>
  );
};

export default Navbar;
