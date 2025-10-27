import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./MenuLogado.css";
import { FaChartPie, FaUserCircle, FaHome, FaSignOutAlt, FaBars } from "react-icons/fa";

export default function MenuLogado() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("perfilFinanceiro");
    navigate("/login");
  };

  return (
    <nav className={`menu ${open ? "open" : ""}`}>
      <div className="menu-header">
        <h2>GranFlow</h2>
        <button className="menu-toggle" onClick={() => setOpen(!open)}>
          <FaBars />
        </button>
      </div>

      <ul className="menu-links">
        <li>
          <Link to="/home">
            <FaHome /> <span>Home</span>
          </Link>
        </li>
        <li>
          <Link to="/perfil-financeiro">
            <FaUserCircle /> <span>Perfil Financeiro</span>
          </Link>
        </li>
        <li>
          <Link to="/dashboard">
            <FaChartPie /> <span>Dashboard</span>
          </Link>
        </li>
      </ul>

      <div className="menu-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt /> <span>Sair</span>
        </button>
      </div>
    </nav>
  );
}
