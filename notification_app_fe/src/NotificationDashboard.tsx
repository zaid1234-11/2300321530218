import { useEffect, useState } from 'react';
import {
  Alert, AppBar, Box, Button, Chip, CircularProgress, Container,
  FormControl, InputLabel, List, ListItem, ListItemText, MenuItem,
  Paper, Select, Stack, Toolbar, Typography,
} from '@mui/material';

type NotificationType = 'Placement' | 'Result' | 'Event';
type TypeFilter = 'all' | NotificationType;
type PageView = 'notifications' | 'priority';

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
const READ_KEY = 'readNotifs';
const API_URL = 'http://4.224.186.213/evaluation-service/notifications';
const PAGE_SIZE = 10;
const PRIORITY_LIMIT = 10;
const PRIORITY_FETCH_LIMIT = 50;

function getRoute(): PageView {
  return window.location.hash === '#/priority' ? 'priority' : 'notifications';
}

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

function sortByPriority(a: Notification, b: Notification) {
  const priorityDiff = (weights[b.Type] || 0) - (weights[a.Type] || 0);
  if (priorityDiff !== 0) return priorityDiff;
  return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime();
}

export default function NotificationDashboard() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [view, setView] = useState<PageView>(getRoute);
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
    const onHashChange = () => setView(getRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem(AUTH_TOKEN_KEY) || API_TOKEN;
    const requestPage = view === 'priority' ? 1 : page;
    const requestLimit = view === 'priority' ? PRIORITY_FETCH_LIMIT : PAGE_SIZE;

    setLoading(true);
    setError('');

    fetch(buildUrl(requestPage, requestLimit, typeFilter), {
      signal: controller.signal,
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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
  }, [page, typeFilter, view]);

  function markAsRead(id: string) {
    if (!read.includes(id)) {
      const updated = [...read, id];
      setRead(updated);
      localStorage.setItem(READ_KEY, JSON.stringify(updated));
    }
  }

  function changeView(nextView: PageView) {
    setPage(1);
    window.location.hash = nextView === 'priority' ? '#/priority' : '#/notifications';
  }

  const priorityItems = notifications
    .filter(notification => !read.includes(notification.ID))
    .sort(sortByPriority)
    .slice(0, PRIORITY_LIMIT);
  const visibleItems = view === 'priority' ? priorityItems : notifications;
  const hasNextPage = view === 'notifications' && notifications.length === PAGE_SIZE;

  const title = view === 'priority' ? 'Priority Inbox' : 'All Notifications';
  const subtitle = view === 'priority'
    ? 'Top 10 unread notifications ranked by Placement, Result, Event, then newest first.'
    : 'Browse every campus notification from the protected API.';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>
            Campus Notification Portal
          </Typography>
          <Button color="inherit" variant={view === 'notifications' ? 'outlined' : 'text'} onClick={() => changeView('notifications')}>
            All
          </Button>
          <Button color="inherit" variant={view === 'priority' ? 'outlined' : 'text'} onClick={() => changeView('priority')}>
            Priority
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: { xs: 3, sm: 5 } }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                {title}
              </Typography>
              <Typography color="text.secondary">
                {subtitle}
              </Typography>
            </Box>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="notification-type-label">Type</InputLabel>
              <Select
                labelId="notification-type-label"
                value={typeFilter}
                label="Type"
                onChange={(event) => {
                  setTypeFilter(event.target.value as TypeFilter);
                  setPage(1);
                }}
              >
                <MenuItem value="all">All types</MenuItem>
                <MenuItem value="Placement">Placement</MenuItem>
                <MenuItem value="Result">Result</MenuItem>
                <MenuItem value="Event">Event</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {!localStorage.getItem(AUTH_TOKEN_KEY) && !API_TOKEN && (
            <Alert severity="warning">
              Paste your access token in localStorage as auth_token, then refresh.
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
                {visibleItems.length === 0 ? (
                  <ListItem sx={{ py: 4 }}>
                    <ListItemText
                      primary="No notifications found."
                      secondary={view === 'priority' ? 'Read notifications are hidden from Priority Inbox.' : undefined}
                    />
                  </ListItem>
                ) : (
                  visibleItems.map(notification => {
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

          {view === 'notifications' && (
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', alignItems: 'center' }}>
              <Button variant="outlined" disabled={page === 1 || loading} onClick={() => setPage(current => Math.max(1, current - 1))}>
                Previous
              </Button>
              <Typography color="text.secondary">Page {page}</Typography>
              <Button variant="contained" disabled={!hasNextPage || loading} onClick={() => setPage(current => current + 1)}>
                Next
              </Button>
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
