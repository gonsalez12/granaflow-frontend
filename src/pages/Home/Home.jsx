import React from "react";
import "./Home.css";

export default function Home() {
  return (
    <div className="home-container">

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>Controle suas finanças com inteligência</h1>
          <p>
            Gerencie seus gastos fixos e variáveis, acompanhe seus ativos
            financeiros — tudo em um só lugar.
          </p>
          <button className="cta-button">Comece agora</button>
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
