import React, { useEffect, useState } from "react";
import "./CarteiraDetalhe.css";
import MenuLogado from "../../components/MenuLogado/MenuLogado.jsx";
import { useParams, useNavigate } from "react-router-dom";
import { FaPlus, FaHistory, FaChartBar } from "react-icons/fa";

const TIPOS_ATIVO = [
  "ACOES",
  "FUNDOS_IMOBILIARIOS",
  "TESOURO_DIRETO",
  "CRIPTOMOEDAS",
  "RENDA_FIXA",
  "OUTROS",
];

const LABELS_TIPO = {
  ACOES: "Ações",
  FUNDOS_IMOBILIARIOS: "Fundos Imobiliários",
  TESOURO_DIRETO: "Tesouro Direto",
  CRIPTOMOEDAS: "Criptomoedas",
  RENDA_FIXA: "Renda Fixa",
  OUTROS: "Outros",
};

export default function CarteiraDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [tab, setTab] = useState("consolidado");
  const [consolidado, setConsolidado] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [ativoSelecionado, setAtivoSelecionado] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [nomeAtivo, setNomeAtivo] = useState("");
  const [tipoAtivo, setTipoAtivo] = useState("ACOES");
  const [tipoTransacao, setTipoTransacao] = useState("COMPRA");
  const [dataCompra, setDataCompra] = useState("");
  const [valorUnitario, setValorUnitario] = useState("");
  const [valorTaxa, setValorTaxa] = useState("");
  const [quantidade, setQuantidade] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    carregarConsolidado();
  }, []);

  const carregarConsolidado = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/transacao/carteira/${id}/consolidado`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Erro ao carregar consolidado");
      const data = await response.json();
      setConsolidado(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const carregarHistorico = async (nomeAtivo) => {
    try {
      const response = await fetch(
        `http://localhost:8080/transacao/carteira/${id}/ativo/${encodeURIComponent(nomeAtivo)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Erro ao carregar histórico");
      const data = await response.json();
      setHistorico(data);
      setAtivoSelecionado(nomeAtivo);
      setTab("historico");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:8080/transacao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nomeAtivo,
          tipoAtivo,
          tipoTransacao,
          dataCompra,
          valorUnitario: parseFloat(valorUnitario),
          valorTaxa: valorTaxa ? parseFloat(valorTaxa) : 0,
          quantidade: parseInt(quantidade),
          carteiraId: parseInt(id),
        }),
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg || "Erro ao registrar transação");
      }

      setSuccess("Transação registrada com sucesso!");
      setNomeAtivo("");
      setValorUnitario("");
      setValorTaxa("");
      setQuantidade("");
      setDataCompra("");
      carregarConsolidado();

      if (ativoSelecionado === nomeAtivo) {
        carregarHistorico(nomeAtivo);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const valorTotalPreview = () => {
    const vu = parseFloat(valorUnitario) || 0;
    const qt = parseInt(quantidade) || 0;
    const tx = parseFloat(valorTaxa) || 0;
    return (vu * qt + tx).toFixed(2);
  };

  return (
    <div className="detalhe-container">
      <MenuLogado />
      <div className="detalhe-content">
        <div className="detalhe-header">
          <h1>Carteira de Investimentos</h1>
          <p>Registre transações e acompanhe seus ativos</p>
        </div>

        {/* Formulário de Nova Transação */}
        <div className="detalhe-form-card">
          <h2>
            <FaPlus /> Nova Transação
          </h2>
          <form onSubmit={handleSubmit} className="detalhe-form">
            <div className="form-row">
              <div className="form-group">
                <label>Nome do Ativo</label>
                <input
                  type="text"
                  value={nomeAtivo}
                  onChange={(e) => setNomeAtivo(e.target.value)}
                  placeholder="Ex: PETR4, ITUB4"
                  required
                />
              </div>
              <div className="form-group">
                <label>Tipo do Ativo</label>
                <select
                  value={tipoAtivo}
                  onChange={(e) => setTipoAtivo(e.target.value)}
                >
                  {TIPOS_ATIVO.map((t) => (
                    <option key={t} value={t}>
                      {LABELS_TIPO[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Operação</label>
                <select
                  value={tipoTransacao}
                  onChange={(e) => setTipoTransacao(e.target.value)}
                >
                  <option value="COMPRA">Compra</option>
                  <option value="VENDA">Venda</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Data</label>
                <input
                  type="date"
                  value={dataCompra}
                  onChange={(e) => setDataCompra(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Valor Unitário (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={valorUnitario}
                  onChange={(e) => setValorUnitario(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="form-group">
                <label>Quantidade</label>
                <input
                  type="number"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Taxa (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={valorTaxa}
                  onChange={(e) => setValorTaxa(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-row form-footer">
              <div className="valor-total-preview">
                <span>Valor Total:</span>
                <strong>R$ {valorTotalPreview()}</strong>
              </div>
              <button type="submit" className="detalhe-button">
                Registrar
              </button>
            </div>
          </form>

          {error && <p className="detalhe-error">{error}</p>}
          {success && <p className="detalhe-success">{success}</p>}
        </div>

        {/* Tabs */}
        <div className="detalhe-tabs">
          <button
            className={`tab-btn ${tab === "consolidado" ? "active" : ""}`}
            onClick={() => setTab("consolidado")}
          >
            <FaChartBar /> Consolidado
          </button>
          <button
            className={`tab-btn ${tab === "historico" ? "active" : ""}`}
            onClick={() => setTab("historico")}
            disabled={!ativoSelecionado}
          >
            <FaHistory /> Histórico{" "}
            {ativoSelecionado ? `(${ativoSelecionado})` : ""}
          </button>
        </div>

        {/* Consolidado */}
        {tab === "consolidado" && (
          <div className="detalhe-section">
            {consolidado.length === 0 ? (
              <div className="detalhe-empty">
                <p>Nenhum ativo na carteira. Registre uma compra acima!</p>
              </div>
            ) : (
              <div className="consolidado-table-wrapper">
                <table className="consolidado-table">
                  <thead>
                    <tr>
                      <th>Ativo</th>
                      <th>Tipo</th>
                      <th>Qtd</th>
                      <th>Preço Médio</th>
                      <th>Total Investido</th>
                      <th>Taxas</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consolidado.map((ativo) => (
                      <tr key={ativo.nomeAtivo}>
                        <td className="ativo-nome">{ativo.nomeAtivo}</td>
                        <td>{LABELS_TIPO[ativo.tipoAtivo] || ativo.tipoAtivo}</td>
                        <td>{ativo.quantidadeTotal}</td>
                        <td>
                          R${" "}
                          {ativo.valorMedioCompra?.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td>
                          R${" "}
                          {ativo.totalInvestido?.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td>
                          R${" "}
                          {ativo.totalTaxas?.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td>
                          <button
                            className="historico-btn"
                            onClick={() => carregarHistorico(ativo.nomeAtivo)}
                          >
                            <FaHistory /> Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Histórico por Ativo */}
        {tab === "historico" && ativoSelecionado && (
          <div className="detalhe-section">
            <h3 className="historico-title">
              Histórico de Transações — {ativoSelecionado}
            </h3>
            {historico.length === 0 ? (
              <div className="detalhe-empty">
                <p>Nenhuma transação encontrada para este ativo.</p>
              </div>
            ) : (
              <div className="consolidado-table-wrapper">
                <table className="consolidado-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Operação</th>
                      <th>Qtd</th>
                      <th>Valor Unit.</th>
                      <th>Taxa</th>
                      <th>Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map((tx) => (
                      <tr key={tx.id}>
                        <td>
                          {new Date(tx.dataCompra).toLocaleDateString("pt-BR")}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              tx.tipoTransacao === "COMPRA"
                                ? "badge-compra"
                                : "badge-venda"
                            }`}
                          >
                            {tx.tipoTransacao}
                          </span>
                        </td>
                        <td>{tx.quantidade}</td>
                        <td>
                          R${" "}
                          {tx.valorUnitario?.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td>
                          R${" "}
                          {tx.valorTaxa?.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td>
                          R${" "}
                          {tx.valorTotal?.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
