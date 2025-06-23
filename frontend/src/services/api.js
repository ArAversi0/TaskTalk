import axios from 'axios';

const API_URL = 'http://localhost:8000/api'; // Замените на ваш актуальный адрес API

const api = axios.create({
    baseURL: API_URL,
    // headers: {
    //     'Authorization': `Bearer ${localStorage.getItem('token')}`,
    //     'Content-Type': 'application/json',
    // },
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (!(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
    } else {
        delete config.headers['Content-Type'];
    }
    return config;
});

export default api;

export const getNotifications = async () => {
    const response = await api.get('/notifications/');
    return response.data;
};

export const invitationAction = async (inviteId, action) => {
    const response = await api.post(`/invitations/${inviteId}/${action}/`);
    return response.data;
};

export const inviteToGroup = async (groupId, email) => {
    const response = await api.post(`/groups/${groupId}/invite/`, { email });
    return response.data;
};

export const getUserProfile = async (userId) => {
    const response = await fetch(`${API_URL}/users/${userId}/profile/`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch user profile');
    }
    return response.json();
}; 