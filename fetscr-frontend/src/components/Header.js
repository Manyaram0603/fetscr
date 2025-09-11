import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Header.css";

export default function Header() {
  const location = useLocation();
  const isPricingPage = location.pathname === "/pricing";

  return (
    <header className={isPricingPage ? "header sidebar-header" : "header"}>
      <div className="header-left">
        <h2 className="logo">FETSCR</h2>
      </div>

      <nav className={isPricingPage ? "sidebar-nav" : "header-center"}>
        <Link to="/home">Home</Link>
        <Link to="/pricing">Pricing</Link>
        <a href="#community">Community</a>
        <a href="#docs">Docs</a>
      </nav>

      {!isPricingPage && (
        <div className="header-right">
          <Link to="/login">
            <button className="btn-primary">Login</button>
          </Link>
          <Link to="/signup">
            <button className="btn-outline">Sign In</button>
          </Link>
        </div>
      )}
    </header>
  );
}
