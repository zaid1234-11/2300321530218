import 'dotenv/config';
import { logMessage } from '../logging_middleware/logger';

type NotificationType = 'Placement' | 'Result' | 'Event';

interface Notification {
  ID: string;
  Type: NotificationType;
  Message: string;
  Timestamp: string;
}

const API_TOKEN = process.env.API_TOKEN || '';
const BASE_URL = 'http://20.244.56.144/evaluation-service';

async function getNotifications() {
  const url = `${BASE_URL}/notifications`;

  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

    const data = await res.json();
    const notifications: Notification[] = data.notifications || [];

    logMessage('info', `Got ${notifications.length} notifications`);
    return notifications;

  } catch (err: any) {
    logMessage('error', `Failed to fetch: ${err.message}`);
    return [];
  }
}

// main
(async () => {
  const results = await getNotifications();
  logMessage('info', JSON.stringify(results, null, 2));
})();
