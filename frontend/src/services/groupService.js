const API_URL = 'http://localhost:8000/api';

export const groupService = {
    async getMyGroups() {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/my-groups/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!res.ok) throw new Error('Ошибка загрузки групп');
        return await res.json();
    },
    async createGroup({ name, info }) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/create-group/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, info }),
        });
        if (!res.ok) throw new Error('Ошибка создания группы');
        return await res.json();
    },
    async deleteGroup(groupId) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/groups/${groupId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!res.ok) throw new Error('Ошибка удаления группы');
        return true;
    },
    async excludeMember(groupId, userId) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/groups/${groupId}/exclude/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: userId }),
        });
        if (!res.ok) throw new Error('Ошибка исключения участника');
        return await res.json();
    },
    async leaveGroup(groupId) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/groups/${groupId}/leave/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!res.ok) throw new Error('Ошибка выхода из группы');
        return await res.json();
    },
    // Здесь будут другие методы: getGroup, createGroup, ...
}; 