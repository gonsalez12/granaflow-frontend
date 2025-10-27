import React, { useState } from "react";
import "./PerfilFinanceiro.css";
import { useNavigate } from "react-router-dom";

export default function PerfilFinanceiro() {
  const navigate = useNavigate();
  const [rendaMensal, setRendaMensal] = useState("");
  const [reservaDeEmergencia, setReservaDeEmergencia] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const usuario = JSON.parse(localStorage.getItem("usuario"));

      if (!usuario?.id) {
        throw new Error("Usuário não identificado.");
      }

      const response = await fetch(`http://localhost:8080/perfil-financeiro`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rendaMensal,
          reservaDeEmergencia,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar o perfil financeiro.");
      }

      const data = await response.json();
      localStorage.setItem("perfilFinanceiro", JSON.stringify(data));
      setSuccess("Perfil financeiro cadastrado com sucesso!");

      // Redireciona pro Dashboard após salvar
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="perfil-container">
      <div className="perfil-box">
        <h2>Monte seu Perfil Financeiro</h2>
        <p className="perfil-subtitle">Nos conte um pouco sobre sua realidade financeira</p>

        <form onSubmit={handleSubmit} className="perfil-form">
          <div className="form-group">
            <label>Renda Mensal (R$)</label>
            <input
              type="number"
              value={rendaMensal}
              onChange={(e) => setRendaMensal(e.target.value)}
              placeholder="Ex: 5000"
              required
            />
          </div>

          <div className="form-group">
            <label>Reserva De Emergencia (R$)</label>
            <input
              type="number"
              value={reservaDeEmergencia}
              onChange={(e) => setReservaDeEmergencia(e.target.value)}
              placeholder="Ex: 20000"
              required
            />
          </div>


          <button type="submit" className="perfil-button">Salvar Perfil</button>
        </form>

        {error && <p className="perfil-error">{error}</p>}
        {success && <p className="perfil-success">{success}</p>}
      </div>
    </div>
  );
}
