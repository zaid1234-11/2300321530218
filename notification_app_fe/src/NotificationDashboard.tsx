import { useEffect, useState } from 'react';
import {
  Alert, AppBar, Box, Button, Chip, CircularProgress, Container,
  FormControl, InputLabel, List, ListItem, ListItemText, MenuItem,
  Paper, Select, Stack, Toolbar, Typography,
} from '@mui/material';

type NotificationType = 'Placement' | 'Result' | 'Event';
type TypeFilter = 'all' | NotificationType;

interface Notification {
  ID: string;
  Type: NotificationType;
  Message: string;
  Timestamp: string;
}

const chipColors: Record<NotificationType, 'error' | 'warning' | 'info'> = {
  'Placement': 'error',
  'Result': 'warning',
  'Event': 'info',
};

const API_TOKEN = import.meta.env.VITE_API_TOKEN || '';
const AUTH_TOKEN_KEY = 'auth_token';
const ACCESS_TOKEN_KEY = 'access_token';
const READ_KEY = 'readNotifs';
const API_URL = 'http://4.224.186.213/evaluation-service/notifications';
const PAGE_SIZE = 10;

function buildUrl(page: number, limit: number, notificationType: TypeFilter) {
  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page),
  });

  if (notificationType !== 'all') {
    params.set('notification_type', notificationType);
  }

  return `${API_URL}?${params.toString()}`;
}

function buildAuthHeader(token: string) {
  const trimmedToken = token.trim();
  return trimmedToken.toLowerCase().startsWith('bearer ')
    ? trimmedToken
    : `Bearer ${trimmedToken}`;
}

function getSavedToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
    || localStorage.getItem(ACCESS_TOKEN_KEY)
    || API_TOKEN;
}

export default function NotificationDashboard() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [read, setRead] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(READ_KEY);
    if (saved) {
      try {
        setRead(JSON.parse(saved));
      } catch {
        localStorage.removeItem(READ_KEY);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const token = getSavedToken();

    setLoading(true);
    setError('');

    if (!token) {
      setNotifications([]);
      setLoading(false);
      return () => controller.abort();
    }

    fetch(buildUrl(page, PAGE_SIZE, typeFilter), {
      signal: controller.signal,
      headers: {
        ...(token ? { 'Authorization': buildAuthHeader(token) } : {}),
        'Content-Type': 'application/json',
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        return res.json();
      })
      .then(data => setNotifications(data.notifications || []))
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Unable to load notifications');
          setNotifications([]);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [page, typeFilter]);

  function markAsRead(id: string) {
    if (!read.includes(id)) {
      const updated = [...read, id];
      setRead(updated);
      localStorage.setItem(READ_KEY, JSON.stringify(updated));
    }
  }

  const hasNextPage = notifications.length === PAGE_SIZE;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>
            Campus Notification Portal
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
              All Notifications
            </Typography>
            <Typography color="text.secondary">
              Browse every campus notification from the protected API.
            </Typography>
          </Box>

          {!getSavedToken() && (
            <Alert severity="warning">
              Access token not found. Set access_token in localStorage and refresh the page.
            </Alert>
          )}

          {error && <Alert severity="error">{error}</Alert>}

          <Paper elevation={1} sx={{ overflow: 'hidden', borderRadius: 2 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List disablePadding>
                {notifications.length === 0 ? (
                  <ListItem sx={{ py: 4 }}>
                    <ListItemText primary="No notifications found." />
                  </ListItem>
                ) : (
                  notifications.map(notification => {
                    const unread = !read.includes(notification.ID);
                    return (
                      <ListItem
                        key={notification.ID}
                        divider
                        onClick={() => markAsRead(notification.ID)}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: unread ? 'rgba(25, 118, 210, 0.07)' : 'transparent',
                          alignItems: 'flex-start',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
                          <Stack direction="row" spacing={1} sx={{ minWidth: 150 }}>
                            <Chip label={notification.Type} color={chipColors[notification.Type]} size="small" />
                            {unread && <Chip label="NEW" color="primary" size="small" />}
                          </Stack>
                          <ListItemText
                            primary={notification.Message}
                            secondary={new Date(notification.Timestamp).toLocaleString()}
                            slotProps={{
                              primary: {
                                sx: { fontWeight: unread ? 800 : 500 }
                              }
                            }}
                          />
                        </Stack>
                      </ListItem>
                    );
                  })
                )}
              </List>
            )}
          </Paper>

          <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', alignItems: 'center' }}>
            <Button variant="outlined" disabled={page === 1 || loading} onClick={() => setPage(current => Math.max(1, current - 1))}>
              Previous
            </Button>
            <Typography color="text.secondary">Page {page}</Typography>
            <Button variant="contained" disabled={!hasNextPage || loading} onClick={() => setPage(current => current + 1)}>
              Next
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
