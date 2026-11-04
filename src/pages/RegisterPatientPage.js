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
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import AttachEmailRoundedIcon from '@mui/icons-material/AttachEmailRounded';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import SmartphoneRoundedIcon from '@mui/icons-material/SmartphoneRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import Sidebar from '../components/Sidebar';
import RegisterPatientModal from '../components/RegisterPatientModal';
import {
  fetchRegisteredClients,
  sendQrEmail,
  updateClientDetails,
  reissueClientQr,
  deleteClientRecord,
} from '../services/onboardingService';

const insuranceProviders = [
  'AIA Singapore',
  'Great Eastern',
  'Prudential Singapore',
  'Singlife',
  'Income Insurance',
  'Cigna Healthcare',
  'Bupa Global',
  'Bupa Singapore',
];

const RegisterPatientPage = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  // Right-side QR & Email panel states
  const [recipientEmail, setRecipientEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentMap, setEmailSentMap] = useState({});
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // Edit Policy / Details Dialog states for Activated Patients
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    contact_number: '',
    date_of_birth: '',
    gender: 'Male',
    insurance_provider: 'AIA Singapore',
    insurance_id: '',
    plan_type: '',
    cashless_eligible: true,
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [reissueDialogOpen, setReissueDialogOpen] = useState(false);
  const [reissuingQr, setReissuingQr] = useState(false);

  // Delete Patient Confirmation Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [deletingPatient, setDeletingPatient] = useState(false);

  const filterOptions = ['All', 'Pending', 'Activated'];

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  // Load real registered patients from backend
  const loadPatients = useCallback(async (preserveSelectedCode = null) => {
    setLoading(true);
    setFetchError('');
    try {
      const data = await fetchRegisteredClients();
      const rawList = Array.isArray(data) ? data : [];
      const list = rawList.map((item) => {
        const code = item.client_code || item.clientId || `ZT-${item.id || ''}`;
        const token = item.onboarding_token || `act_${code.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        return {
          ...item,
          client_code: code,
          full_name: item.full_name || item.name || 'Unnamed Patient',
          email: item.email || '',
          insurance_provider: item.insurance_provider || item.insurance || 'AIA Singapore',
          plan_type: item.plan_type || item.plan || 'Standard Plan',
          cashless_eligible: item.cashless_eligible !== undefined ? Boolean(item.cashless_eligible) : true,
          onboarding_status: item.onboarding_status || 'pending_activation',
          onboard_url:
            item.onboard_url ||
            `${window.location.origin}/onboard?token=${token}&client=${encodeURIComponent(code)}`,
        };
      });

      setPatients(list);

      setSelectedPatient((prevSelected) => {
        const targetCode = preserveSelectedCode || prevSelected?.client_code;
        if (targetCode) {
          const match = list.find((p) => p.client_code === targetCode);
          if (match) return match;
        }
        return list[0] || null;
      });
    } catch (err) {
      console.error('Failed to fetch registered patients:', err.message);
      setFetchError(err.message || 'Unable to load patients from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Refresh when window regains focus (e.g. after scanning QR on mobile app)
  useEffect(() => {
    const handleFocus = () => {
      loadPatients();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadPatients]);

  // Sync recipient email input when selected patient changes
  useEffect(() => {
    if (selectedPatient) {
      setRecipientEmail(selectedPatient.email || '');
      setCopied(false);
    } else {
      setRecipientEmail('');
    }
  }, [selectedPatient]);

  const filteredPatients = useMemo(() => {
    return patients.filter((item) => {
      const isActivated = item.onboarding_status === 'activated';
      const matchesFilter =
        activeFilter === 'All' ||
        (activeFilter === 'Pending' && !isActivated) ||
        (activeFilter === 'Activated' && isActivated);

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        (item.full_name || '').toLowerCase().includes(query) ||
        (item.client_code || '').toLowerCase().includes(query) ||
        (item.email || '').toLowerCase().includes(query) ||
        (item.insurance_provider || '').toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [patients, searchQuery, activeFilter]);

  const handlePatientRegistered = (newPatient) => {
    setPatients((prev) => {
      const filtered = prev.filter((p) => p.client_code !== newPatient.client_code);
      return [newPatient, ...filtered];
    });
    setSelectedPatient(newPatient);
    setRecipientEmail(newPatient.email || '');
    showToast(
      `Patient ${newPatient.full_name} (${newPatient.client_code}) registered! QR code is ready on the right panel.`
    );
    loadPatients(newPatient.client_code);
  };

  const handleSelectPatient = (row) => {
    setSelectedPatient(row);
  };

  // Copy onboarding link
  const handleCopyLink = () => {
    if (!selectedPatient?.onboard_url) return;
    navigator.clipboard.writeText(selectedPatient.onboard_url);
    setCopied(true);
    showToast('Onboarding link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  // Render High-Res Canvas with QR and branding for the selected patient
  const generateQrCardCanvas = (callback) => {
    const svgElement = document.getElementById('patient-qr-svg');
    if (!svgElement || !selectedPatient) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 440;
      canvas.height = 520;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

      ctx.fillStyle = '#0f766e';
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ZETLY CASHLESS HEALTHCARE', canvas.width / 2, 42);

      ctx.drawImage(img, 80, 60, 280, 280);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(selectedPatient.full_name || 'Patient', canvas.width / 2, 385);

      ctx.fillStyle = '#64748b';
      ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(
        `${selectedPatient.client_code} \u2022 ${selectedPatient.insurance_provider || 'AIA Singapore'}`,
        canvas.width / 2,
        415
      );

      ctx.fillStyle = '#059669';
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText('Scan with Zetly App to set username & password', canvas.width / 2, 460);

      callback(canvas);
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Save QR As Standalone Image (PNG Card)
  const handleSaveAsImage = () => {
    if (!selectedPatient) return;
    generateQrCardCanvas((canvas) => {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      const fileName = `${(selectedPatient.full_name || 'patient')
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '_')}_Zetly_QR.png`;
      downloadLink.download = fileName;
      downloadLink.href = pngUrl;
      downloadLink.click();
      showToast(`Saved QR image: ${fileName}`);
    });
  };

  // Send or Resend QR Email directly via Laravel Backend + SMTP
  const handleSendEmail = () => {
    if (!selectedPatient) return;
    const trimmedEmail = recipientEmail.trim();
    if (!trimmedEmail) {
      showToast('Please enter the patient’s email address.', 'warning');
      return;
    }

    generateQrCardCanvas(async (canvas) => {
      setSendingEmail(true);
      try {
        const pngDataUrl = canvas.toDataURL('image/png');

        await sendQrEmail({
          email: trimmedEmail,
          qrCodeBase64: pngDataUrl,
          clientId: typeof selectedPatient.id === 'number' ? selectedPatient.id : undefined,
          clientCode: selectedPatient.client_code,
          patientName: selectedPatient.full_name,
          insurance: selectedPatient.insurance_provider,
          policyNumber: selectedPatient.insurance_id,
          planType: selectedPatient.plan_type,
          cashless: selectedPatient.cashless_eligible,
          onboardUrl: selectedPatient.onboard_url,
        });

        setPatients((prev) =>
          prev.map((p) =>
            p.client_code === selectedPatient.client_code ? { ...p, email: trimmedEmail } : p
          )
        );
        setSelectedPatient((prev) => (prev ? { ...prev, email: trimmedEmail } : prev));
        setEmailSentMap((prev) => ({ ...prev, [selectedPatient.client_code]: trimmedEmail }));
        showToast(`QR Code email sent successfully to ${trimmedEmail} via SMTP!`, 'success');
      } catch (err) {
        console.error('SMTP email sending error:', err);
        showToast(`Failed to send email: ${err.message}`, 'error');
      } finally {
        setSendingEmail(false);
      }
    });
  };

  // Toggle Cashless Eligibility directly from Activated Member Panel
  const handleToggleCashless = async (event) => {
    if (!selectedPatient) return;
    const nextCashless = event.target.checked;

    const updated = {
      ...selectedPatient,
      cashless_eligible: nextCashless,
    };

    setPatients((prev) =>
      prev.map((p) => (p.client_code === selectedPatient.client_code ? updated : p))
    );
    setSelectedPatient(updated);

    if (selectedPatient.id) {
      try {
        await updateClientDetails(selectedPatient.id, { cashless_eligible: nextCashless });
      } catch (err) {
        showToast(`Failed to update cashless status: ${err.message}`, 'error');
        return;
      }
    }

    showToast(
      `Cashless eligibility ${nextCashless ? 'enabled' : 'disabled'} for ${selectedPatient.full_name}.`,
      nextCashless ? 'success' : 'info'
    );
  };

  // Open Edit Policy & Patient Details Dialog
  const handleOpenEditDialog = () => {
    if (!selectedPatient) return;
    setEditForm({
      full_name: selectedPatient.full_name || '',
      email: selectedPatient.email || '',
      contact_number: selectedPatient.contact_number || '',
      date_of_birth: selectedPatient.date_of_birth || '',
      gender: selectedPatient.gender || 'Male',
      insurance_provider: selectedPatient.insurance_provider || 'AIA Singapore',
      insurance_id: selectedPatient.insurance_id || '',
      plan_type: selectedPatient.plan_type || '',
      cashless_eligible: Boolean(selectedPatient.cashless_eligible),
    });
    setEditDialogOpen(true);
  };

  // Save Edited Policy & Patient Details
  const handleSaveEditDetails = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setSavingEdit(true);

    try {
      if (selectedPatient.id) {
        await updateClientDetails(selectedPatient.id, editForm);
      }
      const updated = {
        ...selectedPatient,
        ...editForm,
      };

      setPatients((prev) =>
        prev.map((p) => (p.client_code === selectedPatient.client_code ? updated : p))
      );
      setSelectedPatient(updated);
      setEditDialogOpen(false);
      showToast(`Updated profile and policy details for ${updated.full_name}.`);
    } catch (err) {
      showToast(`Failed to save changes: ${err.message}`, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Open Re-issue QR Confirmation Dialog
  const handleOpenReissueDialog = () => {
    if (!selectedPatient) return;
    setReissueDialogOpen(true);
  };

  // Re-issue Onboarding QR Token & Switch Back to Pending Activation
  const handleConfirmReissueQr = async () => {
    if (!selectedPatient) return;
    setReissuingQr(true);

    try {
      const res = await reissueClientQr(selectedPatient.id);
      const updated = {
        ...selectedPatient,
        ...(res.client || {}),
        onboarding_status: 'pending_activation',
        onboarding_token: res.token,
        onboard_url: res.onboard_url,
      };

      setPatients((prev) =>
        prev.map((p) => (p.client_code === selectedPatient.client_code ? updated : p))
      );
      setSelectedPatient(updated);
      setReissueDialogOpen(false);
      showToast(
        `Re-issued new Onboarding QR for ${selectedPatient.full_name}. Ready to scan or send via email!`
      );
    } catch (err) {
      showToast(`Failed to re-issue QR: ${err.message}`, 'error');
    } finally {
      setReissuingQr(false);
    }
  };

  // Open Delete Patient Confirmation Dialog
  const handleOpenDeleteDialog = (patient) => {
    if (!patient) return;
    setPatientToDelete(patient);
    setDeleteDialogOpen(true);
  };

  // Confirm & Delete Patient Record
  const handleConfirmDeletePatient = async () => {
    if (!patientToDelete) return;
    setDeletingPatient(true);
    try {
      if (patientToDelete.id) {
        await deleteClientRecord(patientToDelete.id);
      }
      setPatients((prev) => {
        const remaining = prev.filter((p) => p.client_code !== patientToDelete.client_code);
        if (selectedPatient?.client_code === patientToDelete.client_code) {
          setSelectedPatient(remaining[0] || null);
        }
        return remaining;
      });
      setDeleteDialogOpen(false);
      showToast(
        `Deleted patient record ${patientToDelete.full_name} (${patientToDelete.client_code}).`,
        'info'
      );
      setPatientToDelete(null);
    } catch (err) {
      showToast(`Failed to delete patient: ${err.message}`, 'error');
    } finally {
      setDeletingPatient(false);
    }
  };

  const isEmailSentForSelected = Boolean(
    selectedPatient && emailSentMap[selectedPatient.client_code]
  );

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
      {/* Left Sidebar */}
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
              Register Patient (QR)
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                mt: 0.25,
              }}
            >
              Onboard patients via QR code, resend activation emails, and manage active member eCards.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title="Refresh patient statuses">
              <IconButton
                onClick={() => loadPatients()}
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

            <Button
              variant="contained"
              startIcon={<QrCode2RoundedIcon />}
              onClick={() => setRegisterModalOpen(true)}
              sx={{
                bgcolor: '#0f766e',
                color: '#ffffff',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                borderRadius: 2,
                px: 2,
                py: 0.8,
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#0d5f58',
                  boxShadow: 'none',
                },
              }}
            >
              Register Patient (QR)
            </Button>

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

        {/* Content Area: Patients Table (Left) and Onboarding QR / Member eCard Panel (Right) */}
        <Box
          sx={{
            display: 'flex',
            flexGrow: 1,
            gap: 2.5,
            minHeight: 0,
            alignItems: 'flex-start',
          }}
        >
          {/* Left: Patients Table Section */}
          <Paper
            elevation={1}
            sx={{
              flex: { xs: 1, md: 1.85 },
              borderRadius: 2,
              p: 2.5,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.paper',
            }}
          >
            {/* Search and Filter Bar */}
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
                placeholder="Search patient, member code, email, insurance"
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

            {fetchError && (
              <Alert
                severity="error"
                sx={{ mb: 2, borderRadius: 2 }}
                action={
                  <Button color="inherit" size="small" onClick={() => loadPatients()}>
                    Retry
                  </Button>
                }
              >
                {fetchError}
              </Alert>
            )}

            {/* Patients Table */}
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
                    <TableCell>EMAIL</TableCell>
                    <TableCell>INSURANCE & PLAN</TableCell>
                    <TableCell>COVER</TableCell>
                    <TableCell align="right">ONBOARDING STATUS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                        <CircularProgress size={24} sx={{ color: '#0f766e', mb: 1 }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block' }}>
                          Loading registered patients...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPatients.map((row) => {
                      const isSelected = selectedPatient?.client_code === row.client_code;
                      const isActivated = row.onboarding_status === 'activated';

                      return (
                        <TableRow
                          key={row.client_code}
                          hover
                          onClick={() => handleSelectPatient(row)}
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
                              {row.full_name}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: 'text.secondary', fontWeight: 500 }}
                            >
                              {row.client_code}
                            </Typography>
                          </TableCell>

                          {/* Email */}
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                color: row.email ? 'text.primary' : 'text.disabled',
                                fontWeight: 500,
                              }}
                            >
                              {row.email || 'Not set'}
                            </Typography>
                          </TableCell>

                          {/* Insurance & Plan */}
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500, color: 'text.primary' }}
                            >
                              {row.insurance_provider || 'AIA Singapore'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {row.plan_type || 'Standard Plan'}
                            </Typography>
                          </TableCell>

                          {/* Cover */}
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 500,
                                color: row.cashless_eligible ? '#059669' : 'text.secondary',
                              }}
                            >
                              {row.cashless_eligible ? 'Cashless treatment' : 'Discounted consult'}
                            </Typography>
                          </TableCell>

                          {/* Onboarding Status */}
                          <TableCell align="right">
                            {isActivated ? (
                              <Chip
                                size="small"
                                icon={
                                  <CheckCircleRoundedIcon
                                    sx={{
                                      fontSize: '13px !important',
                                      color: '#059669 !important',
                                    }}
                                  />
                                }
                                label="Activated"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  bgcolor: '#ecfdf5',
                                  color: '#059669',
                                  border: '1px solid #a7f3d0',
                                  px: 0.5,
                                }}
                              />
                            ) : (
                              <Chip
                                size="small"
                                icon={
                                  <SmartphoneRoundedIcon
                                    sx={{
                                      fontSize: '13px !important',
                                      color: '#b45309 !important',
                                    }}
                                  />
                                }
                                label="Waiting to scan"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  bgcolor: '#fef3c7',
                                  color: '#b45309',
                                  border: '1px solid #fde68a',
                                  px: 0.5,
                                }}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}

                  {!loading && filteredPatients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                          {patients.length === 0
                            ? 'No patients registered yet. Click "Register Patient (QR)" above to onboard your first patient.'
                            : 'No registered patients match your search or filter.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Right Column: Conditional Panel based on Onboarding Status */}
          <Paper
            elevation={1}
            sx={{
              flex: 1,
              minWidth: 360,
              maxWidth: 460,
              borderRadius: 3,
              p: 3,
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {selectedPatient ? (
              selectedPatient.onboarding_status === 'activated' ? (
                /* =========================================================================
                   ACTIVATED & LINKED VIEW:
                   1. Digital Member eCard Preview
                   2. Account & Activation Details
                   3. Insurance & Coverage Controls + Recent Appointment Summary
                   4. Admin Support / Recovery Actions (Edit Details & Re-issue QR)
                   ========================================================================= */
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* 1. Header & Status Badge */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, color: 'text.primary' }}>
                        Member Profile & eCard
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                        Account activated and linked to Zetly Mobile App.
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Chip
                        size="small"
                        icon={<CheckCircleRoundedIcon sx={{ fontSize: '14px !important' }} />}
                        label="Account Activated & Linked"
                        color="success"
                        sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                      />
                      <Tooltip title="Delete patient record">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDeleteDialog(selectedPatient)}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* 2. Digital Member eCard Preview */}
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: 3.5,
                      p: 2.5,
                      overflow: 'hidden',
                      bgcolor: '#328c83',
                      color: '#ffffff',
                      boxShadow: '0 8px 20px rgba(15, 118, 110, 0.22)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 195,
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        width: 150,
                        height: 150,
                        borderRadius: '50%',
                        top: -40,
                        right: -30,
                        bgcolor: 'rgba(255, 255, 255, 0.12)',
                        pointerEvents: 'none',
                      }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography
                          sx={{
                            fontSize: '2rem',
                            lineHeight: 1,
                            fontWeight: 900,
                            letterSpacing: '-2px',
                            color: '#ffffff',
                          }}
                        >
                          Z
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '0.55rem',
                            fontWeight: 800,
                            letterSpacing: '0.18em',
                            color: '#ffffff',
                            mt: 0.25,
                          }}
                        >
                          ZETLY
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          bgcolor: 'rgba(255, 255, 255, 0.22)',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                        }}
                      >
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff' }}>
                          {selectedPatient.cashless_eligible ? 'Cashless eligible' : 'Standard Member'}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ my: 1.5 }}>
                      <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.9)', mb: 0.25 }}>
                        {selectedPatient.plan_type || 'Standard Plan'}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          letterSpacing: '0.02em',
                          color: '#ffffff',
                          textTransform: 'uppercase',
                        }}
                      >
                        {selectedPatient.full_name}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                      <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.92)', fontWeight: 500 }}>
                        Client ID &middot; {selectedPatient.client_code}
                      </Typography>
                      <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.92)', fontWeight: 500 }}>
                        Policy &middot; {selectedPatient.insurance_id || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* 3. Account & Activation Details */}
                  <Paper
                    variant="outlined"
                    sx={{
                      borderRadius: 2.5,
                      p: 2,
                      bgcolor: '#f8fafc',
                      borderColor: '#e2e8f0',
                    }}
                  >
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
                        mb: 1.25,
                      }}
                    >
                      <PersonOutlineRoundedIcon sx={{ fontSize: 15 }} /> Account & Activation Details
                    </Typography>

                    <Stack spacing={1} divider={<Divider flexItem sx={{ borderColor: '#f1f5f9' }} />}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Activated On
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                          {selectedPatient.activated_at || selectedPatient.created_at || 'Verified'}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Linked App Username
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, fontSize: '0.8125rem', fontFamily: 'monospace', color: '#0f766e' }}
                        >
                          @{selectedPatient.linked_username ||
                            (selectedPatient.full_name || 'member').toLowerCase().replace(/[^a-z0-9]/g, '')}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Registered Email
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                          {selectedPatient.email || 'Not set'}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Mobile / Demographics
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                          {selectedPatient.contact_number || 'N/A'} &bull; {selectedPatient.gender || 'N/A'} ({selectedPatient.date_of_birth || 'N/A'})
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Sponsor / Insurer
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                          {selectedPatient.insurance_provider || 'AIA Singapore'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>

                  {/* 4. Insurance & Coverage Controls + Recent Appointment Summary */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: selectedPatient.cashless_eligible ? '#ecfdf5' : '#f8fafc',
                      border: '1px solid',
                      borderColor: selectedPatient.cashless_eligible ? '#a7f3d0' : '#e2e8f0',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VerifiedUserOutlinedIcon
                        sx={{
                          fontSize: 20,
                          color: selectedPatient.cashless_eligible ? '#059669' : 'text.secondary',
                        }}
                      />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.84rem' }}>
                          Cashless Consultation Eligibility
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          {selectedPatient.cashless_eligible
                            ? 'Active — zero out-of-pocket at panel clinics'
                            : 'Disabled — standard discounted consultation'}
                        </Typography>
                      </Box>
                    </Box>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(selectedPatient.cashless_eligible)}
                          onChange={handleToggleCashless}
                          color="success"
                          size="small"
                        />
                      }
                      label=""
                      sx={{ m: 0 }}
                    />
                  </Box>

                  {/* Appointment / Intake History Summary */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      borderColor: '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, overflow: 'hidden' }}>
                      <Avatar
                        sx={{
                          width: 34,
                          height: 34,
                          bgcolor: '#f0fdfa',
                          color: '#0f766e',
                        }}
                      >
                        <EventAvailableOutlinedIcon fontSize="small" />
                      </Avatar>
                      <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                          {selectedPatient.latest_appointment
                            ? `${selectedPatient.latest_appointment.request_code} · ${selectedPatient.latest_appointment.doctor}`
                            : 'Mobile App Appointments'}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {selectedPatient.latest_appointment
                            ? `${selectedPatient.latest_appointment.clinic} · ${selectedPatient.latest_appointment.visit_date} (${selectedPatient.latest_appointment.status})`
                            : 'Booked visits appear in the Intake Queue'}
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      size="small"
                      variant="text"
                      endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 14 }} />}
                      onClick={() => navigate('/intake-queue')}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        color: '#0f766e',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Intake Queue
                    </Button>
                  </Paper>

                  {/* 5. Admin Support / Recovery Actions */}
                  <Box sx={{ display: 'flex', gap: 1.5, width: '100%', pt: 0.5 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<EditOutlinedIcon />}
                      onClick={handleOpenEditDialog}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        fontWeight: 600,
                        py: 1,
                        fontSize: '0.8125rem',
                        borderColor: '#cbd5e1',
                        color: '#334155',
                        '&:hover': {
                          borderColor: '#94a3b8',
                          bgcolor: '#f8fafc',
                        },
                      }}
                    >
                      Edit Policy Details
                    </Button>

                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={
                        reissuingQr ? <CircularProgress size={15} /> : <RestartAltRoundedIcon />
                      }
                      onClick={handleOpenReissueDialog}
                      disabled={reissuingQr}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        fontWeight: 600,
                        py: 1,
                        fontSize: '0.8125rem',
                        borderColor: '#99f6e4',
                        color: '#0f766e',
                        bgcolor: '#f0fdfa',
                        '&:hover': {
                          borderColor: '#5eead4',
                          bgcolor: '#ccfbf1',
                        },
                      }}
                    >
                      Re-issue QR Access
                    </Button>
                  </Box>
                </Box>
              ) : (
                /* =========================================================================
                   PENDING ACTIVATION VIEW:
                   Displays Onboarding QR Code, Copy Link, Save Image & Send/Resend QR Email
                   ========================================================================= */
                <>
                  {/* Panel Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, color: 'text.primary' }}>
                        Patient Onboarding QR
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                        Patient scans this QR with Zetly App to set username & password.
                      </Typography>
                    </Box>
                    <Tooltip title="Delete patient record">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDeleteDialog(selectedPatient)}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  {/* Status Banner */}
                  <Box sx={{ width: '100%', mb: 2 }}>
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      Present this QR to <strong>{selectedPatient.full_name}</strong>. Scanning will open the setup screen in their Zetly App.
                    </Alert>
                  </Box>

                  {/* QR Code Card */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        bgcolor: '#ffffff',
                        border: '2px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1.5,
                        mb: 2,
                      }}
                    >
                      <QRCodeSVG
                        id="patient-qr-svg"
                        value={selectedPatient.onboard_url}
                        size={190}
                        level="H"
                        includeMargin={false}
                      />
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {selectedPatient.full_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          {selectedPatient.client_code} &bull; {selectedPatient.insurance_provider || 'AIA Singapore'}
                        </Typography>
                      </Box>
                    </Paper>

                    {/* Activation Status Badge */}
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        icon={<SmartphoneRoundedIcon />}
                        label="Waiting for patient to scan..."
                        sx={{
                          bgcolor: '#fffbeb',
                          color: '#b45309',
                          border: '1px solid #fde68a',
                          fontWeight: 600,
                          px: 1,
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Copy URL & Action bar */}
                  <Paper
                    variant="outlined"
                    sx={{
                      width: '100%',
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'monospace',
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {selectedPatient.onboard_url}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleCopyLink}
                      startIcon={copied ? <CheckCircleRoundedIcon /> : <ContentCopyRoundedIcon />}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        borderRadius: 1.5,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </Paper>

                  {/* Recipient Email Input */}
                  <Box sx={{ width: '100%', mb: 2 }}>
                    <TextField
                      label="Patient Recipient Email"
                      placeholder="e.g. patient@example.com"
                      type="email"
                      size="small"
                      fullWidth
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      helperText="Recipient will receive the welcome instructions with the QR code attached via SMTP."
                    />
                  </Box>

                  {/* Email Sent Status Banner */}
                  {isEmailSentForSelected && (
                    <Alert
                      severity="success"
                      icon={<MarkEmailReadRoundedIcon />}
                      sx={{ width: '100%', mb: 2, borderRadius: 2 }}
                    >
                      Email sent to <strong>{emailSentMap[selectedPatient.client_code]}</strong> via SMTP with attached QR!
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
                    <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<ImageRoundedIcon />}
                        onClick={handleSaveAsImage}
                        sx={{
                          textTransform: 'none',
                          borderRadius: 2,
                          fontWeight: 600,
                          py: 1.1,
                          borderColor: '#cbd5e1',
                          color: '#334155',
                          '&:hover': {
                            borderColor: '#94a3b8',
                            bgcolor: '#f8fafc',
                          },
                        }}
                      >
                        Save as Image
                      </Button>

                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={
                          sendingEmail ? (
                            <CircularProgress size={16} sx={{ color: '#fff' }} />
                          ) : isEmailSentForSelected ? (
                            <MarkEmailReadRoundedIcon />
                          ) : (
                            <AttachEmailRoundedIcon />
                          )
                        }
                        onClick={handleSendEmail}
                        disabled={sendingEmail}
                        sx={{
                          bgcolor: isEmailSentForSelected ? '#059669' : '#0f766e',
                          '&:hover': { bgcolor: isEmailSentForSelected ? '#047857' : '#0d5f58' },
                          '&.Mui-disabled': { bgcolor: '#99f6e4', color: '#0f766e' },
                          textTransform: 'none',
                          borderRadius: 2,
                          fontWeight: 600,
                          py: 1.1,
                          boxShadow: '0 1px 2px rgba(15, 118, 110, 0.25)',
                        }}
                      >
                        {sendingEmail
                          ? 'Sending via SMTP...'
                          : isEmailSentForSelected
                            ? 'Resend QR Email'
                            : 'Send QR via Email'}
                      </Button>
                    </Box>

                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        px: 1,
                      }}
                    >
                      Directly sends the welcome email with the attached QR code to the patient via Laravel SMTP (no Microsoft login required).
                    </Typography>
                  </Box>
                </>
              )
            ) : (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Select or register a patient to view their Onboarding QR or Member eCard.
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Register New Patient Modal */}
      <RegisterPatientModal
        open={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onPatientRegistered={handlePatientRegistered}
        closeOnGenerate={true}
      />

      {/* Edit Policy & Patient Details Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3, p: 1 },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Edit Member & Policy Details
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {selectedPatient?.client_code} &bull; Changes sync immediately to the member’s mobile eCard.
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setEditDialogOpen(false)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1.5 }}>
          <Box
            component="form"
            id="edit-patient-form"
            onSubmit={handleSaveEditDetails}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
          >
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Patient Full Name"
                size="small"
                required
                fullWidth
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
              <TextField
                label="Mobile Contact"
                size="small"
                fullWidth
                value={editForm.contact_number}
                onChange={(e) => setEditForm({ ...editForm, contact_number: e.target.value })}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Registered Email"
                type="email"
                size="small"
                fullWidth
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
              <TextField
                label="Date of Birth"
                type="date"
                size="small"
                fullWidth
                value={editForm.date_of_birth}
                onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>

            <Divider sx={{ my: 0.5 }} />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label="Insurance Provider"
                size="small"
                fullWidth
                value={editForm.insurance_provider}
                onChange={(e) => setEditForm({ ...editForm, insurance_provider: e.target.value })}
              >
                {insuranceProviders.map((prov) => (
                  <MenuItem key={prov} value={prov}>
                    {prov}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Policy / Certificate #"
                size="small"
                fullWidth
                value={editForm.insurance_id}
                onChange={(e) => setEditForm({ ...editForm, insurance_id: e.target.value })}
              />
            </Box>

            <TextField
              label="Plan Coverage"
              size="small"
              fullWidth
              value={editForm.plan_type}
              onChange={(e) => setEditForm({ ...editForm, plan_type: e.target.value })}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-patient-form"
            variant="contained"
            disabled={savingEdit}
            sx={{
              bgcolor: '#0f766e',
              '&:hover': { bgcolor: '#0d5f58' },
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 2.5,
            }}
          >
            {savingEdit ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Re-issue QR Access Confirmation Dialog */}
      <Dialog
        open={reissueDialogOpen}
        onClose={() => !reissuingQr && setReissueDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3, p: 1 },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: '#f0fdfa', color: '#0f766e' }}>
              <RestartAltRoundedIcon fontSize="small" />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.2 }}>
              Re-issue QR Access?
            </Typography>
          </Box>
          <IconButton
            size="small"
            disabled={reissuingQr}
            onClick={() => setReissueDialogOpen(false)}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Are you sure you want to generate a new onboarding QR code for{' '}
            <strong>{selectedPatient?.full_name}</strong> ({selectedPatient?.client_code})?
          </Typography>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            This will reset the member’s status to <strong>Waiting to scan</strong> so they can scan the new QR or receive a fresh onboarding email to re-link their mobile account.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button
            onClick={() => setReissueDialogOpen(false)}
            disabled={reissuingQr}
            sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmReissueQr}
            disabled={reissuingQr}
            startIcon={
              reissuingQr ? <CircularProgress size={15} sx={{ color: '#fff' }} /> : <RestartAltRoundedIcon />
            }
            sx={{
              bgcolor: '#0f766e',
              '&:hover': { bgcolor: '#0d5f58' },
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 2.5,
            }}
          >
            {reissuingQr ? 'Re-issuing...' : 'Yes, Re-issue QR'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Patient Record Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deletingPatient && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3, p: 1 },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: '#fef2f2', color: '#dc2626' }}>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.2 }}>
              Delete Patient Record?
            </Typography>
          </Box>
          <IconButton
            size="small"
            disabled={deletingPatient}
            onClick={() => setDeleteDialogOpen(false)}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Are you sure you want to permanently delete the patient record for{' '}
            <strong>{patientToDelete?.full_name}</strong> ({patientToDelete?.client_code})?
          </Typography>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            This action cannot be undone. The patient’s onboarding QR, profile details, and linked mobile app access will be removed.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deletingPatient}
            sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDeletePatient}
            disabled={deletingPatient}
            startIcon={
              deletingPatient ? <CircularProgress size={15} sx={{ color: '#fff' }} /> : <DeleteOutlineRoundedIcon />
            }
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 2.5,
            }}
          >
            {deletingPatient ? 'Deleting...' : 'Delete Record'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4500}
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

export default RegisterPatientPage;
