import React from "react";
import { Link } from "react-router-dom";
import "./Menu.css";

export default function Menu() {
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const loginPath = isLoggedIn ? "/dashboard" : "/login";

  return (
    <header className="public-menu">
      <h2 className="menu-logo">GranFlow</h2>
      <nav>
        <ul className="menu-list">
          <li>
            <Link to={loginPath} className="menu-link">
              {isLoggedIn ? "Ir para o app" : "Login"}
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
