// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
});

// antes de cada pedido, mete o token (se existir)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
