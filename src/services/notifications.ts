import api from './api';

export async function sendNotification(userId: number, type: string, message: string) {
    await api.post('/api/notifications', { user_id: userId, type, message });
}