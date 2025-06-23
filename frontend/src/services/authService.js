const API_URL = 'http://localhost:8000/api';

export const authService = {
    async login(email, password) {
        try {
            const response = await fetch(`${API_URL}/auth/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error('Ошибка входа');
            }

            const data = await response.json();
            // Сохраняем токен в localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data.user;
        } catch (error) {
            console.error('Ошибка при входе:', error);
            throw error;
        }
    },

    async logout() {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/auth/logout/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
        } catch (error) {
            console.error('Ошибка при выходе:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    },

    async updateProfile(profileData) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/auth/profile/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(profileData),
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error('Ошибка обновления профиля');
                error.data = data;
                throw error;
            }

            localStorage.setItem('user', JSON.stringify(data));
            return data;
        } catch (error) {
            throw error;
        }
    },

    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated() {
        return !!localStorage.getItem('token');
    }
}; 