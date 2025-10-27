import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Dashboard from "./pages/Dashboard/Dashboard";
import PerfilFinanceiro from "./pages/PerfilFinanceiro/PerfilFinanceiro";

import PrivateRoute from "./config/PrivateRoute";
import { AuthProvider } from "./config/AuthContext";


export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/perfil-financeiro" element={<PrivateRoute><PerfilFinanceiro/></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}