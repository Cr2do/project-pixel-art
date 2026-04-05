import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Ajoute automatiquement le token si présent
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
	const token = localStorage.getItem('token');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Redirige vers /login si le token est expiré
api.interceptors.response.use(
	(response: AxiosResponse) => response,
	(error: AxiosError) => {
		if (error.response?.status === 401) {
			localStorage.removeItem('token');
			window.location.href = '/login';
		}
		return Promise.reject(error);
	},
);

export default api;
