import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Avatar,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  InputAdornment,
  CircularProgress,
  Menu,
  IconButton,
  Tooltip,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import LocalActivityOutlinedIcon from '@mui/icons-material/LocalActivityOutlined';
import Sidebar from '../components/Sidebar';
import {
  fetchReferrals,
  fetchReferralStats,
  updateReferralStatus,
  deleteReferral,
  createReferralCode,
  deleteReferralCode,
  fetchPanelDoctors,
} from '../services/onboardingService';

const statusConfig = {
  Referred: {
    bg: '#f1f5f9',
    color: '#475569',
    border: '#e2e8f0',
    apiKey: 'referred',
  },
  Booked: {
    bg: '#fffbeb',
    color: '#d97706',
    border: '#fef3c7',
    apiKey: 'booked',
  },
  Completed: {
    bg: '#ecfdf5',
    color: '#059669',
    border: '#a7f3d0',
    apiKey: 'completed',
  },
  'Paid Out': {
    bg: '#f0fdf4',
    color: '#16a34a',
    border: '#bbf7d0',
    apiKey: 'paid_out',
  },
};

const ReferralsPage = () => {
  // Tab State: 0 = Referral Records, 1 = Referral Codes
  const [currentTab, setCurrentTab] = useState(0);

  // Main Data States
  const [referrals, setReferrals] = useState([]);
  const [referralCodes, setReferralCodes] = useState([]);
  const [stats, setStats] = useState([
    { label: 'REFERRED', value: 1 },
    { label: 'BOOKED', value: 1 },
    { label: 'COMPLETED', value: 1 },
    { label: 'PAID OUT', value: 1 },
  ]);
  const [summaryText, setSummaryText] = useState('4 referrals • $187 SGD pending');
  const [doctorsList, setDoctorsList] = useState([]);

  // UI States
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // Add Referral Code Dialog States
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [savingCode, setSavingCode] = useState(false);
  const [formCode, setFormCode] = useState('');
  const [formCodeLabel, setFormCodeLabel] = useState('');
  const [formDoctorId, setFormDoctorId] = useState('');
  const [formCommissionType, setFormCommissionType] = useState('fixed'); // 'fixed' | 'percentage'
  const [formCommissionValue, setFormCommissionValue] = useState('50');
  const [formExpiresAt, setFormExpiresAt] = useState('');

  // Status Change Popover Menu States
  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [statusMenuRow, setStatusMenuRow] = useState(null);

  // Load All Data from Backend
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [refsRes, statsRes, docsRes] = await Promise.allSettled([
        fetchReferrals(),
        fetchReferralStats(),
        fetchPanelDoctors(),
      ]);

      if (refsRes.status === 'fulfilled' && Array.isArray(refsRes.value)) {
        setReferrals(refsRes.value);
      }

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        const s = statsRes.value;
        if (Array.isArray(s.stats)) setStats(s.stats);
        if (s.summary) {
          const total = s.summary.total_referrals ?? refsRes.value?.length ?? 4;
          const pending = s.summary.formatted_pending || `$${Number(s.summary.pending_sgd || 0).toLocaleString()} SGD pending`;
          setSummaryText(`${total} referrals • ${pending}`);
        }
        const codes = s.referral_codes || s.referral_links || [];
        setReferralCodes(codes);
      }

      if (docsRes.status === 'fulfilled' && Array.isArray(docsRes.value)) {
        setDoctorsList(docsRes.value);
        if (!formDoctorId && docsRes.value.length > 0) {
          setFormDoctorId(String(docsRes.value[0].id));
        }
      }
    } catch (err) {
      console.error('Error loading referrals data:', err);
      setToast({
        open: true,
        message: 'Could not refresh referrals data from backend.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [formDoctorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Copy referral code
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setToast({
      open: true,
      message: `Referral code "${code}" copied to clipboard!`,
      severity: 'success',
    });
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Open "Create Referral Code" modal
  const handleOpenAddCodeModal = () => {
    setFormCode('');
    setFormCodeLabel('');
    setFormExpiresAt('');
    if (doctorsList.length > 0) {
      setFormDoctorId(String(doctorsList[0].id));
    }
    setFormCommissionType('fixed');
    setFormCommissionValue('50');
    setCodeDialogOpen(true);
  };

  // Selected doctor consultation fee for commission percentage calculation preview
  const selectedDoctorObj = useMemo(() => {
    return doctorsList.find((d) => String(d.id) === String(formDoctorId));
  }, [doctorsList, formDoctorId]);

  const calculatedCommissionPreview = useMemo(() => {
    const val = parseFloat(formCommissionValue) || 0;
    if (formCommissionType === 'fixed') {
      return `$${val.toFixed(2)} SGD (Fixed)`;
    }
    const fee = parseFloat(selectedDoctorObj?.consultation_fee ?? 150);
    const calculated = (fee * val) / 100;
    return `$${calculated.toFixed(2)} SGD (${val}% of $${fee.toFixed(2)} fee)`;
  }, [formCommissionType, formCommissionValue, selectedDoctorObj]);

  // Submit New Referral Code
  const handleCreateReferralCode = async (e) => {
    e?.preventDefault();
    if (!formDoctorId) {
      setToast({ open: true, message: 'Please select a doctor / clinic.', severity: 'error' });
      return;
    }

    setSavingCode(true);
    try {
      const payload = {
        code: formCode.trim() || undefined,
        label: formCodeLabel.trim() || undefined,
        doctor_id: parseInt(formDoctorId, 10),
        commission_type: formCommissionType,
        commission_value: parseFloat(formCommissionValue) || 0,
        expires_at: formExpiresAt || undefined,
      };

      await createReferralCode(payload);
      setToast({
        open: true,
        message: 'Referral code created successfully!',
        severity: 'success',
      });
      setCodeDialogOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to create referral code:', err);
      setToast({
        open: true,
        message: err.message || 'Failed to create referral code.',
        severity: 'error',
      });
    } finally {
      setSavingCode(false);
    }
  };

  // Delete Referral Code
  const handleDeleteReferralCode = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete referral code "${code}"?`)) {
      return;
    }
    try {
      await deleteReferralCode(id);
      setToast({ open: true, message: `Referral code "${code}" removed.`, severity: 'info' });
      await loadData();
    } catch (err) {
      setToast({ open: true, message: err.message || 'Failed to delete code.', severity: 'error' });
    }
  };

  // Handle Admin Manual Status Change
  const handleOpenStatusMenu = (event, row) => {
    event.stopPropagation();
    setStatusMenuAnchor(event.currentTarget);
    setStatusMenuRow(row);
  };

  const handleCloseStatusMenu = () => {
    setStatusMenuAnchor(null);
    setStatusMenuRow(null);
  };

  const handleChangeStatus = async (newStatusLabel) => {
    if (!statusMenuRow) return;
    const targetStatus = statusConfig[newStatusLabel]?.apiKey || 'referred';
    const rowId = statusMenuRow.id;
    handleCloseStatusMenu();

    // Optimistic UI Update
    setReferrals((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const cfg = statusConfig[newStatusLabel] || statusConfig.Referred;
          return {
            ...r,
            status: newStatusLabel,
            statusColor: { bg: cfg.bg, color: cfg.color, border: cfg.border },
          };
        }
        return r;
      })
    );

    try {
      await updateReferralStatus(rowId, targetStatus);
      setToast({
        open: true,
        message: `Status updated to "${newStatusLabel}".`,
        severity: 'success',
      });
      // Refresh stats
      const statsRes = await fetchReferralStats();
      if (statsRes?.stats) setStats(statsRes.stats);
      if (statsRes?.summary) {
        const total = statsRes.summary.total_referrals ?? referrals.length;
        const pending = statsRes.summary.formatted_pending || `$${Number(statsRes.summary.pending_sgd || 0).toLocaleString()} SGD pending`;
        setSummaryText(`${total} referrals • ${pending}`);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      setToast({
        open: true,
        message: err.message || 'Failed to update status on server.',
        severity: 'error',
      });
      await loadData();
    }
  };

  // Delete Referral Record
  const handleDeleteReferral = async (id) => {
    if (!window.confirm('Are you sure you want to delete this referral record?')) {
      return;
    }
    try {
      await deleteReferral(id);
      setToast({ open: true, message: 'Referral record deleted.', severity: 'info' });
      await loadData();
    } catch (err) {
      setToast({ open: true, message: err.message || 'Failed to delete referral record.', severity: 'error' });
    }
  };

  // Filtered referrals by search
  const filteredReferrals = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return referrals;
    return referrals.filter(
      (r) =>
        (r.patient || '').toLowerCase().includes(q) ||
        (r.patient_name || '').toLowerCase().includes(q) ||
        (r.doctorClinic || '').toLowerCase().includes(q) ||
        (r.referral_code || '').toLowerCase().includes(q) ||
        (r.status || '').toLowerCase().includes(q)
    );
  }, [referrals, searchQuery]);

  const paginatedReferrals = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredReferrals.slice(start, start + rowsPerPage);
  }, [filteredReferrals, page, rowsPerPage]);

  // Filtered referral codes by search
  const filteredCodes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return referralCodes;
    return referralCodes.filter(
      (l) =>
        (l.code || '').toLowerCase().includes(q) ||
        (l.label || '').toLowerCase().includes(q) ||
        (l.doctorClinic || '').toLowerCase().includes(q) ||
        (l.doctor_name || '').toLowerCase().includes(q) ||
        (l.clinic_name || '').toLowerCase().includes(q)
    );
  }, [referralCodes, searchQuery]);

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
              Referrals & Codes
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                mt: 0.25,
              }}
            >
              Manage referral codes, patient appointment bookings, and commission payouts.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title="Refresh referral data">
              <IconButton
                onClick={loadData}
                disabled={loading}
                sx={{
                  bgcolor: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  p: 1.1,
                  '&:hover': { bgcolor: '#e2e8f0' },
                }}
              >
                <RefreshRoundedIcon fontSize="small" sx={{ color: '#475569' }} />
              </IconButton>
            </Tooltip>

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

        {/* Content Container */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
            maxWidth: 1040,
            width: '100%',
            mx: 'auto',
          }}
        >
          {/* Card 1: Funnel Stats */}
          <Paper
            elevation={1}
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: 'background.paper',
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                gap: 2,
              }}
            >
              {stats.map((stat) => (
                <Box
                  key={stat.label}
                  sx={{
                    bgcolor: '#f8fafc',
                    borderRadius: 2.5,
                    py: 2.5,
                    px: 2,
                    textAlign: 'center',
                    border: '1px solid #f1f5f9',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      bgcolor: '#f1f5f9',
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      color: 'text.secondary',
                      fontSize: '0.75rem',
                    }}
                  >
                    {stat.label}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: 'text.primary',
                      mt: 1,
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Text Summary */}
          <Box sx={{ px: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: '0.875rem',
              }}
            >
              {summaryText}
            </Typography>

            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
              Patients enter referral codes in the mobile app when booking an appointment.
            </Typography>
          </Box>

          {/* Navigation Tabs to Switch Between Tables */}
          <Paper
            elevation={1}
            sx={{
              borderRadius: 2.5,
              bgcolor: 'background.paper',
              px: 2,
              pt: 1,
            }}
          >
            <Tabs
              value={currentTab}
              onChange={(e, val) => {
                setCurrentTab(val);
                setSearchQuery('');
                setPage(0);
              }}
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  minHeight: 48,
                  px: 2.5,
                },
                '& .Mui-selected': {
                  color: '#0f766e !important',
                },
                '& .MuiTabs-indicator': {
                  bgcolor: '#0f766e',
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                },
              }}
            >
              <Tab
                icon={<PeopleAltOutlinedIcon sx={{ fontSize: 20 }} />}
                iconPosition="start"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>Referral Records</span>
                    <Chip
                      label={referrals.length}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        bgcolor: currentTab === 0 ? '#ccfbf1' : '#f1f5f9',
                        color: currentTab === 0 ? '#0f766e' : '#64748b',
                      }}
                    />
                  </Box>
                }
              />
              <Tab
                icon={<LocalActivityOutlinedIcon sx={{ fontSize: 20 }} />}
                iconPosition="start"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>Referral Codes</span>
                    <Chip
                      label={referralCodes.length}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        bgcolor: currentTab === 1 ? '#ccfbf1' : '#f1f5f9',
                        color: currentTab === 1 ? '#0f766e' : '#64748b',
                      }}
                    />
                  </Box>
                }
              />
            </Tabs>
          </Paper>

          {/* TAB 0: REFERRAL RECORDS TABLE (NO ADD BUTTON) */}
          {currentTab === 0 && (
            <Paper
              elevation={1}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Table Header Action Bar - NOTE: NO ADD BUTTON AS REQUESTED */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2,
                  mb: 2.5,
                }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    component="h2"
                    sx={{
                      fontWeight: 700,
                      color: 'text.primary',
                    }}
                  >
                    Referrals
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
                    Patient bookings created using a referral code. Click any status badge below to manually change its status.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <TextField
                    size="small"
                    placeholder="Search patient, doctor, or code..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(0);
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchRoundedIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      width: { xs: 180, sm: 280 },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: '0.875rem',
                      },
                    }}
                  />
                </Box>
              </Box>

              <TableContainer
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                }}
              >
                <Table size="medium">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ width: '20%', fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>
                        PATIENT
                      </TableCell>
                      <TableCell sx={{ width: '32%', fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>
                        DOCTOR / CLINIC
                      </TableCell>
                      <TableCell sx={{ width: '18%', fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>
                        DATE
                      </TableCell>
                      <TableCell sx={{ width: '15%', fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>
                        STATUS
                      </TableCell>
                      <TableCell align="right" sx={{ width: '15%', fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>
                        COMMISSION
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading && referrals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                          <CircularProgress size={32} sx={{ color: '#0f766e', mb: 1 }} />
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Loading referrals...
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : paginatedReferrals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                            No referral records found
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5 }}>
                            Referral records are created automatically when patients input a referral code when booking an appointment.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedReferrals.map((row) => {
                        const color =
                          row.statusColor ||
                          statusConfig[row.status] || {
                            bg: '#f1f5f9',
                            color: '#475569',
                            border: '#e2e8f0',
                          };

                        return (
                          <TableRow
                            key={row.id || row.patient}
                            hover
                            sx={{
                              transition: 'background-color 0.15s ease',
                              '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.02) !important',
                              },
                            }}
                          >
                            {/* Patient */}
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    fontWeight: 700,
                                    color: 'text.primary',
                                    fontSize: '0.875rem',
                                  }}
                                >
                                  {row.patient}
                                </Typography>
                                {row.referral_code && (
                                  <Chip
                                    label={row.referral_code}
                                    size="small"
                                    sx={{
                                      height: 18,
                                      fontSize: '0.65rem',
                                      fontWeight: 700,
                                      bgcolor: '#f1f5f9',
                                      color: '#475569',
                                    }}
                                  />
                                )}
                              </Box>
                              {row.patient_name && row.patient_name !== 'Unknown' && row.patient_name !== row.patient && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                  {row.patient_name}
                                </Typography>
                              )}
                            </TableCell>

                            {/* Doctor / Clinic */}
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'text.primary',
                                  fontWeight: 500,
                                }}
                              >
                                {row.doctorClinic}
                              </Typography>
                            </TableCell>

                            {/* Referral Date */}
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'text.secondary',
                                  fontWeight: 600,
                                  fontSize: '0.8125rem',
                                }}
                              >
                                {row.date || '11 Sep 2026'}
                              </Typography>
                              {row.date_time && (
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', display: 'block' }}>
                                  {row.date_time.includes(', ') ? row.date_time.split(', ')[1] : ''}
                                </Typography>
                              )}
                            </TableCell>

                            {/* Status (Clickable Chip for Manual Admin Status Change) */}
                            <TableCell>
                              <Tooltip title="Click to manually change status">
                                <Chip
                                  label={row.status}
                                  size="small"
                                  onClick={(e) => handleOpenStatusMenu(e, row)}
                                  deleteIcon={<ArrowDropDownRoundedIcon sx={{ color: `${color.color} !important` }} />}
                                  onDelete={(e) => handleOpenStatusMenu(e, row)}
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    height: 26,
                                    borderRadius: '13px',
                                    bgcolor: color.bg,
                                    color: color.color,
                                    border: `1px solid ${color.border}`,
                                    px: 0.5,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    '&:hover': {
                                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                      filter: 'brightness(0.96)',
                                    },
                                  }}
                                />
                              </Tooltip>
                            </TableCell>

                            {/* Commission & Actions */}
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    fontWeight: 700,
                                    color: 'text.primary',
                                    fontSize: '0.9375rem',
                                  }}
                                >
                                  {row.commission}
                                </Typography>
                                {row.id && (
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteReferral(row.id)}
                                    sx={{
                                      color: '#94a3b8',
                                      p: 0.5,
                                      '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' },
                                    }}
                                  >
                                    <DeleteOutlineRoundedIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {filteredReferrals.length > 5 && (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredReferrals.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(e, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  sx={{ mt: 1, borderTop: 'none' }}
                />
              )}
            </Paper>
          )}

          {/* TAB 1: REFERRAL CODES TABLE (WITH CREATE REFERRAL CODE BUTTON) */}
          {currentTab === 1 && (
            <Paper
              elevation={1}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Table Header Action Bar with Add Referral Code Button */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2,
                  mb: 2.5,
                }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    component="h2"
                    sx={{
                      fontWeight: 700,
                      color: 'text.primary',
                    }}
                  >
                    Referral Codes
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8125rem' }}>
                    Promo and referral codes for clinics. Patients input these codes in the mobile app when booking an appointment.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <TextField
                    size="small"
                    placeholder="Search code or doctor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchRoundedIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      width: { xs: 160, sm: 220 },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: '0.875rem',
                      },
                    }}
                  />

                  <Button
                    variant="contained"
                    onClick={handleOpenAddCodeModal}
                    startIcon={<AddRoundedIcon />}
                    sx={{
                      bgcolor: '#0f766e',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      textTransform: 'none',
                      borderRadius: 2,
                      px: 2,
                      py: 0.9,
                      boxShadow: 'none',
                      '&:hover': {
                        bgcolor: '#0d5f58',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    Add Referral Code
                  </Button>
                </Box>
              </Box>

              <TableContainer
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                }}
              >
                <Table size="medium">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ width: '20%', fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>
                        REFERRAL CODE
                      </TableCell>
                      <TableCell sx={{ width: '28%', fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>
                        TARGET DOCTOR / CLINIC
                      </TableCell>
                      <TableCell sx={{ width: '16%', fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>
                        COMMISSION RATE
                      </TableCell>
                      <TableCell sx={{ width: '16%', fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>
                        DURATION / EXPIRY
                      </TableCell>
                      <TableCell align="center" sx={{ width: '8%', fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>
                        TIMES USED
                      </TableCell>
                      <TableCell align="right" sx={{ width: '12%', fontWeight: 700, color: '#475569', fontSize: '0.75rem' }}>
                        ACTIONS
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCodes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                            No referral codes configured
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5 }}>
                            Click "Add Referral Code" to create your first referral promo code.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCodes.map((codeItem) => {
                        const isCopied = copiedCode === codeItem.code;

                        return (
                          <TableRow
                            key={codeItem.id || codeItem.code}
                            hover
                            sx={{
                              transition: 'background-color 0.15s ease',
                              '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.02) !important',
                              },
                            }}
                          >
                            {/* Code & Label */}
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label={codeItem.code}
                                  size="small"
                                  sx={{
                                    bgcolor: '#ecfdf5',
                                    color: '#065f46',
                                    fontWeight: 700,
                                    fontSize: '0.8125rem',
                                    fontFamily: 'monospace',
                                    border: '1px solid #a7f3d0',
                                    letterSpacing: '0.05em',
                                  }}
                                />
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                  {codeItem.label || 'Referral Code'}
                                </Typography>
                              </Box>
                            </TableCell>

                            {/* Doctor / Clinic */}
                            <TableCell>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.875rem' }}>
                                {codeItem.doctor_name || 'Network Partner Doctor'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {codeItem.clinic_name || 'Zetly Panel Clinic'}
                              </Typography>
                            </TableCell>

                            {/* Commission */}
                            <TableCell>
                              <Chip
                                label={codeItem.commission_display || (codeItem.commission_type === 'percentage' ? `${codeItem.commission_value}%` : `$${codeItem.commission_value} SGD`)}
                                size="small"
                                sx={{
                                  bgcolor: '#f8fafc',
                                  color: '#0f766e',
                                  fontWeight: 700,
                                  border: '1px solid #e2e8f0',
                                  fontSize: '0.75rem',
                                }}
                              />
                            </TableCell>

                            {/* Duration / Expiry */}
                            <TableCell>
                              <Chip
                                label={codeItem.duration_display || (codeItem.expires_at ? `Expires ${codeItem.expires_at}` : 'Never expires')}
                                size="small"
                                sx={{
                                  bgcolor: codeItem.is_expired ? '#fef2f2' : (codeItem.expires_at ? '#f0fdf4' : '#f8fafc'),
                                  color: codeItem.is_expired ? '#dc2626' : (codeItem.expires_at ? '#15803d' : '#475569'),
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  border: `1px solid ${codeItem.is_expired ? '#fecaca' : (codeItem.expires_at ? '#bbf7d0' : '#e2e8f0')}`,
                                }}
                              />
                            </TableCell>

                            {/* Times Used */}
                            <TableCell align="center">
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                {codeItem.usage_count ?? codeItem.clicks_count ?? 0}
                              </Typography>
                            </TableCell>

                            {/* Actions */}
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                <Button
                                  size="small"
                                  variant={isCopied ? 'contained' : 'outlined'}
                                  onClick={() => handleCopyCode(codeItem.code)}
                                  startIcon={isCopied ? <CheckRoundedIcon /> : <ContentCopyRoundedIcon />}
                                  sx={{
                                    textTransform: 'none',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    borderRadius: 1.5,
                                    px: 1.5,
                                    py: 0.5,
                                    bgcolor: isCopied ? '#059669' : 'transparent',
                                    borderColor: isCopied ? '#059669' : '#cbd5e1',
                                    color: isCopied ? '#ffffff' : '#334155',
                                    '&:hover': {
                                      bgcolor: isCopied ? '#047857' : '#f8fafc',
                                      borderColor: isCopied ? '#047857' : '#94a3b8',
                                    },
                                  }}
                                >
                                  {isCopied ? 'Copied' : 'Copy Code'}
                                </Button>

                                {codeItem.id && codeItem.code !== 'ABC01' && (
                                  <Tooltip title="Delete code">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteReferralCode(codeItem.id, codeItem.code)}
                                      sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' } }}
                                    >
                                      <DeleteOutlineRoundedIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Admin Manual Status Change Menu for Referral Records */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleCloseStatusMenu}
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            minWidth: 160,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            p: 0.5,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', letterSpacing: '0.04em' }}>
            CHANGE STATUS
          </Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />
        {Object.keys(statusConfig).map((statusKey) => {
          const cfg = statusConfig[statusKey];
          const isCurrent = statusMenuRow?.status === statusKey;
          return (
            <MenuItem
              key={statusKey}
              onClick={() => handleChangeStatus(statusKey)}
              sx={{
                py: 1,
                px: 2,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: isCurrent ? '#f8fafc' : 'transparent',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: cfg.color,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? cfg.color : 'text.primary',
                  }}
                >
                  {statusKey}
                </Typography>
              </Box>
              {isCurrent && <CheckRoundedIcon sx={{ fontSize: 18, color: cfg.color }} />}
            </MenuItem>
          );
        })}
      </Menu>

      {/* Popup Dialog: Add Referral Code Form */}
      <Dialog
        open={codeDialogOpen}
        onClose={() => !savingCode && setCodeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
          },
        }}
      >
        <form onSubmit={handleCreateReferralCode}>
          <DialogTitle sx={{ pb: 1, pt: 2, px: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Create Referral Code
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Generate a referral code that patients can enter in the mobile app when booking an appointment.
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ px: 3, py: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
              {/* Doctor / Clinic Dropdown */}
              <Box>
                <TextField
                  select
                  label="Target Doctor / Clinic"
                  value={formDoctorId}
                  onChange={(e) => setFormDoctorId(e.target.value)}
                  fullWidth
                  required
                  helperText={
                    selectedDoctorObj
                      ? `Consultation Fee: $${Number(selectedDoctorObj.consultation_fee || 150).toFixed(0)} SGD (${selectedDoctorObj.specialty || 'GP'})`
                      : 'Select partner doctor / clinic associated with this referral code'
                  }
                >
                  {doctorsList.map((doc) => (
                    <MenuItem key={doc.id} value={String(doc.id)}>
                      {doc.name} &bull; {doc.clinic_name || doc.clinic} (${Number(doc.consultation_fee || 150).toFixed(0)} SGD)
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Code & Label */}
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  label="Referral Code"
                  placeholder="e.g. ABC02, ZT-DENTAL"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  fullWidth
                  helperText="Leave empty to auto-generate code"
                />
                <TextField
                  label="Campaign Label (Optional)"
                  placeholder="e.g. Summer Promo"
                  value={formCodeLabel}
                  onChange={(e) => setFormCodeLabel(e.target.value)}
                  fullWidth
                  helperText="Internal name for this campaign"
                />
              </Box>

              {/* Optional Duration / Expiration Date */}
              <Box>
                <TextField
                  label="Expiration Date (Optional)"
                  type="date"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  helperText="Optional duration: Leave empty if this referral code will not expire"
                  inputProps={{
                    min: new Date().toISOString().split('T')[0],
                  }}
                />
              </Box>

              {/* Commission Value or Percentage */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                  borderColor: '#e2e8f0',
                }}
              >
                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  <FormLabel
                    component="legend"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      color: 'text.secondary',
                      mb: 1,
                    }}
                  >
                    COMMISSION CALCULATION
                  </FormLabel>
                  <RadioGroup
                    row
                    value={formCommissionType}
                    onChange={(e) => setFormCommissionType(e.target.value)}
                    sx={{ mb: 1.5 }}
                  >
                    <FormControlLabel
                      value="fixed"
                      control={<Radio size="small" sx={{ color: '#0f766e', '&.Mui-checked': { color: '#0f766e' } }} />}
                      label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Fixed Value ($ SGD)</Typography>}
                    />
                    <FormControlLabel
                      value="percentage"
                      control={<Radio size="small" sx={{ color: '#0f766e', '&.Mui-checked': { color: '#0f766e' } }} />}
                      label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Percentage (%)</Typography>}
                    />
                  </RadioGroup>

                  <TextField
                    label={formCommissionType === 'fixed' ? 'Commission Amount ($)' : 'Commission Rate (%)'}
                    type="number"
                    value={formCommissionValue}
                    onChange={(e) => setFormCommissionValue(e.target.value)}
                    fullWidth
                    required
                    inputProps={{ min: 0, step: formCommissionType === 'fixed' ? 1 : 0.5 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography sx={{ fontWeight: 700, color: 'text.secondary' }}>
                            {formCommissionType === 'fixed' ? '$' : '%'}
                          </Typography>
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {formCommissionType === 'fixed' ? 'SGD' : 'of consult fee'}
                          </Typography>
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* Calculated Preview Pill */}
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 1.25,
                      borderRadius: 1.5,
                      bgcolor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Effective Commission Preview:
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f766e' }}>
                      {calculatedCommissionPreview}
                    </Typography>
                  </Box>
                </FormControl>
              </Paper>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1.5 }}>
            <Button
              onClick={() => setCodeDialogOpen(false)}
              disabled={savingCode}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: 'text.secondary',
                borderRadius: 2,
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={savingCode}
              startIcon={savingCode ? <CircularProgress size={18} color="inherit" /> : <AddRoundedIcon />}
              sx={{
                bgcolor: '#0f766e',
                color: '#ffffff',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#0d5f58',
                  boxShadow: 'none',
                },
              }}
            >
              {savingCode ? 'Creating...' : 'Create Referral Code'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Toast Feedback */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReferralsPage;
