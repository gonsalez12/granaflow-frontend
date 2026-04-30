import React, { useEffect, useState } from "react";
import "./Carteiras.css";
import MenuLogado from "../../components/MenuLogado/MenuLogado.jsx";
import { useNavigate } from "react-router-dom";
import { FaTrash, FaWallet } from "react-icons/fa";

export default function Carteiras() {
  const navigate = useNavigate();
  const [carteiras, setCarteiras] = useState([]);
  const [nome, setNome] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    carregarCarteiras();
  }, []);

  const carregarCarteiras = async () => {
    try {
      const response = await fetch("http://localhost:8080/carteira", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Erro ao carregar carteiras");

      const data = await response.json();
      setCarteiras(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCriar = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:8080/carteira", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nome }),
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg || "Erro ao criar carteira");
      }

      setSuccess("Carteira criada com sucesso!");
      setNome("");
      carregarCarteiras();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeletar = async (id) => {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`http://localhost:8080/carteira/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Erro ao deletar carteira");

      setSuccess("Carteira deletada com sucesso!");
      carregarCarteiras();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="carteiras-container">
      <MenuLogado />
      <div className="carteiras-content">
        <div className="carteiras-header">
          <h1>Minhas Carteiras</h1>
          <p>Gerencie suas carteiras de investimento</p>
        </div>

        <div className="carteiras-form-card">
          <h2>Nova Carteira</h2>
          <form onSubmit={handleCriar} className="carteiras-form">
            <div className="form-group">
              <label>Nome da Carteira</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Ações de Dividendos"
                required
              />
            </div>
            <button type="submit" className="carteiras-button">
              Criar Carteira
            </button>
          </form>

          {error && <p className="carteiras-error">{error}</p>}
          {success && <p className="carteiras-success">{success}</p>}
        </div>

        <div className="carteiras-list">
          {carteiras.length === 0 ? (
            <div className="carteiras-empty">
              <FaWallet size={48} color="#94a3b8" />
              <p>Você ainda não tem carteiras. Crie uma acima!</p>
            </div>
          ) : (
            carteiras.map((carteira) => (
              <div key={carteira.id} className="carteira-card">
                <div className="carteira-info">
                  <FaWallet size={24} color="#6366f1" />
                  <div>
                    <h3>{carteira.nome}</h3>
                    <span className="carteira-data">
                      Criada em{" "}
                      {new Date(carteira.dataCriacao).toLocaleDateString(
                        "pt-BR"
                      )}
                    </span>
                  </div>
                </div>
                <button
                  className="carteira-delete-btn"
                  onClick={() => handleDeletar(carteira.id)}
                  title="Deletar carteira"
                >
                  <FaTrash />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
