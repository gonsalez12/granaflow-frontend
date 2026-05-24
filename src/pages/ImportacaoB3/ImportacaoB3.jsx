import React, { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { FaArrowLeft, FaFileExcel } from "react-icons/fa";
import MenuLogado from "../../components/MenuLogado/MenuLogado.jsx";
import { API_BASE_URL, getAuthHeaders } from "../../config/api";
import "./ImportacaoB3.css";

export default function ImportacaoB3() {
  const { id, modo } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const carteira = location.state?.carteira;
  const isAtualizacao = modo === "atualizacao";
  const endpointBase = isAtualizacao
    ? `${API_BASE_URL}/importacao/b3/atualizacao`
    : `${API_BASE_URL}/importacao/b3/inicial`;
  const tituloModo = isAtualizacao ? "Atualizacao da carteira" : "Importacao inicial";
  const descricaoModo = isAtualizacao
    ? "Vamos comparar a posicao da planilha da B3 com a carteira atual e gerar apenas os ajustes necessarios."
    : "Vamos montar a carteira inicial a partir da posicao atual do arquivo consolidado da B3.";

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [selecionados, setSelecionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview([]);
      setSelecionados([]);
      setError("");
      setSuccess("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Selecione um arquivo para importar.");
      return;
    }

    setLoading(true);
    setError("");
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const previewUrl = `${endpointBase}/preview?carteiraId=${id}`;

      const response = await fetch(previewUrl, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
        },
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.erro || "Erro ao processar o arquivo. Verifique se o formato esta correto.");
      }

      const data = await response.json();
      setPreview(data);
      setSelecionados(data.map((_, index) => index)); // Seleciona todos por padrão
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelecao = (index) => {
    if (selecionados.includes(index)) {
      setSelecionados(selecionados.filter((i) => i !== index));
    } else {
      setSelecionados([...selecionados, index]);
    }
  };

  const handleConfirmar = async () => {
    if (selecionados.length === 0) {
      setError("Selecione ao menos um item para importar.");
      return;
    }

    setLoading(true);
    setError("");

    const dadosParaEnviar = preview.filter((_, index) => selecionados.includes(index));
    const formData = new FormData();
    formData.append("file", file);
    formData.append("selecionados", new Blob([JSON.stringify(dadosParaEnviar)], { type: "application/json" }));

    try {
      const response = await fetch(
        `${endpointBase}/confirmar?carteiraId=${id}&nomeArquivo=${encodeURIComponent(file.name)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.erro || "Erro ao confirmar importacao.");
      }

      setSuccess(isAtualizacao ? "Atualizacao concluida com sucesso!" : "Importacao inicial concluida com sucesso!");
      setTimeout(() => navigate(`/carteiras/${id}/operacoes`, { state: { carteira } }), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="importacao-container">
      <MenuLogado />

      <main className="importacao-content">
        <button
          className="importacao-back"
          type="button"
          onClick={() => navigate(`/carteiras/${id}/operacoes`, { state: { carteira } })}
        >
          <FaArrowLeft /> Voltar
        </button>

        <header className="importacao-header">
          <div>
            <span>Arquivo consolidado B3</span>
            <h1>{carteira?.nome || `Carteira ${id}`}</h1>
            <p className="importacao-subtitle">{tituloModo}</p>
          </div>
          <FaFileExcel className="importacao-header-icon" />
        </header>

        <section className="importacao-panel">
          {!preview.length ? (
            <div className="upload-box">
              <div className={`importacao-mode-banner ${isAtualizacao ? "atualizacao" : "inicial"}`}>
                <strong>{tituloModo}</strong>
                <span>{descricaoModo}</span>
              </div>

              <h2>Selecione o arquivo Excel consolidado da B3</h2>
              <p>O sistema vai ler as abas de posicao e mostrar uma previa antes de aplicar.</p>
              
              <div className="file-input-wrapper">
                <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} id="b3-file" />
                <label htmlFor="b3-file">
                  {file ? file.name : "Clique para selecionar o arquivo"}
                </label>
              </div>

              <button 
                className="btn-upload" 
                onClick={handleUpload} 
                disabled={!file || loading}
              >
                {loading ? "Processando..." : "Gerar Prévia"}
              </button>
            </div>
          ) : (
            <div className="preview-box">
              <div className="preview-header">
                <h2>Previa da {tituloModo.toLowerCase()} ({selecionados.length} de {preview.length} itens)</h2>
                <div className="preview-actions">
                  <button className="btn-cancel" onClick={() => setPreview([])}>Trocar Arquivo</button>
                  <button className="btn-confirm" onClick={handleConfirmar} disabled={loading}>
                    {loading ? "Salvando..." : isAtualizacao ? "Confirmar Atualizacao" : "Confirmar Importacao"}
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th><input type="checkbox" checked={selecionados.length === preview.length} onChange={() => {
                        if (selecionados.length === preview.length) setSelecionados([]);
                        else setSelecionados(preview.map((_, i) => i));
                      }} /></th>
                      <th>Data</th>
                      <th>Ativo</th>
                      <th>Tipo</th>
                      <th>Qtd</th>
                      <th>Preço Unit.</th>
                      <th>Total</th>
                      <th>Info / Posicao</th>
                      <th>Origem (Aba)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((item, index) => (
                      <tr key={index} className={selecionados.includes(index) ? "row-selected" : "row-unselected"}>
                        <td>
                          <input 
                            type="checkbox" 
                            checked={selecionados.includes(index)} 
                            onChange={() => toggleSelecao(index)} 
                          />
                        </td>
                        <td>{new Date(item.data).toLocaleDateString("pt-BR")}</td>
                        <td><strong>{item.nomeAtivo}</strong></td>
                        <td>
                          <span className={`badge ${item.tipoTransacao.toLowerCase()}`}>
                            {item.tipoTransacao === "COMPRA" ? "Compra" : "Venda"}
                          </span>
                        </td>
                        <td>{item.quantidade}</td>
                        <td>{Number(item.valorUnitario).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                        <td>{Number(item.valorTotal).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                        <td>
                          {item.posicaoAtual && (
                            <div className="importacao-info-cell">
                              <span className="posicao-info">{item.posicaoAtual}</span>
                              {item.observacao && <small>{item.observacao}</small>}
                            </div>
                          )}
                        </td>
                        <td><small>{item.origem}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && <p className="importacao-error">{error}</p>}
          {success && <p className="importacao-success">{success}</p>}
        </section>
      </main>
    </div>
  );
}
