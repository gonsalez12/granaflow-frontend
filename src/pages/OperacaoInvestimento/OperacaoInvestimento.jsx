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
  const [loadingPreco, setLoadingPreco] = useState(false);
  const [precosDoDia, setPrecosDoDia] = useState({});

  const formatCurrency = (value) =>
    Number(value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const valorTotal = useMemo(() => {
    const quantidadeNumerica = Number(quantidade);
    const valorNumerico = Number(valorUnitario);
    const taxaNumerica = Number(valorTaxa) || 0;

    if (!quantidadeNumerica || !valorNumerico) return taxaNumerica;
    return quantidadeNumerica * valorNumerico + taxaNumerica;
  }, [quantidade, valorTaxa, valorUnitario]);

  const buscarPrecoAtual = async () => {
    if (!nomeAtivo) {
      setError("Informe o ticker do ativo para buscar o preço.");
      return;
    }

    setLoadingPreco(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/acao/preco/${nomeAtivo.trim().toUpperCase()}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Não foi possível encontrar o preço para este ativo.");
      }

      const preco = await response.json();
      setValorUnitario(preco);
      setSuccess(`Preço de ${nomeAtivo.toUpperCase()} atualizado.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPreco(false);
    }
  };

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

  useEffect(() => {
    if (activeTab !== "posicao" || posicoes.length === 0) {
      return;
    }

    const acoes = posicoes.filter((posicao) => posicao.tipoAtivo === "ACOES");
    if (acoes.length === 0) {
      return;
    }

    let cancelled = false;

    const carregarPrecosDoDia = async () => {
      const resultados = await Promise.allSettled(
        acoes.map(async (posicao) => {
          const response = await fetch(
            `${API_BASE_URL}/acao/preco/${posicao.nomeAtivo}`,
            { headers: getAuthHeaders() }
          );

          if (!response.ok) {
            throw new Error(`Falha ao buscar preco de ${posicao.nomeAtivo}`);
          }

          const preco = await response.json();
          return [posicao.nomeAtivo, preco];
        })
      );

      if (cancelled) {
        return;
      }

      setPrecosDoDia((current) => {
        const proximos = { ...current };

        resultados.forEach((resultado) => {
          if (resultado.status === "fulfilled") {
            const [ticker, preco] = resultado.value;
            proximos[ticker] = preco;
          }
        });

        return proximos;
      });
    };

    carregarPrecosDoDia();

    return () => {
      cancelled = true;
    };
  }, [activeTab, posicoes]);

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
                      {formatCurrency(posicaoResumo.totalInvestido)}
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
                            {formatCurrency(posicao.valorMedioCompra)}
                          </dd>
                        </div>
                        <div>
                          <dt>Preco do dia</dt>
                          <dd>
                            {posicao.tipoAtivo === "ACOES" &&
                            precosDoDia[posicao.nomeAtivo] != null
                              ? formatCurrency(precosDoDia[posicao.nomeAtivo])
                              : "--"}
                          </dd>
                        </div>
                        <div>
                          <dt>Total investido</dt>
                          <dd>
                            {formatCurrency(posicao.totalInvestido)}
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
                <div className="input-with-button">
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
                </div>

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
                    {formatCurrency(valorTotal)}
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
                        {formatCurrency(operacao.valorUnitario)}
                      </p>
                    </div>

                    <div className="operacao-item-side">
                      <strong>
                        {formatCurrency(operacao.valorTotal)}
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
