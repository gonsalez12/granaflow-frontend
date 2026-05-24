import React, { useCallback, useEffect, useState } from "react";
import "./Carteiras.css";
import MenuLogado from "../../components/MenuLogado/MenuLogado.jsx";
import { API_BASE_URL, getAuthHeaders } from "../../config/api";
import { useNavigate } from "react-router-dom";
import { FaTrash, FaWallet, FaFileImport } from "react-icons/fa";

export default function Carteiras() {
  const navigate = useNavigate();
  const [carteiras, setCarteiras] = useState([]);
  const [nome, setNome] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [carteiraRecemCriada, setCarteiraRecemCriada] = useState(null);

  const carregarCarteiras = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/carteira`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Erro ao carregar carteiras");

      const data = await response.json();
      setCarteiras(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    carregarCarteiras();
  }, [carregarCarteiras, navigate]);

  const handleCriar = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setCarteiraRecemCriada(null);

    try {
      const response = await fetch(`${API_BASE_URL}/carteira`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ nome }),
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg || "Erro ao criar carteira");
      }

      const carteiraCriada = await response.json();
      setSuccess("Carteira criada com sucesso!");
      setNome("");
      setCarteiraRecemCriada(carteiraCriada);
      carregarCarteiras();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeletar = async (id) => {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_BASE_URL}/carteira/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Erro ao deletar carteira");

      setSuccess("Carteira deletada com sucesso!");
      carregarCarteiras();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleImportarAgora = () => {
    if (!carteiraRecemCriada) {
      return;
    }

    navigate(`/carteiras/${carteiraRecemCriada.id}/importar/inicial`, {
      state: { carteira: carteiraRecemCriada },
    });
  };

  return (
    <div className="carteiras-container">
      <MenuLogado />
      <div className="carteiras-content">
        <header className="carteiras-header">
          <div className="title-section">
            <FaWallet className="header-icon" />
            <div>
              <h1>Minhas Carteiras</h1>
              <p>Gerencie seus investimentos de forma organizada</p>
            </div>
          </div>
        </header>

        <section className="carteiras-form-section">
          <div className="carteiras-form-card">
            <h2>Criar Nova Carteira</h2>
            <form onSubmit={handleCriar} className="carteiras-form">
              <div className="form-group">
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome da Carteira (Ex: Aposentadoria, Dividendos...)"
                  required
                />
              </div>
              <button type="submit" className="carteiras-button">
                Criar Carteira
              </button>
            </form>

            {error && <p className="carteiras-error">{error}</p>}
            {success && <p className="carteiras-success">{success}</p>}

            {carteiraRecemCriada && (
              <div className="carteiras-import-callout">
                <div className="callout-content">
                  <div className="callout-icon">
                    <FaFileImport />
                  </div>
                  <div>
                    <h3>Importar da B3 agora?</h3>
                    <p>
                      Agilize seu controle importando o relatório consolidado da B3.
                    </p>
                  </div>
                </div>
                <div className="carteiras-import-actions">
                  <button
                    type="button"
                    className="carteiras-import-primary"
                    onClick={handleImportarAgora}
                  >
                    Importar Agora
                  </button>
                  <button
                    type="button"
                    className="carteiras-import-secondary"
                    onClick={() => setCarteiraRecemCriada(null)}
                  >
                    Depois
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="carteiras-list-section">
          <h2>Suas Carteiras</h2>
          <div className="carteiras-list">
            {carteiras.length === 0 ? (
              <div className="carteiras-empty">
                <FaWallet size={48} color="#94a3b8" />
                <p>Nenhuma carteira encontrada. Comece criando uma acima!</p>
              </div>
            ) : (
              carteiras.map((carteira) => (
                <div
                  key={carteira.id}
                  className="carteira-card"
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    navigate(`/carteiras/${carteira.id}/operacoes`, {
                      state: { carteira },
                    })
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/carteiras/${carteira.id}/operacoes`, {
                        state: { carteira },
                      });
                    }
                  }}
                >
                  <div className="carteira-info">
                    <div className="wallet-icon-box">
                      <FaWallet />
                    </div>
                    <div className="carteira-text">
                      <h3>{carteira.nome}</h3>
                      <span className="carteira-data">
                        Criada em{" "}
                        {new Date(carteira.dataCriacao).toLocaleDateString(
                          "pt-BR"
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="carteira-actions">
                    <button
                      className="carteira-delete-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeletar(carteira.id);
                      }}
                      title="Deletar carteira"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
