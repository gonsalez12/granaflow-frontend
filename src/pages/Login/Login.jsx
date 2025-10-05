import React from "react";
import "./Login.css";

export default function Login() {
  return (
    <div className="login-container">

      <div className="login-box">
        <h2>Bem-vindo ao GranFlow</h2>
        <p className="login-subtitle">
          Faça login para gerenciar seus gastos e investimentos.
        </p>

        <form className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="Digite seu email" required />
          </div>

          <div className="form-group">
            <label>Senha</label>
            <input type="password" placeholder="Digite sua senha" required />
          </div>

          <button type="submit" className="login-button">Entrar</button>
        </form>

        <p className="register-link">
          Não tem conta? <a href="/register">Cadastre-se</a>
        </p>
      </div>
    </div>
  );
}
