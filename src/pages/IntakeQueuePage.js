import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  Button,
  ButtonGroup,
  Avatar,
  Divider,
  Stack,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import SmartphoneRoundedIcon from '@mui/icons-material/SmartphoneRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import Sidebar from '../components/Sidebar';
import { fetchIntakeQueue, sendIntakeToClinic, declineIntakeRequest } from '../services/onboardingService';

const getStatusChipProps = (status) => {
  if (status === 'Verified') {
    return {
      icon: <CheckCircleRoundedIcon sx={{ fontSize: '13px !important', color: '#059669 !important' }} />,
      sx: {
        fontWeight: 600,
        fontSize: '0.75rem',
        bgcolor: '#ecfdf5',
        color: '#059669',
        border: '1px solid #a7f3d0',
        px: 0.5,
      },
    };
  }
  if (status === 'Declined') {
    return {
      icon: <CancelOutlinedIcon sx={{ fontSize: '13px !important', color: '#dc2626 !important' }} />,
      sx: {
        fontWeight: 600,
        fontSize: '0.75rem',
        bgcolor: '#fef2f2',
        color: '#dc2626',
        border: '1px solid #fecaca',
        px: 0.5,
      },
    };
  }
  return {
    icon: <AccessTimeFilledRoundedIcon sx={{ fontSize: '13px !important', color: '#b45309 !important' }} />,
    sx: {
      fontWeight: 600,
      fontSize: '0.75rem',
      bgcolor: '#fef3c7',
      color: '#b45309',
      border: '1px solid #fde68a',
      px: 0.5,
    },
  };
};

const IntakeQueuePage = () => {
  const [queueData, setQueueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const filterOptions = ['All', 'Pending', 'Verified', 'Declined'];

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchIntakeQueue();
      const list = Array.isArray(data) ? data : [];
      setQueueData(list);
      setSelectedItem((prev) => {
        if (prev?.requestId) {
          const match = list.find((item) => item.requestId === prev.requestId);
          if (match) return match;
        }
        return list[0] || null;
      });
    } catch (err) {
      console.error('Failed to fetch intake queue:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    const handleFocus = () => {
      loadQueue();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadQueue]);

  const filteredQueue = useMemo(() => {
    return queueData.filter((item) => {
      const matchesFilter =
        activeFilter === 'All' || item.filterCategory.toLowerCase() === activeFilter.toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        (item.patient || '').toLowerCase().includes(query) ||
        (item.id || '').toLowerCase().includes(query) ||
        (item.doctor || '').toLowerCase().includes(query) ||
        (item.clinic || '').toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [queueData, searchQuery, activeFilter]);

  const handleSendToClinic = async () => {
    if (!selectedItem) return;
    const targetRequestId = selectedItem.requestId;

    try {
      if (selectedItem.appointment_id) {
        await sendIntakeToClinic(selectedItem.appointment_id);
      }

      setQueueData((prev) =>
        prev.map((row) =>
          row.requestId === targetRequestId
            ? { ...row, status: 'Verified', filterCategory: 'Verified' }
            : row
        )
      );
      setSelectedItem((prev) =>
        prev ? { ...prev, status: 'Verified', filterCategory: 'Verified' } : prev
      );
      setToast({
        open: true,
        message: `Approved ${selectedItem.patient} (${selectedItem.requestId}) and notified ${selectedItem.clinic}.`,
        severity: 'success',
      });
    } catch (err) {
      setToast({
        open: true,
        message: `Failed to approve intake request: ${err.message}`,
        severity: 'error',
      });
    }
  };

  const handleDecline = async () => {
    if (!selectedItem) return;
    const targetRequestId = selectedItem.requestId;

    try {
      if (selectedItem.appointment_id) {
        await declineIntakeRequest(selectedItem.appointment_id);
      }

      setQueueData((prev) =>
        prev.map((row) =>
          row.requestId === targetRequestId
            ? { ...row, status: 'Declined', filterCategory: 'Declined' }
            : row
        )
      );
      setSelectedItem((prev) =>
        prev ? { ...prev, status: 'Declined', filterCategory: 'Declined' } : prev
      );
      setToast({
        open: true,
        message: `Declined appointment request ${selectedItem.requestId} for ${selectedItem.patient}.`,
        severity: 'info',
      });
    } catch (err) {
      setToast({
        open: true,
        message: `Failed to decline intake request: ${err.message}`,
        severity: 'error',
      });
    }
  };

  const selectedStatusChip = getStatusChipProps(selectedItem?.status);

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 3,
          height: '100vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
          gap: 2.5,
        }}
      >
        {/* Header Bar */}
        <Paper
          elevation={1}
          sx={{
            p: 2.5,
            px: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Box>
            <Typography
              variant="h5"
              component="h1"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
              }}
            >
              Intake queue
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                mt: 0.25,
              }}
            >
              Records of patients who booked appointments via mobile app — verify cashless before the clinic is notified.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title="Refresh intake queue">
              <IconButton
                onClick={loadQueue}
                size="small"
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 1,
                  bgcolor: '#ffffff',
                }}
              >
                <RefreshRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Chip
              icon={<SmartphoneRoundedIcon sx={{ fontSize: '16px !important', color: '#0f766e !important' }} />}
              label="Booked via Mobile App"
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                bgcolor: '#f0fdfa',
                color: '#0f766e',
                border: '1px solid #99f6e4',
                py: 1.75,
                px: 0.75,
                borderRadius: 2,
              }}
            />

            <Chip
              avatar={
                <Avatar
                  sx={{
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                  }}
                >
                  AT
                </Avatar>
              }
              label="Alex Tan"
              variant="outlined"
              sx={{
                fontWeight: 600,
                fontSize: '0.875rem',
                borderColor: 'divider',
                bgcolor: '#ffffff',
                py: 2,
                px: 0.5,
                borderRadius: 2,
              }}
            />
          </Box>
        </Paper>

        {/* Content Area: Table Section (Left) and Detail Section (Right) */}
        <Box
          sx={{
            display: 'flex',
            flexGrow: 1,
            gap: 2.5,
            minHeight: 0,
            alignItems: 'flex-start',
          }}
        >
          {/* Table Section */}
          <Paper
            elevation={1}
            sx={{
              flex: { xs: 1, md: 2 },
              borderRadius: 2,
              p: 2.5,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.paper',
            }}
          >
            {/* Search and Filters Bar */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                mb: 2.5,
                flexWrap: 'wrap',
              }}
            >
              <TextField
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, client ID, doctor"
                sx={{
                  flexGrow: 1,
                  minWidth: 240,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#ffffff',
                  },
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <ButtonGroup
                variant="outlined"
                size="small"
                sx={{
                  bgcolor: '#f8fafc',
                  borderRadius: 2,
                  p: 0.5,
                  border: '1px solid #e2e8f0',
                  boxShadow: 'none',
                  '& .MuiButton-root': {
                    border: 'none',
                    borderRadius: '6px !important',
                    px: 1.75,
                    py: 0.6,
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    '&:hover': {
                      border: 'none',
                      bgcolor: 'rgba(0,0,0,0.04)',
                    },
                  },
                }}
              >
                {filterOptions.map((filter) => {
                  const isActive = activeFilter === filter;
                  return (
                    <Button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      sx={{
                        bgcolor: isActive ? '#2563eb !important' : 'transparent',
                        color: isActive ? '#ffffff !important' : 'text.secondary',
                        boxShadow: isActive ? '0 1px 2px rgba(37, 99, 235, 0.2)' : 'none',
                      }}
                    >
                      {filter}
                    </Button>
                  );
                })}
              </ButtonGroup>
            </Box>

            {/* Queue Table */}
            <TableContainer
              sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
              }}
            >
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>PATIENT</TableCell>
                    <TableCell>DOCTOR</TableCell>
                    <TableCell>VISIT</TableCell>
                    <TableCell>COVER</TableCell>
                    <TableCell align="right">STATUS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                        <CircularProgress size={24} sx={{ color: '#0f766e', mb: 1 }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block' }}>
                          Loading intake queue...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQueue.map((row) => {
                      const isSelected = selectedItem?.requestId === row.requestId;
                      const chipProps = getStatusChipProps(row.status);

                      return (
                        <TableRow
                          key={row.requestId || row.id}
                          hover
                          onClick={() => setSelectedItem(row)}
                          sx={{
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease',
                            bgcolor: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'inherit',
                            borderLeft: isSelected
                              ? '4px solid #10b981'
                              : '4px solid transparent',
                            '&:hover': {
                              bgcolor: isSelected
                                ? 'rgba(16, 185, 129, 0.12) !important'
                                : 'rgba(0, 0, 0, 0.02) !important',
                            },
                          }}
                        >
                          {/* Patient */}
                          <TableCell>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 600, color: 'text.primary' }}
                            >
                              {row.patient}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: 'text.secondary', fontWeight: 500 }}
                            >
                              {row.id}
                            </Typography>
                          </TableCell>

                          {/* Doctor */}
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500, color: 'text.primary' }}
                            >
                              {row.doctor}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {row.clinic}
                            </Typography>
                          </TableCell>

                          {/* Visit */}
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500, color: 'text.primary' }}
                            >
                              {row.visitDate}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {row.visitTime}
                            </Typography>
                          </TableCell>

                          {/* Cover */}
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 500,
                                color: 'text.primary',
                              }}
                            >
                              {row.cover}
                            </Typography>
                          </TableCell>

                          {/* Status */}
                          <TableCell align="right">
                            <Chip
                              size="small"
                              icon={chipProps.icon}
                              label={row.status}
                              sx={chipProps.sx}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}

                  {!loading && filteredQueue.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {queueData.length === 0
                            ? 'No appointments booked via the mobile app yet.'
                            : 'No mobile app appointment records match your search or filter.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Detail Section */}
          <Paper
            elevation={1}
            sx={{
              flex: 1,
              minWidth: 320,
              borderRadius: 2,
              p: 3,
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {selectedItem ? (
              <>
                {/* Detail Header */}
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={`REQUEST ${selectedItem.requestId}`}
                    size="small"
                    sx={{
                      bgcolor: '#f1f5f9',
                      color: '#475569',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      letterSpacing: '0.04em',
                      mb: 1.25,
                      borderRadius: 1,
                      border: '1px solid #e2e8f0',
                    }}
                  />
                  <Typography
                    variant="h6"
                    component="h2"
                    sx={{
                      fontWeight: 700,
                      color: 'text.primary',
                      lineHeight: 1.2,
                    }}
                  >
                    {selectedItem.patient}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 500,
                      mt: 0.25,
                    }}
                  >
                    {selectedItem.id}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                {/* Detail Body */}
                <Stack spacing={2} sx={{ mb: 3 }}>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'text.secondary',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mb: 0.5,
                      }}
                    >
                      <MedicalServicesOutlinedIcon sx={{ fontSize: 15 }} /> Doctor & Clinic
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {selectedItem.doctor} · {selectedItem.clinic}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'text.secondary',
                        display: 'block',
                        mb: 0.5,
                      }}
                    >
                      Specialty
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {selectedItem.specialty}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'text.secondary',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mb: 0.5,
                      }}
                    >
                      <EventAvailableOutlinedIcon sx={{ fontSize: 15 }} /> Visit Schedule
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {selectedItem.visitDate} · {selectedItem.visitTime}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'text.secondary',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        mb: 0.5,
                      }}
                    >
                      <SecurityOutlinedIcon sx={{ fontSize: 15 }} /> Cover Plan
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {selectedItem.cover}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'text.secondary',
                        display: 'block',
                        mb: 0.5,
                      }}
                    >
                      Received Timestamp
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                      {selectedItem.received}
                    </Typography>
                  </Box>

                  <Box sx={{ pt: 0.5 }}>
                    <Chip
                      size="small"
                      icon={selectedStatusChip.icon}
                      label={selectedItem.status}
                      sx={selectedStatusChip.sx}
                    />
                  </Box>
                </Stack>

                {/* Action Buttons */}
                <Stack spacing={1.5} sx={{ mt: 'auto', pt: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    size="large"
                    startIcon={<CheckCircleRoundedIcon />}
                    onClick={handleSendToClinic}
                    disabled={selectedItem.status === 'Verified'}
                    sx={{
                      py: 1.2,
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      textTransform: 'none',
                      bgcolor: '#0f766e',
                      boxShadow: '0 2px 4px rgba(15, 118, 110, 0.25)',
                      '&:hover': {
                        bgcolor: '#0d5f58',
                        boxShadow: '0 4px 6px rgba(15, 118, 110, 0.35)',
                      },
                    }}
                  >
                    {selectedItem.status === 'Verified'
                      ? 'Sent to clinic'
                      : (selectedItem.cover || '').toLowerCase().includes('cashless')
                        ? 'Verify cashless & send to clinic'
                        : 'Send to clinic'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    size="large"
                    startIcon={<CancelOutlinedIcon />}
                    onClick={handleDecline}
                    disabled={selectedItem.status === 'Declined'}
                    sx={{
                      py: 1.2,
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      bgcolor: '#ffffff',
                      borderColor: '#fca5a5',
                      color: '#dc2626',
                      '&:hover': {
                        bgcolor: '#fef2f2',
                        borderColor: '#ef4444',
                      },
                    }}
                  >
                    {selectedItem.status === 'Declined' ? 'Declined' : 'Decline'}
                  </Button>
                </Stack>
              </>
            ) : (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Select an appointment from the queue to review details and verify cashless eligibility.
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.severity}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default IntakeQueuePage;
