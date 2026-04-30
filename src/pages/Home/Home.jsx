import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import Menu from "../../components/Menu/Menu";

export default function Home() {
  return (
    <div className="home-container">
      <Menu />
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>Controle suas finanças com inteligência</h1>
          <p>
            Gerencie seus gastos fixos e variáveis, acompanhe seus ativos
            financeiros — tudo em um só lugar.
          </p>
          <Link to="/register" className="cta-button">Comece agora</Link>
        </div>
        <div className="hero-preview" aria-hidden="true">
          <div className="preview-top">
            <span>Patrimonio</span>
            <strong>R$ 48.720,00</strong>
          </div>
          <div className="preview-bars">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="preview-row">
            <span>Carteiras</span>
            <strong>4</strong>
          </div>
          <div className="preview-row positive">
            <span>Saldo mensal</span>
            <strong>+R$ 1.840,00</strong>
          </div>
          <div className="preview-row">
            <span>Reserva</span>
            <strong>R$ 18.000,00</strong>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <h2>O que você poderá fazer</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Controle de despesas</h3>
            <p>
              Visualize e categorize seus gastos fixos e variáveis facilmente.
            </p>
          </div>
          <div className="feature-card">
            <h3>Gestão de ativos</h3>
            <p>
              Acompanhe seus investimentos, lucros, perdas e alocações.
            </p>
          </div>
          <div className="feature-card">
            <h3>Relatórios inteligentes</h3>
            <p>Gere gráficos, relatórios e insights com poucos cliques.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© {new Date().getFullYear()} GranFlow. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
