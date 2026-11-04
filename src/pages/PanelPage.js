import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Avatar,
  Chip,
  Button,
  ButtonGroup,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  Stack,
} from '@mui/material';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import LocalHospitalRoundedIcon from '@mui/icons-material/LocalHospitalRounded';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import Sidebar from '../components/Sidebar';
import {
  fetchPanelDoctors,
  createPanelDoctor,
  updatePanelDoctor,
  verifyDoctorSmc,
  deletePanelDoctor,
} from '../services/onboardingService';

const specialtyOptions = [
  'General Practice',
  'Aesthetics',
  'Dental Surgery',
  'Orthopaedics',
  'Women’s Health',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Ophthalmology',
  'ENT Specialist',
];

const filterCategories = ['All', 'General Practice', 'Aesthetics', 'Dental Surgery', 'Orthopaedics'];

const PanelPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Right-column Edit Form states for selectedDoctor
  const [editForm, setEditForm] = useState({
    name: '',
    smc: '',
    specialty: 'General Practice',
    consultation_fee: '180',
    cashless_eligible: true,
    clinic_name: '',
    address: '',
    email: '',
    smc_status: 'verified',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Add Doctor Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    smc: '',
    specialty: 'General Practice',
    consultation_fee: '180',
    cashless_eligible: true,
    clinic_name: '',
    address: '',
    email: '',
    smc_verified: true,
  });

  // Delete Doctor Confirmation Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [deletingDoctor, setDeletingDoctor] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);

  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const showToast = (message, severity = 'success') => {
    setToast({ open: true, message, severity });
  };

  const normalizeDoctorItem = (doc) => {
    const feeNum = parseFloat(doc.consultation_fee ?? 180);
    const feeClean = Number.isFinite(feeNum) ? feeNum : 180;
    const cashless =
      doc.cashless_eligible !== undefined
        ? Boolean(doc.cashless_eligible)
        : doc.accepts_cashless !== undefined
          ? Boolean(doc.accepts_cashless)
          : true;

    return {
      ...doc,
      name: doc.name || doc.doctor || 'Panel Doctor',
      doctor: doc.name || doc.doctor || 'Panel Doctor',
      clinic_name: doc.clinic_name || doc.clinic || 'Panel Clinic',
      clinic: doc.clinic_name || doc.clinic || 'Panel Clinic',
      specialty: doc.specialty || 'General Practice',
      consultation_fee: feeClean,
      fee: doc.fee || `$${feeClean.toFixed(0)} consult`,
      cashless_eligible: cashless,
      accepts_cashless: cashless,
      address: doc.address || '',
      email: doc.email || '',
      smc: doc.smc || '',
      smc_status: doc.smc_status || (doc.status === 'SMC verified' ? 'verified' : 'pending'),
      status:
        doc.smc_status === 'verified' || doc.status === 'SMC verified'
          ? 'SMC verified'
          : 'Pending SMC',
    };
  };

  const loadDoctors = useCallback(async (preserveId = null) => {
    setLoading(true);
    setFetchError('');
    try {
      const data = await fetchPanelDoctors();
      const rawList = Array.isArray(data) ? data : [];
      const list = rawList.map(normalizeDoctorItem);
      setDoctors(list);

      setSelectedDoctor((prev) => {
        const targetId = preserveId || prev?.id;
        if (targetId) {
          const match = list.find((d) => d.id === targetId);
          if (match) return match;
        }
        return list[0] || null;
      });
    } catch (err) {
      console.error('Failed to fetch panel doctors:', err.message);
      setFetchError(err.message || 'Unable to load panel doctors from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  // Sync Right Column Edit Form whenever selectedDoctor changes
  useEffect(() => {
    if (selectedDoctor) {
      const feeNum = parseFloat(selectedDoctor.consultation_fee ?? 180);
      setEditForm({
        name: selectedDoctor.name || selectedDoctor.doctor || '',
        smc: selectedDoctor.smc || '',
        specialty: selectedDoctor.specialty || 'General Practice',
        consultation_fee: Number.isFinite(feeNum) ? String(feeNum) : '180',
        cashless_eligible: Boolean(selectedDoctor.cashless_eligible ?? true),
        clinic_name: selectedDoctor.clinic_name || selectedDoctor.clinic || '',
        address: selectedDoctor.address || '',
        email: selectedDoctor.email || '',
        smc_status:
          selectedDoctor.smc_status === 'verified' || selectedDoctor.status === 'SMC verified'
            ? 'verified'
            : 'pending',
      });
    }
  }, [selectedDoctor]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const docName = doc.name || doc.doctor || '';
      const docClinic = doc.clinic_name || doc.clinic || '';
      const docSpecialty = doc.specialty || 'General Practice';
      const docSmc = doc.smc || '';
      const docAddress = doc.address || '';

      const matchesFilter =
        activeFilter === 'All' ||
        docSpecialty.toLowerCase().includes(activeFilter.toLowerCase());

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        docName.toLowerCase().includes(q) ||
        docClinic.toLowerCase().includes(q) ||
        docSpecialty.toLowerCase().includes(q) ||
        docSmc.toLowerCase().includes(q) ||
        docAddress.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [doctors, searchQuery, activeFilter]);

  const handleOpenAddDialog = () => {
    setFormError('');
    setDoctorForm({
      name: '',
      smc: '',
      specialty: 'General Practice',
      consultation_fee: '180',
      cashless_eligible: true,
      clinic_name: '',
      address: '',
      email: '',
      smc_verified: true,
    });
    setAddDialogOpen(true);
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = doctorForm.name.trim();
    const trimmedSmc = doctorForm.smc.trim().toUpperCase();
    const trimmedClinic = doctorForm.clinic_name.trim();

    if (!trimmedName || !trimmedSmc || !trimmedClinic) {
      setFormError('Doctor name, clinic name, and SMC registration number are required.');
      return;
    }

    const formattedName =
      trimmedName.toLowerCase().startsWith('dr.') || trimmedName.toLowerCase().startsWith('dr ')
        ? trimmedName
        : `Dr. ${trimmedName}`;

    setSubmitting(true);
    try {
      const payload = {
        name: formattedName,
        smc: trimmedSmc,
        specialty: doctorForm.specialty || 'General Practice',
        consultation_fee: parseFloat(doctorForm.consultation_fee) || 0,
        cashless_eligible: Boolean(doctorForm.cashless_eligible),
        clinic_name: trimmedClinic,
        address: doctorForm.address.trim() || null,
        email: doctorForm.email.trim() || null,
        smc_status: doctorForm.smc_verified ? 'verified' : 'pending',
      };

      const res = await createPanelDoctor(payload);
      const createdDoc = normalizeDoctorItem(
        res.doctor || {
          id: Date.now(),
          ...payload,
        }
      );

      setDoctors((prev) => [createdDoc, ...prev]);
      setSelectedDoctor(createdDoc);
      setAddDialogOpen(false);
      showToast(
        `${formattedName} added to the Panel and published to the Mobile App Directory!`
      );
      loadDoctors(createdDoc.id);
    } catch (err) {
      setFormError(err.message || 'Failed to add doctor.');
      showToast(err.message || 'Failed to add doctor.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Save Right-Column Edited Doctor Details
  const handleSaveDoctorDetails = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    const trimmedName = editForm.name.trim();
    const trimmedSmc = editForm.smc.trim().toUpperCase();
    const trimmedClinic = editForm.clinic_name.trim();

    if (!trimmedName || !trimmedSmc || !trimmedClinic) {
      showToast('Doctor name, clinic name, and SMC number are required.', 'warning');
      return;
    }

    const formattedName =
      trimmedName.toLowerCase().startsWith('dr.') || trimmedName.toLowerCase().startsWith('dr ')
        ? trimmedName
        : `Dr. ${trimmedName}`;

    setSavingEdit(true);
    try {
      const payload = {
        name: formattedName,
        smc: trimmedSmc,
        specialty: editForm.specialty || 'General Practice',
        consultation_fee: parseFloat(editForm.consultation_fee) || 0,
        cashless_eligible: Boolean(editForm.cashless_eligible),
        clinic_name: trimmedClinic,
        address: editForm.address.trim() || null,
        email: editForm.email.trim() || null,
        smc_status: editForm.smc_status,
      };

      let updatedDoc = normalizeDoctorItem({
        ...selectedDoctor,
        ...payload,
        fee: `$${(parseFloat(editForm.consultation_fee) || 0).toFixed(0)} consult`,
      });

      if (selectedDoctor.id) {
        const res = await updatePanelDoctor(selectedDoctor.id, payload);
        if (res?.doctor) {
          updatedDoc = normalizeDoctorItem(res.doctor);
        }
      }

      setDoctors((prev) => prev.map((d) => (d.id === selectedDoctor.id ? updatedDoc : d)));
      setSelectedDoctor(updatedDoc);
      showToast(`Saved details for ${formattedName}. Synced with Mobile Directory!`);
    } catch (err) {
      showToast(err.message || 'Failed to update doctor details.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Instant Toggle for Doctor's Cashless Acceptance in Right Column
  const handleToggleDoctorCashless = async (event) => {
    if (!selectedDoctor) return;
    const nextCashless = event.target.checked;

    setEditForm((prev) => ({ ...prev, cashless_eligible: nextCashless }));
    const optimistic = normalizeDoctorItem({
      ...selectedDoctor,
      cashless_eligible: nextCashless,
      accepts_cashless: nextCashless,
    });
    setDoctors((prev) => prev.map((d) => (d.id === selectedDoctor.id ? optimistic : d)));
    setSelectedDoctor(optimistic);

    if (selectedDoctor.id) {
      try {
        const res = await updatePanelDoctor(selectedDoctor.id, {
          cashless_eligible: nextCashless,
        });
        if (res?.doctor) {
          const synced = normalizeDoctorItem(res.doctor);
          setDoctors((prev) => prev.map((d) => (d.id === selectedDoctor.id ? synced : d)));
          setSelectedDoctor(synced);
        }
      } catch (err) {
        showToast(`Failed to update cashless setting: ${err.message}`, 'error');
        return;
      }
    }

    showToast(
      `${selectedDoctor.name}: ${
        nextCashless ? 'Accepts Cashless & Discounted visits' : 'Discounted consultation visit only'
      }`,
      nextCashless ? 'success' : 'info'
    );
  };

  const handleVerifySmc = async (doc) => {
    if (!doc?.id) return;
    setVerifyingId(doc.id);
    try {
      const res = await verifyDoctorSmc(doc.id);
      const updatedDoc = normalizeDoctorItem(
        res.doctor || {
          ...doc,
          smc_status: 'verified',
          status: 'SMC verified',
        }
      );
      setDoctors((prev) => prev.map((d) => (d.id === doc.id ? updatedDoc : d)));
      if (selectedDoctor?.id === doc.id) {
        setSelectedDoctor(updatedDoc);
      }
      showToast(`SMC credential verified for ${doc.name || doc.doctor}.`);
    } catch (err) {
      showToast(err.message || 'Failed to verify SMC.', 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleOpenDeleteDialog = (doc) => {
    setDoctorToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDeleteDoctor = async () => {
    if (!doctorToDelete) return;
    setDeletingDoctor(true);
    try {
      if (doctorToDelete.id) {
        await deletePanelDoctor(doctorToDelete.id);
      }
      setDoctors((prev) => {
        const remaining = prev.filter((d) => d.id !== doctorToDelete.id);
        if (selectedDoctor?.id === doctorToDelete.id) {
          setSelectedDoctor(remaining[0] || null);
        }
        return remaining;
      });
      setDeleteDialogOpen(false);
      showToast(
        `Removed ${doctorToDelete.name || doctorToDelete.doctor} from the Panel & Directory.`,
        'info'
      );
      setDoctorToDelete(null);
    } catch (err) {
      showToast(err.message || 'Failed to delete doctor.', 'error');
    } finally {
      setDeletingDoctor(false);
    }
  };

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

      {/* Main Content */}
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
              Panel
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                mt: 0.25,
              }}
            >
              Manage SMC credentials, consultation fees, and cashless acceptance synced with the Mobile App Directory.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title="Refresh panel doctors">
              <IconButton
                onClick={() => loadDoctors()}
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
              startIcon={<PersonAddAlt1RoundedIcon />}
              onClick={handleOpenAddDialog}
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
              Add Doctor
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

        {/* Split Layout: Left Table & Right Doctor Details / Editor */}
        <Box
          sx={{
            display: 'flex',
            flexGrow: 1,
            gap: 2.5,
            minHeight: 0,
            alignItems: 'flex-start',
          }}
        >
          {/* Left Column: Doctor Credentials Table Card */}
          <Paper
            elevation={1}
            sx={{
              flex: { xs: 1, md: 1.85 },
              borderRadius: 2,
              p: 2.5,
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Card Header + Search & Specialty Filter */}
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
                placeholder="Search doctor, clinic, specialty, SMC..."
                sx={{
                  flexGrow: 1,
                  minWidth: 220,
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
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    color: 'text.secondary',
                    '&:hover': {
                      border: 'none',
                      bgcolor: 'rgba(0,0,0,0.04)',
                    },
                  },
                }}
              >
                {filterCategories.map((cat) => {
                  const isActive = activeFilter === cat;
                  return (
                    <Button
                      key={cat}
                      onClick={() => setActiveFilter(cat)}
                      sx={{
                        bgcolor: isActive ? '#2563eb !important' : 'transparent',
                        color: isActive ? '#ffffff !important' : 'text.secondary',
                      }}
                    >
                      {cat === 'General Practice' ? 'GP' : cat === 'Dental Surgery' ? 'Dental' : cat}
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
                  <Button color="inherit" size="small" onClick={() => loadDoctors()}>
                    Retry
                  </Button>
                }
              >
                {fetchError}
              </Alert>
            )}

            {/* Credentials Table */}
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
                    <TableCell>DOCTOR</TableCell>
                    <TableCell>CLINIC & LOCATION</TableCell>
                    <TableCell>SPECIALTY</TableCell>
                    <TableCell>PAYMENT & FEE</TableCell>
                    <TableCell>SMC</TableCell>
                    <TableCell align="right">STATUS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                        <CircularProgress size={24} sx={{ color: '#0f766e', mb: 1 }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block' }}>
                          Loading panel doctors...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDoctors.map((row) => {
                      const isSelected = selectedDoctor?.id === row.id;
                      const docName = row.name || row.doctor;
                      const clinicName = row.clinic_name || row.clinic;
                      const feeNum = parseFloat(row.consultation_fee ?? 0);
                      const feeAmount = Number.isFinite(feeNum) ? feeNum.toFixed(0) : '0';
                      const isCashless = Boolean(row.cashless_eligible ?? true);
                      const isVerified =
                        row.smc_status === 'verified' || row.status === 'SMC verified';

                      return (
                        <TableRow
                          key={row.id || row.smc}
                          hover
                          onClick={() => setSelectedDoctor(row)}
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
                          {/* Doctor Name */}
                          <TableCell>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 600,
                                color: 'text.primary',
                              }}
                            >
                              {docName}
                            </Typography>
                            {row.email && (
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {row.email}
                              </Typography>
                            )}
                          </TableCell>

                          {/* Clinic & Location */}
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'text.primary',
                                fontWeight: 500,
                              }}
                            >
                              {clinicName}
                            </Typography>
                            {row.address && (
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {row.address}
                              </Typography>
                            )}
                          </TableCell>

                          {/* Specialty */}
                          <TableCell>
                            <Chip
                              size="small"
                              label={row.specialty || 'General Practice'}
                              sx={{
                                bgcolor: '#f1f5f9',
                                color: '#334155',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                            />
                          </TableCell>

                          {/* Payment & Consultation Fee */}
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                color: isCashless ? '#0f766e' : '#475569',
                                fontWeight: 600,
                              }}
                            >
                              {isCashless
                                ? `Cashless or $${feeAmount} consult`
                                : `Discounted $${feeAmount} consult`}
                            </Typography>
                          </TableCell>

                          {/* SMC */}
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'text.secondary',
                                fontWeight: 600,
                                fontFamily: 'monospace',
                                fontSize: '0.85rem',
                              }}
                            >
                              {row.smc}
                            </Typography>
                          </TableCell>

                          {/* Status */}
                          <TableCell align="right">
                            {isVerified ? (
                              <Chip
                                size="small"
                                icon={
                                  <GppGoodOutlinedIcon
                                    sx={{ fontSize: '15px !important', color: '#059669 !important' }}
                                  />
                                }
                                label="SMC verified"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  bgcolor: '#ecfdf5',
                                  color: '#059669',
                                  border: '1px solid #a7f3d0',
                                }}
                              />
                            ) : (
                              <Chip
                                size="small"
                                icon={
                                  <PendingActionsRoundedIcon
                                    sx={{ fontSize: '15px !important', color: '#b45309 !important' }}
                                  />
                                }
                                label="Pending SMC"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  bgcolor: '#fffbeb',
                                  color: '#b45309',
                                  border: '1px solid #fde68a',
                                }}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}

                  {!loading && filteredDoctors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {doctors.length === 0
                            ? 'No panel doctors listed yet. Click "Add Doctor" above to add a doctor to the panel and mobile directory.'
                            : 'No panel doctors match your search or specialty filter.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Right Column: Selected Doctor Profile & Edit Details Panel */}
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
            {selectedDoctor ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Header & Delete Action */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, color: 'text.primary' }}>
                      {selectedDoctor.name || selectedDoctor.doctor}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                      {selectedDoctor.clinic_name || selectedDoctor.clinic} &bull; {selectedDoctor.specialty}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Chip
                      size="small"
                      icon={<GppGoodOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                      label={`SMC ${selectedDoctor.smc}`}
                      color={selectedDoctor.smc_status === 'verified' ? 'success' : 'warning'}
                      sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                    />
                    <Tooltip title="Remove doctor from panel">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDeleteDialog(selectedDoctor)}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Mobile Directory Live Preview Card */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
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
                      display: 'block',
                      mb: 1,
                    }}
                  >
                    Mobile App Directory Preview
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 46,
                        height: 46,
                        bgcolor: '#d7e3d1',
                        color: '#1e293b',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                      }}
                    >
                      {(selectedDoctor.name || 'DR')
                        .replace(/^Dr\.?\s+/i, '')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        {editForm.name || selectedDoctor.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        {editForm.clinic_name || selectedDoctor.clinic_name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color: editForm.cashless_eligible ? '#00897b' : '#475569',
                        }}
                      >
                        {editForm.cashless_eligible
                          ? `Cashless or $${parseFloat(editForm.consultation_fee || 0).toFixed(0)} consult`
                          : `Discounted visit · $${parseFloat(editForm.consultation_fee || 0).toFixed(0)} consult`}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                {/* Cashless Payment Acceptance Toggle */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: editForm.cashless_eligible ? '#ecfdf5' : '#f8fafc',
                    border: '1px solid',
                    borderColor: editForm.cashless_eligible ? '#a7f3d0' : '#e2e8f0',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedUserOutlinedIcon
                      sx={{
                        fontSize: 20,
                        color: editForm.cashless_eligible ? '#059669' : 'text.secondary',
                      }}
                    />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.84rem' }}>
                        Accepts Cashless Payment
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        {editForm.cashless_eligible
                          ? 'Patients can request Cashless or Discounted visits'
                          : 'Discounted consultation visit only (no cashless claim)'}
                      </Typography>
                    </Box>
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(editForm.cashless_eligible)}
                        onChange={handleToggleDoctorCashless}
                        color="success"
                        size="small"
                      />
                    }
                    label=""
                    sx={{ m: 0 }}
                  />
                </Box>

                <Divider />

                {/* Edit Doctor Details Form */}
                <Box
                  component="form"
                  onSubmit={handleSaveDoctorDetails}
                  sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'text.secondary',
                    }}
                  >
                    Edit Doctor & Clinic Details
                  </Typography>

                  <Stack direction="row" spacing={1.5}>
                    <TextField
                      label="Doctor Full Name"
                      size="small"
                      required
                      fullWidth
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                    <TextField
                      label="SMC Reg. No."
                      size="small"
                      required
                      sx={{ width: 155 }}
                      value={editForm.smc}
                      onChange={(e) =>
                        setEditForm({ ...editForm, smc: e.target.value.toUpperCase() })
                      }
                    />
                  </Stack>

                  <Stack direction="row" spacing={1.5}>
                    <TextField
                      select
                      label="Specialty"
                      size="small"
                      required
                      fullWidth
                      value={editForm.specialty}
                      onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                    >
                      {specialtyOptions.map((spec) => (
                        <MenuItem key={spec} value={spec}>
                          {spec}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      label="Consult Fee (SGD)"
                      type="number"
                      size="small"
                      required
                      sx={{ width: 170 }}
                      value={editForm.consultation_fee}
                      onChange={(e) =>
                        setEditForm({ ...editForm, consultation_fee: e.target.value })
                      }
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        },
                      }}
                    />
                  </Stack>

                  <TextField
                    label="Clinic Name"
                    size="small"
                    required
                    fullWidth
                    value={editForm.clinic_name}
                    onChange={(e) => setEditForm({ ...editForm, clinic_name: e.target.value })}
                  />

                  <TextField
                    label="Clinic District / Full Address"
                    placeholder="e.g. 1 Orchard Blvd, Camden Medical, #14-03"
                    size="small"
                    fullWidth
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  />

                  <Stack direction="row" spacing={1.5}>
                    <TextField
                      label="Doctor Email (Optional)"
                      type="email"
                      size="small"
                      fullWidth
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />

                    <TextField
                      select
                      label="SMC Status"
                      size="small"
                      sx={{ width: 175 }}
                      value={editForm.smc_status}
                      onChange={(e) => setEditForm({ ...editForm, smc_status: e.target.value })}
                    >
                      <MenuItem value="verified">SMC verified</MenuItem>
                      <MenuItem value="pending">Pending SMC</MenuItem>
                    </TextField>
                  </Stack>

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={savingEdit}
                    startIcon={
                      savingEdit ? (
                        <CircularProgress size={16} sx={{ color: '#fff' }} />
                      ) : (
                        <SaveOutlinedIcon />
                      )
                    }
                    sx={{
                      mt: 0.5,
                      bgcolor: '#0f766e',
                      '&:hover': { bgcolor: '#0d5f58' },
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.1,
                      borderRadius: 2,
                    }}
                  >
                    {savingEdit ? 'Saving Changes...' : 'Save Doctor Details'}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Select a panel doctor from the table to view or edit their details.
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Add Panel Doctor Popup Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => !submitting && setAddDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3, p: 1 },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: '#f0fdfa', color: '#0f766e', width: 40, height: 40 }}>
              <LocalHospitalRoundedIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                Add Panel Doctor
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Doctor details will be listed in the Panel & Mobile App Directory.
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            disabled={submitting}
            onClick={() => setAddDialogOpen(false)}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1.5 }}>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {formError}
            </Alert>
          )}

          <Box
            component="form"
            id="add-doctor-form"
            onSubmit={handleCreateDoctor}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0.5 }}
          >
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                label="Doctor Full Name"
                placeholder="e.g. Dr. Amelia Tan"
                size="small"
                required
                fullWidth
                value={doctorForm.name}
                onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
              />

              <TextField
                label="SMC Registration No."
                placeholder="e.g. M23481Z"
                size="small"
                required
                fullWidth
                value={doctorForm.smc}
                onChange={(e) =>
                  setDoctorForm({ ...doctorForm, smc: e.target.value.toUpperCase() })
                }
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                select
                label="Medical Specialty"
                size="small"
                required
                fullWidth
                value={doctorForm.specialty}
                onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
              >
                {specialtyOptions.map((spec) => (
                  <MenuItem key={spec} value={spec}>
                    {spec}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Consultation Fee (SGD)"
                placeholder="e.g. 180"
                type="number"
                size="small"
                required
                fullWidth
                value={doctorForm.consultation_fee}
                onChange={(e) =>
                  setDoctorForm({ ...doctorForm, consultation_fee: e.target.value })
                }
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    endAdornment: <InputAdornment position="end">consult</InputAdornment>,
                  },
                }}
              />
            </Box>

            <Divider sx={{ my: 0.25 }} />

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                label="Clinic Name"
                placeholder="e.g. Camden Aesthetics"
                size="small"
                required
                fullWidth
                value={doctorForm.clinic_name}
                onChange={(e) => setDoctorForm({ ...doctorForm, clinic_name: e.target.value })}
              />

              <TextField
                label="Clinic District / Address"
                placeholder="e.g. 1 Orchard Blvd, Camden Medical, #14-03"
                size="small"
                fullWidth
                value={doctorForm.address}
                onChange={(e) => setDoctorForm({ ...doctorForm, address: e.target.value })}
              />
            </Box>

            <TextField
              label="Doctor Email Address (Optional)"
              placeholder="e.g. dr.amelia@camden.sg"
              type="email"
              size="small"
              fullWidth
              value={doctorForm.email}
              onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
            />

            {/* Accepts Cashless Switch */}
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                px: 2,
                borderRadius: 2,
                bgcolor: doctorForm.cashless_eligible ? '#ecfdf5' : '#f8fafc',
                borderColor: doctorForm.cashless_eligible ? '#a7f3d0' : '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Accepts Cashless Payment
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {doctorForm.cashless_eligible
                    ? 'Mobile Directory will show "Cashless or $ consult" and allow cashless verification.'
                    : 'Mobile Directory will show "Discounted visit · $ consult" only.'}
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={doctorForm.cashless_eligible}
                    onChange={(e) =>
                      setDoctorForm({ ...doctorForm, cashless_eligible: e.target.checked })
                    }
                    color="success"
                  />
                }
                label=""
                sx={{ m: 0 }}
              />
            </Paper>

            {/* SMC Verified Switch */}
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                px: 2,
                borderRadius: 2,
                bgcolor: doctorForm.smc_verified ? '#f0fdfa' : '#f8fafc',
                borderColor: doctorForm.smc_verified ? '#99f6e4' : '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Mark SMC Credential as Verified
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {doctorForm.smc_verified
                    ? 'Doctor will immediately show as "SMC verified" in the Panel and Mobile Directory.'
                    : 'Doctor will be added with "Pending SMC" status until verified.'}
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={doctorForm.smc_verified}
                    onChange={(e) =>
                      setDoctorForm({ ...doctorForm, smc_verified: e.target.checked })
                    }
                    color="success"
                  />
                }
                label=""
                sx={{ m: 0 }}
              />
            </Paper>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button
            onClick={() => setAddDialogOpen(false)}
            disabled={submitting}
            sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-doctor-form"
            variant="contained"
            disabled={submitting}
            startIcon={
              submitting ? (
                <CircularProgress size={16} sx={{ color: '#fff' }} />
              ) : (
                <CheckCircleOutlineRoundedIcon />
              )
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
            {submitting ? 'Adding Doctor...' : 'Add to Panel & Directory'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Doctor Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deletingDoctor && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3, p: 1 },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: '#fef2f2', color: '#dc2626' }}>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.2 }}>
              Remove Panel Doctor?
            </Typography>
          </Box>
          <IconButton
            size="small"
            disabled={deletingDoctor}
            onClick={() => setDeleteDialogOpen(false)}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Are you sure you want to remove{' '}
            <strong>{doctorToDelete?.name || doctorToDelete?.doctor}</strong> (
            {doctorToDelete?.smc}) from the Panel?
          </Typography>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            This doctor will also be removed from the Zetly Mobile App Directory.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deletingDoctor}
            sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDeleteDoctor}
            disabled={deletingDoctor}
            startIcon={
              deletingDoctor ? (
                <CircularProgress size={15} sx={{ color: '#fff' }} />
              ) : (
                <DeleteOutlineRoundedIcon />
              )
            }
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 2.5,
            }}
          >
            {deletingDoctor ? 'Removing...' : 'Remove Doctor'}
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

export default PanelPage;
