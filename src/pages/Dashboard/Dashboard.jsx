import React from "react";
import "./Dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      {/* Menu lateral */}
      <aside className="sidebar">
        <h2 className="sidebar-title">GranFlow</h2>
        <nav className="menu">
          <a href="/dashboard">🏠 Início</a>
          <a href="/gastos">💸 Gastos</a>
          <a href="/ativos">📈 Ativos</a>
          <a href="/config">⚙️ Configurações</a>
        </nav>
      </aside>

      {/* Conteúdo principal */}
      <main className="main-content">
        <h1>Dashboard</h1>
        <p>Bem-vindo ao painel de controle do GranFlow!</p>

        <div className="cards">
          <div className="card">
            <h3>Gastos Fixos</h3>
            <p>R$ 2.350</p>
          </div>
          <div className="card">
            <h3>Gastos Variáveis</h3>
            <p>R$ 1.120</p>
          </div>
          <div className="card">
            <h3>Ativos Financeiros</h3>
            <p>R$ 25.400</p>
          </div>
        </div>
      </main>
    </div>
  );
}
