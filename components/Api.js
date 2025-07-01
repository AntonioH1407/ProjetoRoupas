import axios from "axios";

const API_BASE_URL = "https://campusinteligente.ifsuldeminas.edu.br/api/v1";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

let accessToken = null;
let refreshToken = null;

export const setAuthToken = (token) => {
    accessToken = token;
    if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common["Authorization"];
    }
};

export const setRefreshToken = (token) => {
    refreshToken = token;
};

export const login = async (username, password) => {
    try {
        const json = { "username": username, "password": password };
        const response = await api.post('/token/', json);
        setAuthToken(response.data.access);
        setRefreshToken(response.data.refresh);
        return response.data;
    } catch (error) {
        console.log("Login error:", error); // Mostra o erro completo se houver falha
        throw error;
    }
};

// Função para fazer refresh do token usando access e refresh
const refreshAccessToken = async () => {
    try {
        const response = await api.post('/refresh/token/', { access: accessToken, refresh: refreshToken });
        // Espera receber novos tokens
        if (response.data.access) setAuthToken(response.data.access);
        if (response.data.refresh) setRefreshToken(response.data.refresh);
        return response.data.access;
    } catch (error) {
        setAuthToken(null);
        setRefreshToken(null);
        throw error;
    }
};

// Interceptor de resposta para lidar com token expirado
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (
            error.response &&
            error.response.data &&
            error.response.data.code === "token_not_valid" &&
            !originalRequest._retry &&
            accessToken && refreshToken
        ) {
            originalRequest._retry = true;
            try {
                const newToken = await refreshAccessToken();
                originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

// Método GET com parâmetros opcionais (id, profundidade)
export const get = async (aplicacao, tabela, id = null, profundidade = null) => {
    try {
        let url = `/${aplicacao}/${tabela}/`;
        if (id) url += `${id}/`;
        if (profundidade) url += `?depth=${profundidade}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return Promise.reject(error.response.data);
        }
        return Promise.reject(error);
    }
};

// Método CREATE
export const create = async (aplicacao, tabela, data) => {
    try {
        const url = `/${aplicacao}/${tabela}/`;
        const response = await api.post(url, data);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return Promise.reject(error.response.data);
        }
        return Promise.reject(error);
    }
};
// Método UPDATE (PATCH)
export const update = async (aplicacao, tabela, id, data) => {
    try {
        const url = `/${aplicacao}/${tabela}/${id}/`;
        const response = await api.patch(url, data);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return Promise.reject(error.response.data);
        }
        return Promise.reject(error);
    }
};

// Método DELETE
export const remove = async (aplicacao, tabela, id) => {
    try {
        const url = `/${aplicacao}/${tabela}/${id}/`;
        const response = await api.delete(url);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            return Promise.reject(error.response.data);
        }
        return Promise.reject(error);
    }
};