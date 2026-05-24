import React, { useCallback, useEffect, useState } from "react";
import "./Dashboard.css";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import MenuLogado from "../../components/MenuLogado/MenuLogado.jsx";
import { API_BASE_URL, getAuthHeaders } from "../../config/api";
import { FaChartLine, FaWallet, FaArrowUp, FaArrowDown, FaPiggyBank, FaHandHoldingUsd } from "react-icons/fa";

export default function Dashboard() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [carteiras, setCarteiras] = useState([]);
  const [dadosPorCarteira, setDadosPorCarteira] = useState({});
  const [selectedPortfolioId, setSelectedPortfolioId] = useState("all");
  const [totalInvestido, setTotalInvestido] = useState(0);
  const [totalProventos, setTotalProventos] = useState(0);
  const [distribuicaoAtivos, setDistribuicaoAtivos] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregarDadosCarteiras = useCallback(async () => {
    try {
      const respCarteiras = await fetch(`${API_BASE_URL}/carteira`, {
        headers: getAuthHeaders(),
      });
      if (!respCarteiras.ok) return;
      const listaCarteiras = await respCarteiras.json();
      setCarteiras(listaCarteiras);

      const mapaDados = {};
      const mapaProventos = {};
      
      const promessas = listaCarteiras.map(async (c) => {
        const [rConsolidado, rProventos] = await Promise.all([
          fetch(`${API_BASE_URL}/transacao/carteira/${c.id}/consolidado`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE_URL}/provento/carteira/${c.id}`, { headers: getAuthHeaders() })
        ]);
        
        const dataConsolidado = await rConsolidado.json();
        const dataProventos = await rProventos.json();
        
        mapaDados[c.id] = dataConsolidado;
        mapaProventos[c.id] = dataProventos;
      });

      await Promise.all(promessas);
      setDadosPorCarteira(mapaDados);
      setDadosProventos(mapaProventos);
    } catch (err) {
      console.error("Erro ao carregar dados das carteiras:", err);
    }
  }, []);

  const [dadosProventos, setDadosProventos] = useState({});

  useEffect(() => {
    const todosOsDados = selectedPortfolioId === "all" 
      ? Object.values(dadosPorCarteira).flat()
      : (dadosPorCarteira[selectedPortfolioId] || []);

    const todosOsProventos = selectedPortfolioId === "all"
      ? Object.values(dadosProventos).flat()
      : (dadosProventos[selectedPortfolioId] || []);

    let total = 0;
    const categoriasMap = {};

    todosOsDados.forEach(posicao => {
      const valor = Number(posicao.totalInvestido);
      total += valor;
      
      const cat = posicao.tipoAtivo;
      categoriasMap[cat] = (categoriasMap[cat] || 0) + valor;
    });

    setTotalInvestido(total);
    setTotalProventos(todosOsProventos.reduce((acc, curr) => acc + Number(curr.valorLiquido), 0));
    setDistribuicaoAtivos(
      Object.keys(categoriasMap).map(name => ({
        name,
        value: categoriasMap[name]
      }))
    );
  }, [selectedPortfolioId, dadosPorCarteira, dadosProventos]);

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
    
    const fetchData = async () => {
      setLoading(true);
      await carregarDadosCarteiras();
      setLoading(false);
    };
    
    fetchData();
  }, [navigate, carregarDadosCarteiras]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <MenuLogado />
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Consolidando suas finanças...</p>
        </div>
      </div>
    );
  }

  if (!perfil) return null;

  const {
    renda_mensal = 0,
    gastos_fixos = 0,
    gastos_variaveis = 0,
    reserva_emergencia = 0
  } = perfil;

  const gastosTotais = gastos_fixos + gastos_variaveis;
  const saldo = renda_mensal - gastosTotais;
  const patrimonioTotal = totalInvestido + reserva_emergencia;

  const chartDataPerfil = [
    { name: "Gastos Fixos", value: gastos_fixos },
    { name: "Gastos Variáveis", value: gastos_variaveis },
    { name: "Saldo Disponível", value: saldo > 0 ? saldo : 0 },
  ];

  const COLORS_PERFIL = ["#f87171", "#60a5fa", "#34d399"];
  const COLORS_CATEGORIAS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  const formatCurrency = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="dashboard-container">
      <MenuLogado />
      
      <div className="dashboard-content-wrapper">
        <header className="dashboard-header">
          <div className="header-title-section">
            <h1>Painel de Controle</h1>
            <p>Visão geral do seu patrimônio e fluxo financeiro</p>
            
            {carteiras.length > 1 && (
              <div className="portfolio-selector-container">
                <label htmlFor="portfolio-select">Filtrar por Carteira:</label>
                <select 
                  id="portfolio-select"
                  value={selectedPortfolioId}
                  onChange={(e) => setSelectedPortfolioId(e.target.value)}
                >
                  <option value="all">Todas as Carteiras (Consolidado)</option>
                  {carteiras.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="patrimonio-destaque">
            <span>Patrimônio Total</span>
            <strong>{formatCurrency(patrimonioTotal)}</strong>
          </div>
        </header>

        <section className="dashboard-stats-grid">
          <div className="stat-card income">
            <div className="stat-icon"><FaArrowUp /></div>
            <div className="stat-info">
              <span>Renda Mensal</span>
              <strong>{formatCurrency(renda_mensal)}</strong>
            </div>
          </div>
          
          <div className="stat-card expense">
            <div className="stat-icon"><FaArrowDown /></div>
            <div className="stat-info">
              <span>Gastos Totais</span>
              <strong>{formatCurrency(gastosTotais)}</strong>
            </div>
          </div>

          <div className="stat-card balance">
            <div className="stat-icon"><FaChartLine /></div>
            <div className="stat-info">
              <span>Saldo Livre</span>
              <strong className={saldo >= 0 ? "positive" : "negative"}>
                {formatCurrency(saldo)}
              </strong>
            </div>
          </div>

          <div className="stat-card investment">
            <div className="stat-icon"><FaWallet /></div>
            <div className="stat-info">
              <span>Total em Ativos</span>
              <strong>{formatCurrency(totalInvestido)}</strong>
            </div>
          </div>

          <div className="stat-card reserve">
            <div className="stat-icon"><FaPiggyBank /></div>
            <div className="stat-info">
              <span>Reserva</span>
              <strong>{formatCurrency(reserva_emergencia)}</strong>
            </div>
          </div>

          <div className="stat-card provento">
            <div className="stat-icon"><FaHandHoldingUsd /></div>
            <div className="stat-info">
              <span>Total Proventos</span>
              <strong className="positive">{formatCurrency(totalProventos)}</strong>
            </div>
          </div>
        </section>

        <div className="dashboard-charts-row">
          <section className="chart-box">
            <h2>Distribuição de Gastos</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie 
                    data={chartDataPerfil} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={80} 
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {chartDataPerfil.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_PERFIL[index % COLORS_PERFIL.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="chart-box">
            <h2>Alocação por Categoria</h2>
            <div className="chart-container">
              {distribuicaoAtivos.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie 
                      data={distribuicaoAtivos} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={80} 
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {distribuicaoAtivos.map((entry, index) => (
                        <Cell key={`cell-at-${index}`} fill={COLORS_CATEGORIAS[index % COLORS_CATEGORIAS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-msg">
                  <FaWallet size={40} />
                  <p>Adicione ativos em suas carteiras para ver a distribuição.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
