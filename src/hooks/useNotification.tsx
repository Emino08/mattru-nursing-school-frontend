import { useState, useEffect } from 'react';
import api from '@/services/api';

interface Notification {
    id: number;
    type: string;
    message: string;
    sent_at: string;
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        api
            .get('/api/applicant/notifications')
            .then((res) => setNotifications(res.data))
            .catch(console.error);
    }, []);

    return notifications;
}