import React from "react";
import "./Register.css";

export default function Register() {
  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Crie sua conta</h2>
        <p className="register-subtitle">Preencha os dados abaixo para começar a usar o GranFlow</p>
        
        <form className="register-form">
          <div className="form-group">
            <label>Nome</label>
            <input type="text" placeholder="Digite seu nome completo" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="Digite seu email" />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input type="password" placeholder="Digite sua senha" />
          </div>
          <button type="submit" className="register-button">Cadastrar</button>
        </form>

        <p className="login-link">
          Já tem conta? <a href="/login">Entrar</a>
        </p>
      </div>
    </div>
  );
}
