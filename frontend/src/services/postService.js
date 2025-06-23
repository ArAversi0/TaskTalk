import api from './api';

const postService = {
    getGroupPosts: async (groupId) => {
        const response = await api.get(`/groups/${groupId}/posts/`);
        return response.data;
    },

    createPost: async (groupId, postData) => {
        // Если есть файлы, отправляем через FormData
        if (postData.files && postData.files.length > 0) {
            const formData = new FormData();
            formData.append('title', postData.title);
            formData.append('content', postData.content);
            if (postData.deadline) formData.append('deadline', postData.deadline);
            postData.files.forEach(file => formData.append('files', file));
            const response = await api.post(`/groups/${groupId}/posts/`, formData);
            return response.data;
        } else {
            const response = await api.post(`/groups/${groupId}/posts/`, postData);
            return response.data;
        }
    },

    getPost: async (groupId, postId) => {
        const response = await api.get(`/groups/${groupId}/posts/${postId}/`);
        return response.data;
    },

    addComment: async (groupId, postId, commentData) => {
        const response = await api.post(`/groups/${groupId}/posts/${postId}/comments/`, commentData);
        return response.data;
    },

    deleteComment: async (groupId, postId, commentId) => {
        const response = await api.delete(`/groups/${groupId}/posts/${postId}/comments/${commentId}/`);
        return response.data;
    },

    deletePost: async (groupId, postId) => {
        const response = await api.delete(`/groups/${groupId}/posts/${postId}/`);
        return response.data;
    },

    updatePost: async (groupId, postId, postData) => {
        // Если есть файлы или файлы на удаление, отправляем через FormData
        const formData = new FormData();
        if (postData.title !== undefined) formData.append('title', postData.title);
        if (postData.content !== undefined) formData.append('content', postData.content);
        if (postData.deadline !== undefined) formData.append('deadline', postData.deadline);
        if (postData.file_ids_to_delete && postData.file_ids_to_delete.length > 0) {
            formData.append('file_ids_to_delete', JSON.stringify(postData.file_ids_to_delete));
        }
        if (postData.files && postData.files.length > 0) {
            postData.files.forEach(file => formData.append('files', file));
        }
        const response = await api.patch(`/groups/${groupId}/posts/${postId}/`, formData);
        return response.data;
    }
};

export default postService; 