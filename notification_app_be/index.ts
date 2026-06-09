import { logMessage } from '../logging_middleware/logger';

type NotificationType = 'Placement' | 'Result' | 'Event';

interface Notification {
  ID: string;
  Type: NotificationType;
  Message: string;
  Timestamp: string;
}

// priority weights - placement is most important, event is least
const weights: Record<NotificationType, number> = {
  'Placement': 3,
  'Result': 2,
  'Event': 1
};

async function getTop10Notifications() {
  const url = 'http://4.224.186.213/evaluation-service/notifications';

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

    const data = await res.json();
    const notifications: Notification[] = data.notifications || [];

    // sort by priority weight first, then by newest timestamp
    notifications.sort((a, b) => {
      const wA = weights[a.Type] || 0;
      const wB = weights[b.Type] || 0;
      if (wB !== wA) return wB - wA;
      return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime();
    });

    const top10 = notifications.slice(0, 10);
    logMessage('info', `Got ${top10.length} priority notifications`);
    return top10;

  } catch (err: any) {
    logMessage('error', `Failed to fetch: ${err.message}`);
    return [];
  }
}

// main
(async () => {
  const results = await getTop10Notifications();
  logMessage('info', JSON.stringify(results, null, 2));
})();
