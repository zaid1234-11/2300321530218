import { useEffect, useState } from 'react';
import {
  Container, Typography, List, ListItem, ListItemText,
  Button, ButtonGroup, Chip, Box, Pagination, CircularProgress,
} from '@mui/material';

type NotificationType = 'Placement' | 'Result' | 'Event';

interface Notification {
  ID: string;
  Type: NotificationType;
  Message: string;
  Timestamp: string;
}

const weights: Record<NotificationType, number> = {
  'Placement': 3,
  'Result': 2,
  'Event': 1,
};

const chipColors: Record<NotificationType, 'error' | 'warning' | 'info'> = {
  'Placement': 'error',
  'Result': 'warning',
  'Event': 'info',
};

const API_TOKEN = import.meta.env.VITE_API_TOKEN || '';
const AUTH_TOKEN_KEY = 'auth_token';

export default function NotificationDashboard() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'priority'>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [read, setRead] = useState<string[]>([]);

  const perPage = 5;

  // load read items from localstorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('readNotifs');
    if (saved) setRead(JSON.parse(saved));
  }, []);

  // fetch notifications
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || API_TOKEN;

    setLoading(true);
    fetch('http://4.224.186.213/evaluation-service/notifications', {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      }
    })
      .then(res => res.json())
      .then(data => setNotifications(data.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function markAsRead(id: string) {
    if (!read.includes(id)) {
      const updated = [...read, id];
      setRead(updated);
      localStorage.setItem('readNotifs', JSON.stringify(updated));
    }
  }

  // get sorted or unsorted list based on filter
  function getList() {
    if (filter === 'all') return notifications;
    return [...notifications].sort((a, b) => {
      const diff = (weights[b.Type] || 0) - (weights[a.Type] || 0);
      if (diff !== 0) return diff;
      return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime();
    });
  }

  const list = getList();
  const pageItems = list.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(list.length / perPage);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'start', sm: 'center' },
        gap: 2, mb: 3
      }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Campus Notification Portal
        </Typography>

        <ButtonGroup variant="contained" disableElevation>
          <Button
            variant={filter === 'all' ? 'contained' : 'outlined'}
            onClick={() => { setFilter('all'); setPage(1); }}
          >
            All
          </Button>
          <Button
            variant={filter === 'priority' ? 'contained' : 'outlined'}
            onClick={() => { setFilter('priority'); setPage(1); }}
          >
            Priority Inbox
          </Button>
        </ButtonGroup>
      </Box>

      <List sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
        {pageItems.length === 0 ? (
          <ListItem>
            <ListItemText primary="No notifications found." />
          </ListItem>
        ) : (
          pageItems.map(n => {
            const unread = !read.includes(n.ID);
            return (
              <ListItem
                key={n.ID}
                divider
                onClick={() => markAsRead(n.ID)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: unread ? 'rgba(25,118,210,0.04)' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Chip label={n.Type} color={chipColors[n.Type]} size="small" />
                  <ListItemText
                    primary={n.Message}
                    secondary={new Date(n.Timestamp).toLocaleString()}
                    slotProps={{
                      primary: {
                        sx: { fontWeight: unread ? 700 : 400 }
                      }
                    }}
                  />
                  {unread && <Chip label="NEW" color="primary" size="small" />}
                </Box>
              </ListItem>
            );
          })
        )}
      </List>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
          />
        </Box>
      )}
    </Container>
  );
}
