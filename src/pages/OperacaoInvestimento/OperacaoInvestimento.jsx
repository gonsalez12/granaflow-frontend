import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaExchangeAlt, FaFileImport } from "react-icons/fa";
import MenuLogado from "../../components/MenuLogado/MenuLogado.jsx";
import { API_BASE_URL, getAuthHeaders } from "../../config/api";
import "./OperacaoInvestimento.css";

const today = new Date().toISOString().slice(0, 10);
const tiposAtivo = [
  { value: "ACOES", label: "Acoes" },
  { value: "BDR", label: "BDR" },
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
  const [proventos, setProventos] = useState([]);
  const [activeTab, setActiveTab] = useState("posicao");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingPreco, setLoadingPreco] = useState(false);

  const carregarProventos = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/provento/carteira/${id}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setProventos(data);
      }
    } catch (err) {
      console.error("Erro ao carregar proventos:", err);
    }
  }, [id]);
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

  const proventosResumo = useMemo(() => {
    const total = proventos.reduce(
      (acc, curr) => acc + Number(curr.valorLiquido || 0),
      0
    );

    const porTipo = proventos.reduce((acc, curr) => {
      const tipo = curr.tipoProvento || "N/A";
      acc[tipo] = (acc[tipo] || 0) + Number(curr.valorLiquido || 0);
      return acc;
    }, {});

    return {
      total,
      quantidade: proventos.length,
      tipos: Object.keys(porTipo).length,
      porTipo,
    };
  }, [proventos]);

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
    
    const agrupado = {};
    posicoes.forEach(posicao => {
      const cat = posicao.tipoAtivo;
      if (!agrupado[cat]) {
        agrupado[cat] = {
          label: tipoAtivoLabels[cat] || cat,
          items: [],
          totalInvestido: 0
        };
      }
      agrupado[cat].items.push(posicao);
      agrupado[cat].totalInvestido += Number(posicao.totalInvestido);
    });

    return {
      totalInvestido,
      totalAtivos: posicoes.length,
      categorias: Object.keys(agrupado).sort(),
      agrupado
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

    const tickersParaBuscar = posicoes.filter((posicao) => 
      ["ACOES", "BDR", "FUNDOS_IMOBILIARIOS"].includes(posicao.tipoAtivo)
    );
    
    if (tickersParaBuscar.length === 0) {
      return;
    }

    let cancelled = false;

    const carregarPrecosDoDia = async () => {
      const resultados = await Promise.allSettled(
        tickersParaBuscar.map(async (posicao) => {
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
          <div className="header-actions">
            <button 
              className="btn-import-b3" 
              onClick={() => navigate(`/carteiras/${id}/importar/atualizacao`, { state: { carteira } })}
            >
              <FaFileImport /> Atualizar com B3
            </button>
            <FaExchangeAlt className="operacao-header-icon" />
          </div>
        </header>

        <div className="carteira-tabs" role="tablist" aria-label="Carteira">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "posicao"}
            className={activeTab === "posicao" ? "active" : ""}
            onClick={() => setActiveTab("posicao")}
          >
            Posição
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "operacoes"}
            className={activeTab === "operacoes" ? "active" : ""}
            onClick={() => setActiveTab("operacoes")}
          >
            Operações
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "proventos"}
            className={activeTab === "proventos" ? "active" : ""}
            onClick={() => {
              setActiveTab("proventos");
              carregarProventos();
            }}
          >
            Proventos
          </button>
        </div>

        {activeTab === "proventos" && (
          <section className="operacao-list provento-list" role="tabpanel">
            <div className="posicao-header-flex">
              <h2>Proventos Recebidos</h2>
              <span className="last-update">
                Total acumulado: {formatCurrency(proventosResumo.total)}
              </span>
            </div>

            {proventos.length === 0 ? (
              <p className="operacao-empty">Nenhum provento registrado nesta carteira.</p>
            ) : (
              <div className="provento-content">
                <div className="provento-summary-grid">
                  <article className="provento-summary-card destaque">
                    <span>Total Recebido</span>
                    <strong>{formatCurrency(proventosResumo.total)}</strong>
                  </article>
                  <article className="provento-summary-card">
                    <span>Lançamentos</span>
                    <strong>{proventosResumo.quantidade}</strong>
                  </article>
                  <article className="provento-summary-card">
                    <span>Tipos de Provento</span>
                    <strong>{proventosResumo.tipos}</strong>
                  </article>
                </div>

                <div className="provento-type-row">
                  {Object.entries(proventosResumo.porTipo).map(([tipo, total]) => (
                    <span key={tipo} className="provento-type-pill">
                      {tipo}: {formatCurrency(total)}
                    </span>
                  ))}
                </div>

                <div className="provento-grid">
                  {proventos.map((provento) => (
                    <article key={provento.id} className="provento-card">
                      <header className="provento-card-header">
                        <strong>{provento.nomeAtivo}</strong>
                        <span className="provento-tag">{provento.tipoProvento}</span>
                      </header>
                      <div className="provento-card-body">
                        <div className="data-row">
                          <span className="label">Data de pagamento</span>
                          <span className="value">
                            {new Date(provento.dataPagamento).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <div className="data-row highlight">
                          <span className="label">Valor líquido</span>
                          <span className="value provento-value">
                            {formatCurrency(provento.valorLiquido)}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "posicao" && (
          <section className="operacao-list posicao-list" role="tabpanel">
            <div className="posicao-header-flex">
              <h2>Sua Custódia</h2>
              <span className="last-update">Atualizado agora</span>
            </div>

            {posicoes.length === 0 ? (
              <p className="operacao-empty">Nenhum ativo em carteira.</p>
            ) : (
              <>
                <div className="posicao-summary-grid">
                  <article className="posicao-summary-card destaque">
                    <span>Patrimônio Total</span>
                    <strong>
                      {formatCurrency(posicaoResumo.totalInvestido)}
                    </strong>
                  </article>
                  <article className="posicao-summary-card">
                    <span>Total de Ativos</span>
                    <strong>{posicaoResumo.totalAtivos}</strong>
                  </article>
                  <article className="posicao-summary-card">
                    <span>Diversificação</span>
                    <strong>{posicaoResumo.categorias.length} categorias</strong>
                  </article>
                </div>

                {posicaoResumo.categorias.map((catKey) => {
                  const categoria = posicaoResumo.agrupado[catKey];
                  return (
                    <div key={catKey} className="categoria-section">
                      <div className="categoria-header">
                        <h3>{categoria.label}</h3>
                        <span className="categoria-total">
                          {formatCurrency(categoria.totalInvestido)}
                        </span>
                      </div>
                      <div className="posicao-grid">
                        {categoria.items.map((posicao) => {
                          const precoDia = precosDoDia[posicao.nomeAtivo];
                          const totalAtual = precoDia ? precoDia * posicao.quantidadeTotal : null;
                          const lucroPrejuizo = totalAtual ? totalAtual - posicao.totalInvestido : null;
                          const percLucro = lucroPrejuizo ? (lucroPrejuizo / posicao.totalInvestido) * 100 : null;

                          return (
                            <article key={posicao.nomeAtivo} className="posicao-card">
                              <header className="card-header">
                                <div className="ticker-box">
                                  <h3>{posicao.nomeAtivo}</h3>
                                  <span className="card-cat-label">{tipoAtivoLabels[posicao.tipoAtivo] || posicao.tipoAtivo}</span>
                                </div>
                                {percLucro !== null && (
                                  <span className={`performance-badge ${percLucro >= 0 ? 'positive' : 'negative'}`}>
                                    {percLucro >= 0 ? '+' : ''}{percLucro.toFixed(2)}%
                                  </span>
                                )}
                              </header>
                              
                              <div className="card-body">
                                <div className="data-row">
                                  <span className="label">Quantidade</span>
                                  <span className="value">{posicao.quantidadeTotal}</span>
                                </div>
                                <div className="data-row">
                                  <span className="label">Preço Médio</span>
                                  <span className="value">{formatCurrency(posicao.valorMedioCompra)}</span>
                                </div>
                                <div className="data-row">
                                  <span className="label">Custo Total</span>
                                  <span className="value">{formatCurrency(posicao.totalInvestido)}</span>
                                </div>
                                {totalAtual && (
                                  <div className="data-row highlight">
                                    <span className="label">Valor Atual</span>
                                    <span className="value">{formatCurrency(totalAtual)}</span>
                                  </div>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
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
