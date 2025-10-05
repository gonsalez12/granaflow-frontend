import React from "react";
import "./Menu.css";

export default function Menu() {
  return (
    <header className="menu-header">
      <h2 className="menu-logo">GranFlow</h2>
      <nav>
        <ul className="menu-list">
          <li><a href="/login" className="menu-link">Login</a></li>
        </ul>
      </nav>
    </header>
  );
}
