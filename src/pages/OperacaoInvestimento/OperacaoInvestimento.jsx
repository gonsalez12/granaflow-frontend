import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaExchangeAlt } from "react-icons/fa";
import MenuLogado from "../../components/MenuLogado/MenuLogado.jsx";
import { API_BASE_URL, getAuthHeaders } from "../../config/api";
import "./OperacaoInvestimento.css";

const today = new Date().toISOString().slice(0, 10);
const tiposAtivo = [
  { value: "ACOES", label: "Acoes" },
  { value: "FUNDOS_IMOBILIARIOS", label: "Fundos imobiliarios" },
  { value: "TESOURO_DIRETO", label: "Tesouro direto" },
  { value: "CRIPTOMOEDAS", label: "Criptomoedas" },
  { value: "RENDA_FIXA", label: "Renda fixa" },
  { value: "OUTROS", label: "Outros" },
];
const tipoAtivoLabels = Object.fromEntries(
  tiposAtivo.map((tipo) => [tipo.value, tipo.label])
);

export default function OperacaoInvestimento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const carteira = location.state?.carteira;

  const [tipo, setTipo] = useState("COMPRA");
  const [nomeAtivo, setNomeAtivo] = useState("");
  const [tipoAtivo, setTipoAtivo] = useState("ACOES");
  const [quantidade, setQuantidade] = useState("");
  const [valorUnitario, setValorUnitario] = useState("");
  const [valorTaxa, setValorTaxa] = useState("");
  const [dataCompra, setDataCompra] = useState(today);
  const [operacoes, setOperacoes] = useState([]);
  const [posicoes, setPosicoes] = useState([]);
  const [activeTab, setActiveTab] = useState("posicao");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const valorTotal = useMemo(() => {
    const quantidadeNumerica = Number(quantidade);
    const valorNumerico = Number(valorUnitario);
    const taxaNumerica = Number(valorTaxa) || 0;

    if (!quantidadeNumerica || !valorNumerico) return taxaNumerica;
    return quantidadeNumerica * valorNumerico + taxaNumerica;
  }, [quantidade, valorTaxa, valorUnitario]);

  const posicaoResumo = useMemo(() => {
    const totalInvestido = posicoes.reduce(
      (total, posicao) => total + Number(posicao.totalInvestido),
      0
    );
    const categorias = [...new Set(posicoes.map((posicao) => posicao.tipoAtivo))];

    return {
      totalInvestido,
      totalAtivos: posicoes.length,
      categorias,
    };
  }, [posicoes]);

  const carregarOperacoes = useCallback(async () => {
    try {
      setError("");
      const [operacoesResponse, posicoesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/transacao/carteira/${id}`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${API_BASE_URL}/transacao/carteira/${id}/consolidado`, {
          headers: getAuthHeaders(),
        }),
      ]);

      if (!operacoesResponse.ok || !posicoesResponse.ok) {
        throw new Error("Erro ao carregar operacoes da carteira.");
      }

      const [operacoesData, posicoesData] = await Promise.all([
        operacoesResponse.json(),
        posicoesResponse.json(),
      ]);

      setOperacoes(operacoesData);
      setPosicoes(posicoesData);
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    carregarOperacoes();
  }, [carregarOperacoes]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const payload = {
      nomeAtivo: nomeAtivo.trim().toUpperCase(),
      tipoAtivo,
      tipoTransacao: tipo,
      dataCompra,
      valorUnitario: Number(valorUnitario),
      valorTaxa: Number(valorTaxa) || 0,
      quantidade: Number(quantidade),
      carteiraId: Number(id),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/transacao`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(
          errorPayload?.erro || "Erro ao registrar operacao."
        );
      }

      setNomeAtivo("");
      setQuantidade("");
      setValorUnitario("");
      setValorTaxa("");
      setDataCompra(today);
      setSuccess("Operacao registrada com sucesso.");
      carregarOperacoes();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="operacao-container">
      <MenuLogado />

      <main className="operacao-content">
        <button
          className="operacao-back"
          type="button"
          onClick={() => navigate("/carteiras")}
        >
          <FaArrowLeft /> Voltar
        </button>

        <header className="operacao-header">
          <div>
            <span>Carteira</span>
            <h1>{carteira?.nome || `Carteira ${id}`}</h1>
          </div>
          <FaExchangeAlt className="operacao-header-icon" />
        </header>

        <div className="carteira-tabs" role="tablist" aria-label="Carteira">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "posicao"}
            className={activeTab === "posicao" ? "active" : ""}
            onClick={() => setActiveTab("posicao")}
          >
            Posicao
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "operacoes"}
            className={activeTab === "operacoes" ? "active" : ""}
            onClick={() => setActiveTab("operacoes")}
          >
            Operacoes
          </button>
        </div>

        {activeTab === "posicao" && (
          <section className="operacao-list posicao-list" role="tabpanel">
            <h2>Posicao atual</h2>

            {posicoes.length === 0 ? (
              <p className="operacao-empty">Nenhum ativo em carteira.</p>
            ) : (
              <>
                <div className="posicao-summary-grid">
                  <article className="posicao-summary-card destaque">
                    <span>Total investido</span>
                    <strong>
                      {posicaoResumo.totalInvestido.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </strong>
                  </article>
                  <article className="posicao-summary-card">
                    <span>Ativos em carteira</span>
                    <strong>{posicaoResumo.totalAtivos}</strong>
                  </article>
                  <article className="posicao-summary-card categorias">
                    <span>Categorias investidas</span>
                    <div className="categoria-chips">
                      {posicaoResumo.categorias.map((categoria) => (
                        <span key={categoria} className="categoria-chip">
                          {tipoAtivoLabels[categoria] || categoria}
                        </span>
                      ))}
                    </div>
                  </article>
                </div>

                <div className="posicao-grid">
                  {posicoes.map((posicao) => (
                    <article key={posicao.nomeAtivo} className="posicao-card">
                      <div>
                        <span>{tipoAtivoLabels[posicao.tipoAtivo] || posicao.tipoAtivo}</span>
                        <h3>{posicao.nomeAtivo}</h3>
                      </div>
                      <dl>
                        <div>
                          <dt>Quantidade</dt>
                          <dd>{posicao.quantidadeTotal}</dd>
                        </div>
                        <div>
                          <dt>Preco medio</dt>
                          <dd>
                            {Number(posicao.valorMedioCompra).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </dd>
                        </div>
                        <div>
                          <dt>Total investido</dt>
                          <dd>
                            {Number(posicao.totalInvestido).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {activeTab === "operacoes" && (
          <>
            <section className="operacao-panel" role="tabpanel">
              <div className="operacao-mode" aria-label="Tipo de operacao">
                <button
                  type="button"
                  className={tipo === "COMPRA" ? "active" : ""}
                  onClick={() => setTipo("COMPRA")}
                >
                  Compra
                </button>
                <button
                  type="button"
                  className={tipo === "VENDA" ? "active" : ""}
                  onClick={() => setTipo("VENDA")}
                >
                  Venda
                </button>
              </div>

              <form className="operacao-form" onSubmit={handleSubmit}>
                <label>
                  Ativo
                  <input
                    type="text"
                    value={nomeAtivo}
                    onChange={(event) => setNomeAtivo(event.target.value)}
                    placeholder="Ex: PETR4"
                    required
                  />
                </label>

                <label>
                  Tipo de ativo
                  <select
                    value={tipoAtivo}
                    onChange={(event) => setTipoAtivo(event.target.value)}
                    required
                  >
                    {tiposAtivo.map((tipoAtivoOption) => (
                      <option
                        key={tipoAtivoOption.value}
                        value={tipoAtivoOption.value}
                      >
                        {tipoAtivoOption.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Quantidade
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantidade}
                    onChange={(event) => setQuantidade(event.target.value)}
                    placeholder="0"
                    required
                  />
                </label>

                <label>
                  Valor unitario
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={valorUnitario}
                    onChange={(event) => setValorUnitario(event.target.value)}
                    placeholder="0,00"
                    required
                  />
                </label>

                <label>
                  Taxa
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={valorTaxa}
                    onChange={(event) => setValorTaxa(event.target.value)}
                    placeholder="0,00"
                  />
                </label>

                <label>
                  Data
                  <input
                    type="date"
                    value={dataCompra}
                    onChange={(event) => setDataCompra(event.target.value)}
                    required
                  />
                </label>

                <div className="operacao-total">
                  <span>Total</span>
                  <strong>
                    {valorTotal.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </strong>
                </div>

                <button className="operacao-submit" type="submit">
                  Registrar {tipo === "COMPRA" ? "compra" : "venda"}
                </button>
              </form>

              {error && <p className="operacao-error">{error}</p>}
              {success && <p className="operacao-success">{success}</p>}
            </section>

            <section className="operacao-list">
              <h2>Operacoes</h2>

              {operacoes.length === 0 ? (
                <p className="operacao-empty">Nenhuma operacao registrada.</p>
              ) : (
                operacoes.map((operacao) => (
                  <article key={operacao.id} className="operacao-item">
                    <div>
                      <span
                        className={`operacao-badge ${operacao.tipoTransacao.toLowerCase()}`}
                      >
                        {operacao.tipoTransacao === "COMPRA" ? "Compra" : "Venda"}
                      </span>
                      <h3>{operacao.nomeAtivo}</h3>
                      <p>
                        {operacao.quantidade} cotas x{" "}
                        {Number(operacao.valorUnitario).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                    </div>

                    <div className="operacao-item-side">
                      <strong>
                        {Number(operacao.valorTotal).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </strong>
                      <span>
                        {new Date(operacao.dataCompra).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </article>
                ))
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
