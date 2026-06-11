import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaExchangeAlt, FaFileExcel, FaFileImport } from "react-icons/fa";
import { BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
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
const proventoChartColors = ["#1d4ed8", "#059669", "#e11d48", "#7c3aed", "#ea580c", "#0f766e", "#334155", "#0891b2"];

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
  const [arquivosImportados, setArquivosImportados] = useState([]);
  const [rentabilidadeData, setRentabilidadeData] = useState([]);
  const [proventoViewMode, setProventoViewMode] = useState("lista");
  const [openOperacaoModal, setOpenOperacaoModal] = useState(false);
  const [activeTab, setActiveTab] = useState("resumo");
  const [resumoDataInicial, setResumoDataInicial] = useState("");
  const [resumoDataFinal, setResumoDataFinal] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

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

  const proventosAgrupadosPorAtivo = useMemo(() => {
    const agrupado = proventos.reduce((acc, item) => {
      const chave = item.nomeAtivo || "Sem ativo";
      if (!acc[chave]) {
        acc[chave] = {
          nomeAtivo: chave,
          total: 0,
          itens: [],
        };
      }
      acc[chave].itens.push(item);
      acc[chave].total += Number(item.valorLiquido || 0);
      return acc;
    }, {});

    return Object.values(agrupado)
      .map((grupo) => ({
        ...grupo,
        itens: grupo.itens.sort(
          (a, b) => new Date(b.dataPagamento) - new Date(a.dataPagamento)
        ),
      }))
      .sort((a, b) => b.total - a.total);
  }, [proventos]);

  const proventosEvolucaoPorAtivo = useMemo(() => {
    const porAtivo = new Map();
    const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
      month: "short",
      year: "2-digit",
    });

    proventos.forEach((provento) => {
      const data = new Date(provento.dataPagamento);
      if (Number.isNaN(data.getTime())) {
        return;
      }

      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, "0");
      const chave = `${ano}-${mes}`;
      const nomeAtivo = provento.nomeAtivo || "Sem ativo";
      const valor = Number(provento.valorLiquido || 0);

      if (!porAtivo.has(nomeAtivo)) {
        porAtivo.set(nomeAtivo, new Map());
      }

      const mesesAtivo = porAtivo.get(nomeAtivo);
      if (!mesesAtivo.has(chave)) {
        mesesAtivo.set(chave, {
          mes: monthFormatter.format(data).replace(".", ""),
          ordem: chave,
          valor: 0,
        });
      }

      const registroMes = mesesAtivo.get(chave);
      registroMes.valor += valor;
    });

    return proventosAgrupadosPorAtivo.map((grupo) => {
      const mesesAtivo = porAtivo.get(grupo.nomeAtivo) || new Map();
      const data = Array.from(mesesAtivo.values())
        .sort((a, b) => a.ordem.localeCompare(b.ordem))
        .map((mes) => ({
          mes: mes.mes,
          valor: mes.valor,
        }));

      return {
        nomeAtivo: grupo.nomeAtivo,
        total: grupo.total,
        data,
      };
    });
  }, [proventos, proventosAgrupadosPorAtivo]);

  const resumoRangeOptions = useMemo(() => {
    const porCompetencia = new Map();

    rentabilidadeData.forEach((item) => {
      const competencia = item.ordem || item.mes;
      if (!competencia || porCompetencia.has(competencia)) {
        return;
      }

      porCompetencia.set(competencia, {
        value: competencia,
        label: item.mes || competencia,
      });
    });

    return Array.from(porCompetencia.values()).sort((a, b) => a.value.localeCompare(b.value));
  }, [rentabilidadeData]);

  useEffect(() => {
    if (resumoRangeOptions.length === 0) {
      setResumoDataInicial("");
      setResumoDataFinal("");
      return;
    }

    const primeiraCompetencia = resumoRangeOptions[0].value;
    const ultimaCompetencia = resumoRangeOptions[resumoRangeOptions.length - 1].value;
    const competenciasDisponiveis = new Set(resumoRangeOptions.map((option) => option.value));

    setResumoDataInicial((atual) => competenciasDisponiveis.has(atual) ? atual : primeiraCompetencia);
    setResumoDataFinal((atual) => competenciasDisponiveis.has(atual) ? atual : ultimaCompetencia);
  }, [resumoRangeOptions]);

  const handleResumoDataInicialChange = (event) => {
    const novaDataInicial = event.target.value;
    setResumoDataInicial(novaDataInicial);

    if (resumoDataFinal && novaDataInicial > resumoDataFinal) {
      setResumoDataFinal(novaDataInicial);
    }
  };

  const handleResumoDataFinalChange = (event) => {
    const novaDataFinal = event.target.value;
    setResumoDataFinal(novaDataFinal);

    if (resumoDataInicial && novaDataFinal < resumoDataInicial) {
      setResumoDataInicial(novaDataFinal);
    }
  };

  const rentabilidadeChartData = useMemo(() => {
    if (resumoRangeOptions.length === 0) {
      return [];
    }

    const primeiraCompetencia = resumoRangeOptions[0].value;
    const ultimaCompetencia = resumoRangeOptions[resumoRangeOptions.length - 1].value;
    const dataInicial = resumoDataInicial || primeiraCompetencia;
    const dataFinal = resumoDataFinal || ultimaCompetencia;

    return rentabilidadeData.filter((item) => {
      const competencia = item.ordem || item.mes;
      return competencia >= dataInicial && competencia <= dataFinal;
    });
  }, [rentabilidadeData, resumoDataFinal, resumoDataInicial, resumoRangeOptions]);

  const rentabilidadeChartDomain = useMemo(() => {
    const valores = rentabilidadeChartData
      .flatMap((item) => [
        item.rentabilidadeIndice,
        item.cdiIndice,
        item.ibovespaIndice,
      ])
      .filter((valor) => valor !== null && valor !== undefined)
      .map((valor) => Number(valor))
      .filter((valor) => Number.isFinite(valor));

    if (valores.length === 0) {
      return [100, 101];
    }

    const maximo = Math.max(...valores);
    const minimo = Math.min(...valores);
    const faixa = Math.max(1, maximo - minimo);
    return [Math.floor(minimo - faixa * 0.15), Math.ceil(maximo + faixa * 0.15)];
  }, [rentabilidadeChartData]);

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

    const categoriasOrdenadas = Object.entries(agrupado)
      .sort(([, categoriaA], [, categoriaB]) => categoriaB.totalInvestido - categoriaA.totalInvestido)
      .map(([categoriaKey]) => categoriaKey);

    return {
      totalInvestido,
      totalAtivos: posicoes.length,
      categorias: categoriasOrdenadas,
      agrupado
    };
  }, [posicoes]);

  const arquivosResumo = useMemo(() => {
    const total = arquivosImportados.length;
    const ultimaImportacao = arquivosImportados[0] || null;
    const competencias = new Set(
      arquivosImportados.map((arquivo) => `${arquivo.anoCompetencia}-${arquivo.mesCompetencia}`)
    );

    return {
      total,
      competencias: competencias.size,
      ultimaImportacao,
    };
  }, [arquivosImportados]);

  const historicoOperacoesAgrupado = useMemo(() => {
    const agrupado = operacoes.reduce((acc, operacao) => {
      const chave = operacao.nomeAtivo || "Sem ativo";
      if (!acc[chave]) {
        acc[chave] = {
          nomeAtivo: chave,
          totalCompras: 0,
          totalVendas: 0,
          itens: [],
        };
      }

      const valorTotal = Number(operacao.valorTotal || 0);
      if (operacao.tipoTransacao === "COMPRA") {
        acc[chave].totalCompras += valorTotal;
      } else if (operacao.tipoTransacao === "VENDA") {
        acc[chave].totalVendas += valorTotal;
      }

      acc[chave].itens.push(operacao);
      return acc;
    }, {});

    return Object.values(agrupado)
      .map((grupo) => ({
        ...grupo,
        itens: grupo.itens.sort(
          (a, b) => new Date(b.dataCompra) - new Date(a.dataCompra)
        ),
      }))
      .sort((a, b) => {
        const movimentoA = a.totalCompras + a.totalVendas;
        const movimentoB = b.totalCompras + b.totalVendas;
        return movimentoB - movimentoA;
      });
  }, [operacoes]);

  const carregarOperacoes = useCallback(async () => {
    try {
      setError("");
      const [operacoesResponse, posicoesResponse, proventosResponse, comparativoResponse, arquivosResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/transacao/carteira/${id}`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${API_BASE_URL}/transacao/carteira/${id}/consolidado`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${API_BASE_URL}/provento/carteira/${id}`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${API_BASE_URL}/benchmark/cdi/carteira/${id}/comparativo`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${API_BASE_URL}/importacao/b3/carteira/${id}/arquivos`, {
          headers: getAuthHeaders(),
        }),
      ]);

      if (!operacoesResponse.ok || !posicoesResponse.ok || !proventosResponse.ok || !comparativoResponse.ok || !arquivosResponse.ok) {
        throw new Error("Erro ao carregar operacoes da carteira.");
      }

      const [operacoesData, posicoesData, proventosData, comparativoData, arquivosData] = await Promise.all([
        operacoesResponse.json(),
        posicoesResponse.json(),
        proventosResponse.json(),
        comparativoResponse.json(),
        arquivosResponse.json(),
      ]);

      setOperacoes(operacoesData);
      setPosicoes(posicoesData);
      setProventos(proventosData);
      setArquivosImportados(arquivosData);
      setRentabilidadeData(
        comparativoData.map((item) => ({
          ...item,
          rentabilidadePct: Number(item.rentabilidadePct ?? 0),
          rentabilidadeIndice: Number(item.rentabilidadeIndice ?? 0),
          valorAtualizadoTotal: Number(item.valorAtualizadoTotal ?? 0),
          cdiPct: item.cdiPct === null || item.cdiPct === undefined ? null : Number(item.cdiPct),
          cdiIndice: item.cdiIndice === null || item.cdiIndice === undefined ? null : Number(item.cdiIndice),
          ibovespaPct: item.ibovespaPct === null || item.ibovespaPct === undefined ? null : Number(item.ibovespaPct),
          ibovespaIndice: item.ibovespaIndice === null || item.ibovespaIndice === undefined ? null : Number(item.ibovespaIndice),
        }))
      );
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
      setOpenOperacaoModal(false);
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
            <button
              className="btn-nova-operacao"
              type="button"
              onClick={() => setOpenOperacaoModal(true)}
            >
              Nova operação
            </button>
            <FaExchangeAlt className="operacao-header-icon" />
          </div>
        </header>

        <div className="carteira-tabs" role="tablist" aria-label="Carteira">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "resumo"}
            className={activeTab === "resumo" ? "active" : ""}
            onClick={() => setActiveTab("resumo")}
          >
            Resumo
          </button>
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
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "arquivos"}
            className={activeTab === "arquivos" ? "active" : ""}
            onClick={() => setActiveTab("arquivos")}
          >
            Arquivos B3
          </button>
        </div>

        {activeTab === "resumo" && (
          <section className="operacao-list" role="tabpanel">

            <h2>Resumo da Carteira</h2>
            <div className="posicao-summary-grid">
              <article className="posicao-summary-card destaque">
                <span>Patrimônio Total</span>
                <strong>{formatCurrency(posicaoResumo.totalInvestido)}</strong>
              </article>
              <article className="posicao-summary-card">
                <span>Ativos em Posição</span>
                <strong>{posicaoResumo.totalAtivos}</strong>
              </article>
              <article className="posicao-summary-card">
                <span>Proventos Recebidos</span>
                <strong>{formatCurrency(proventosResumo.total)}</strong>
              </article>
            </div>

            <div className="provento-type-row">
              <span className="provento-type-pill">
                Categorias em carteira: {posicaoResumo.categorias.length}
              </span>
              <span className="provento-type-pill">
                Lançamentos de proventos: {proventosResumo.quantidade}
              </span>
              <span className="provento-type-pill">
                Ativos com histórico: {historicoOperacoesAgrupado.length}
              </span>
            </div>
            <p></p>
            <div className="resumo-chart-filter">
                <div>
                  <span>Filtrar gráficos</span>
                  <strong>
                    {resumoRangeOptions.length === 0
                      ? "Nenhuma competência disponível"
                      : `${rentabilidadeChartData.length} ${rentabilidadeChartData.length === 1 ? "competência" : "competências"}`}
                  </strong>
                </div>
                <label>
                  Início
                  <select
                    value={resumoDataInicial}
                    onChange={handleResumoDataInicialChange}
                    disabled={resumoRangeOptions.length === 0}
                  >
                    {resumoRangeOptions.length === 0 ? (
                      <option value="">Sem dados</option>
                    ) : (
                      resumoRangeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                <label>
                  Fim
                  <select
                    value={resumoDataFinal}
                    onChange={handleResumoDataFinalChange}
                    disabled={resumoRangeOptions.length === 0}
                  >
                    {resumoRangeOptions.length === 0 ? (
                      <option value="">Sem dados</option>
                    ) : (
                      resumoRangeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))
                    )}
                  </select>
                </label>
            </div>
            <section className="provento-chart-box resumo-rentabilidade-chart">
              <h3>Rentabilidade</h3>
              <span className="last-update">Base 100: rentabilidade acumulada da B3 + proventos do mês, CDI e Ibovespa no mesmo periodo</span>
              <div className="provento-chart-container">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={rentabilidadeChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="mes" />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={(value) => `${value}`}
                      width={70}
                      domain={rentabilidadeChartDomain}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "Rentabilidade acumulada") return [`${(Number(value) - 100).toFixed(2)}%`, name];
                        if (name === "CDI acumulado") return [`${(Number(value) - 100).toFixed(2)}%`, name];
                        if (name === "Ibovespa acumulado") return [`${(Number(value) - 100).toFixed(2)}%`, name];
                        return [formatCurrency(value), name];
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="rentabilidadeIndice"
                      name="Rentabilidade acumulada"
                      yAxisId="left"
                      stroke="#1d4ed8"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cdiIndice"
                      name="CDI acumulado"
                      yAxisId="left"
                      stroke="#d97706"
                      strokeWidth={3}
                      strokeDasharray="6 4"
                      dot={{ r: 4, fill: "#d97706", strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                      connectNulls
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="ibovespaIndice"
                      name="Ibovespa acumulado"
                      yAxisId="left"
                      stroke="#7c3aed"
                      strokeWidth={3}
                      strokeDasharray="3 5"
                      dot={{ r: 4, fill: "#7c3aed", strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                      connectNulls
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="provento-chart-box resumo-rentabilidade-chart">
              <h3>Valor patrimonial mensal</h3>
              <span className="last-update">Evolução do valor atualizado consolidado da carteira por competência</span>
              <div className="provento-chart-container">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={rentabilidadeChartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} width={110} />
                    <Tooltip
                      formatter={(value, name) => [formatCurrency(value), name]}
                    />
                    <Legend />
                    <Bar
                      dataKey="valorAtualizadoTotal"
                      name="Valor patrimonial"
                      fill="#0f766e"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </section>
        )}

        {activeTab === "proventos" && (
          <section className="operacao-list provento-list" role="tabpanel">
            <div className="posicao-header-flex">
              <h2>Proventos Recebidos</h2>
              <span className="last-update">
                Total acumulado: {formatCurrency(proventosResumo.total)}
              </span>
            </div>
            {proventos.length > 0 && (
              <div className="provento-view-toggle" role="tablist" aria-label="Visualizacao de proventos">
                <button
                  type="button"
                  role="tab"
                  aria-selected={proventoViewMode === "lista"}
                  className={proventoViewMode === "lista" ? "active" : ""}
                  onClick={() => setProventoViewMode("lista")}
                >
                  Lista
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={proventoViewMode === "grafico"}
                  className={proventoViewMode === "grafico" ? "active" : ""}
                  onClick={() => setProventoViewMode("grafico")}
                >
                  Gráfico
                </button>
              </div>
            )}

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

                {proventoViewMode === "grafico" ? (
                  <div className="provento-chart-grid">
                    {proventosEvolucaoPorAtivo.map((ativo, index) => (
                      <section key={ativo.nomeAtivo} className="provento-chart-box">
                        <h3>{ativo.nomeAtivo}</h3>
                        <span className="last-update">Total: {formatCurrency(ativo.total)}</span>
                        <div className="provento-chart-container">
                          <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={ativo.data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="mes" />
                              <YAxis tickFormatter={(value) => formatCurrency(value)} width={90} />
                              <Tooltip formatter={(value) => formatCurrency(value)} />
                              <Legend />
                              <Bar
                                dataKey="valor"
                                name="Dividendo"
                                fill={proventoChartColors[index % proventoChartColors.length]}
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </section>
                    ))}
                  </div>
                ) : (
                  proventosAgrupadosPorAtivo.map((grupo) => (
                    <div key={grupo.nomeAtivo} className="categoria-section">
                      <div className="categoria-header">
                        <h3>{grupo.nomeAtivo}</h3>
                        <span className="categoria-total">
                          {formatCurrency(grupo.total)}
                        </span>
                      </div>
                      <div className="provento-grid">
                        {grupo.itens.map((provento) => (
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
                  ))
                )}
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
                  const itemsOrdenados = [...categoria.items].sort((ativoA, ativoB) => {
                    const precoA = precosDoDia[ativoA.nomeAtivo];
                    const precoB = precosDoDia[ativoB.nomeAtivo];

                    const valorAtualA = precoA ? precoA * ativoA.quantidadeTotal : Number(ativoA.totalInvestido);
                    const valorAtualB = precoB ? precoB * ativoB.quantidadeTotal : Number(ativoB.totalInvestido);

                    return valorAtualB - valorAtualA;
                  });
                  return (
                    <div key={catKey} className="categoria-section">
                      <div className="categoria-header">
                        <h3>{categoria.label}</h3>
                        <span className="categoria-total">
                          {formatCurrency(categoria.totalInvestido)}
                        </span>
                      </div>
                      <div className="posicao-grid">
                        {itemsOrdenados.map((posicao) => {
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

        {activeTab === "arquivos" && (
          <section className="operacao-list arquivos-b3-list" role="tabpanel">
            <div className="posicao-header-flex">
              <h2>Arquivos B3 Importados</h2>
              <span className="last-update">
                {arquivosResumo.total} {arquivosResumo.total === 1 ? "arquivo" : "arquivos"}
              </span>
            </div>

            {arquivosImportados.length === 0 ? (
              <p className="operacao-empty">Nenhum arquivo B3 importado nesta carteira.</p>
            ) : (
              <div className="arquivos-b3-content">
                <div className="posicao-summary-grid">
                  <article className="posicao-summary-card destaque">
                    <span>Total de Arquivos</span>
                    <strong>{arquivosResumo.total}</strong>
                  </article>
                  <article className="posicao-summary-card">
                    <span>Competências</span>
                    <strong>{arquivosResumo.competencias}</strong>
                  </article>
                  <article className="posicao-summary-card">
                    <span>Última Importação</span>
                    <strong>{arquivosResumo.ultimaImportacao?.mesReferencia || "-"}</strong>
                  </article>
                </div>

                <div className="arquivo-b3-table-wrap">
                  <table className="arquivo-b3-table">
                    <thead>
                      <tr>
                        <th>Arquivo</th>
                        <th>Competência</th>
                        <th>Tipo</th>
                        <th>Importado em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {arquivosImportados.map((arquivo) => (
                        <tr key={arquivo.id}>
                          <td>
                            <div className="arquivo-b3-name">
                              <FaFileExcel />
                              <span>{arquivo.nomeArquivo}</span>
                            </div>
                          </td>
                          <td>
                            {arquivo.mesReferencia}/{arquivo.anoCompetencia}
                          </td>
                          <td>
                            <span className={`arquivo-b3-badge ${arquivo.tipoImportacao?.toLowerCase()}`}>
                              {arquivo.tipoImportacao === "INICIAL" ? "Inicial" : "Atualização"}
                            </span>
                          </td>
                          <td>{formatDateTime(arquivo.dataImportacao)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "operacoes" && (
          <>
            <section className="operacao-list">
              <h2>Histórico de Operações</h2>

              {operacoes.length === 0 ? (
                <p className="operacao-empty">Nenhuma operacao registrada.</p>
              ) : (
                historicoOperacoesAgrupado.map((grupo) => (
                  <div key={grupo.nomeAtivo} className="categoria-section">
                    <div className="categoria-header">
                      <h3>{grupo.nomeAtivo}</h3>
                      <span className="categoria-total">
                        Movimentado: {formatCurrency(grupo.totalCompras + grupo.totalVendas)}
                      </span>
                    </div>

                    <div className="operacao-group-summary">
                      <span className="operacao-resumo-item compra">
                        Compras: {formatCurrency(grupo.totalCompras)}
                      </span>
                      <span className="operacao-resumo-item venda">
                        Vendas: {formatCurrency(grupo.totalVendas)}
                      </span>
                    </div>

                    {grupo.itens.map((operacao) => (
                      <article key={operacao.id} className="operacao-item">
                        <div>
                          <span
                            className={`operacao-badge ${operacao.tipoTransacao.toLowerCase()}`}
                          >
                            {operacao.tipoTransacao === "COMPRA" ? "Compra" : "Venda"}
                          </span>
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
                    ))}
                  </div>
                ))
              )}
            </section>
          </>
        )}

        {openOperacaoModal && (
          <div
            className="operacao-modal-overlay"
            onClick={() => setOpenOperacaoModal(false)}
          >
            <section
              className="operacao-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Registrar operação"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="operacao-modal-header">
                <h2>Registrar operação</h2>
                <button
                  type="button"
                  className="operacao-modal-close"
                  onClick={() => setOpenOperacaoModal(false)}
                >
                  Fechar
                </button>
              </div>

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
          </div>
        )}
      </main>
    </div>
  );
}
