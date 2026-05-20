const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface AdminResponse {
    success: boolean;
    error?: string;
    token?: string;
    users?: any[];
    reset_token?: string;
}

export const adminLogin = async (password: string): Promise<AdminResponse> => {
    try {
        const response = await fetch(`${API_URL}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });
        const data = await response.json();
        if (!response.ok) {
            return { success: false, error: data.detail || 'Login failed' };
        }
        return data;
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const fetchAllUsers = async (token: string): Promise<AdminResponse> => {
    try {
        const response = await fetch(`${API_URL}/api/admin/users`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) {
            return { success: false, error: data.detail || 'Failed to fetch users' };
        }
        return data;
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const deleteUser = async (token: string, username: string): Promise<AdminResponse> => {
    try {
        const response = await fetch(`${API_URL}/api/admin/users/${encodeURIComponent(username)}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) {
            return { success: false, error: data.detail || 'Failed to delete user' };
        }
        return data;
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const resetUserGames = async (token: string, username: string): Promise<AdminResponse> => {
    try {
        const response = await fetch(`${API_URL}/api/admin/users/${encodeURIComponent(username)}/reset-games`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) {
            return { success: false, error: data.detail || 'Failed to reset games' };
        }
        return data;
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const clearAllGames = async (token: string): Promise<AdminResponse> => {
    try {
        const response = await fetch(`${API_URL}/api/admin/games/clear-all`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) {
            return { success: false, error: data.detail || 'Failed to clear all games' };
        }
        return data;
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const generateResetLink = async (token: string, username: string): Promise<AdminResponse> => {
    try {
        const response = await fetch(`${API_URL}/api/admin/users/${encodeURIComponent(username)}/generate-reset-link`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) {
            return { success: false, error: data.detail || 'Failed to generate reset link' };
        }
        return data;
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const fetchWords = async (token: string): Promise<{success: boolean, error?: string, words?: string[]}> => {
    try {
        const response = await fetch(`${API_URL}/api/admin/words`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) {
            return { success: false, error: data.detail || 'Failed to fetch words' };
        }
        return data;
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const addWord = async (token: string, word: string): Promise<AdminResponse> => {
    try {
        const response = await fetch(`${API_URL}/api/admin/words`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ word })
        });
        const data = await response.json();
        if (!response.ok) {
            return { success: false, error: data.detail || 'Failed to add word' };
        }
        return data;
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const deleteWord = async (token: string, word: string): Promise<AdminResponse> => {
    try {
        const response = await fetch(`${API_URL}/api/admin/words/${encodeURIComponent(word)}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) {
            return { success: false, error: data.detail || 'Failed to delete word' };
        }
        return data;
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const fetchSystemStats = async (token: string): Promise<{success: boolean, error?: string, stats?: any}> => {
    try {
        const response = await fetch(`${API_URL}/api/admin/system`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) {
            return { success: false, error: data.detail || 'Failed to fetch system stats' };
        }
        return data;
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const renameUser = async (token: string, username: string, new_username: string): Promise<AdminResponse> => {
    try {
        const response = await fetch(`${API_URL}/api/admin/users/${encodeURIComponent(username)}/rename`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ new_username })
        });
        const data = await response.json();
        if (!response.ok) {
            return { success: false, error: data.detail || 'Failed to rename user' };
        }
        return data;
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};

export const fetchUserStats = async (token: string, username: string): Promise<{success: boolean, error?: string, stats?: any}> => {
    try {
        const response = await fetch(`${API_URL}/api/admin/users/${encodeURIComponent(username)}/stats`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) {
            return { success: false, error: data.detail || 'Failed to fetch user stats' };
        }
        return data;
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
};
