import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import MenuLogado from "../../components/MenuLogado/MenuLogado.jsx";

export default function Dashboard() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const perfilData = localStorage.getItem("perfilFinanceiro");

    if (!token) {
      navigate("/login");
      return;
    }

    if (!perfilData) {
      navigate("/perfil-financeiro");
      return;
    }

    setPerfil(JSON.parse(perfilData));
  }, [navigate]);

  if (!perfil) return null;

  const {
    renda_mensal = 0,
    gastos_fixos = 0,
    gastos_variaveis = 0,
    reserva_emergencia = 0
  } = perfil;

  const saldo = renda_mensal - (gastos_fixos + gastos_variaveis);

  const data = [
    { name: "Gastos Fixos", value: gastos_fixos },
    { name: "Gastos Variáveis", value: gastos_variaveis },
    { name: "Saldo Disponível", value: saldo > 0 ? saldo : 0 },
  ];

  const COLORS = ["#f87171", "#60a5fa", "#34d399"];

  return (
    <div className="dashboard-container">
      <MenuLogado />
      <div className="dashboard-header">
        <h1>Bem-vindo ao GranFlow</h1>
        <p>Resumo do seu perfil financeiro</p>
      </div>

      <div className="dashboard-cards">
        <div className="card">
          <h3>Renda Mensal</h3>
          <p>R$ {renda_mensal.toLocaleString("pt-BR")}</p>
        </div>

        <div className="card">
          <h3>Gastos Fixos</h3>
          <p>R$ {gastos_fixos.toLocaleString("pt-BR")}</p>
        </div>

        <div className="card">
          <h3>Gastos Variáveis</h3>
          <p>R$ {gastos_variaveis.toLocaleString("pt-BR")}</p>
        </div>

        <div className="card destaque">
          <h3>Saldo Disponível</h3>
          <p>R$ {saldo.toLocaleString("pt-BR")}</p>
        </div>

        <div className="card">
          <h3>Reserva Emergência</h3>
          <p>R$ {reserva_emergencia.toLocaleString("pt-BR")}</p>
        </div>
      </div>

      <div className="dashboard-chart">
        <h2>Distribuição Financeira</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={120} label>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
