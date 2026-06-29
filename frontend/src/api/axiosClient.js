import axios from "axios";

const axiosClient = axios.create({
  baseURL: "https://192.168.1.8:7083",
  headers: { "Content-Type": "application/json" },
});

// Intercepteur : ajoute automatiquement le token JWT à chaque requête
// (c'est ça le "middleware token" dont parlait ton tuteur)
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;