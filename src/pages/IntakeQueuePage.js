import React, { useState, useMemo } from 'react';
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
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import Sidebar from '../components/Sidebar';
import RegisterPatientModal from '../components/RegisterPatientModal';

const initialQueueData = [
  {
    id: 'ZT-10501',
    requestId: 'CLM-2041',
    patient: 'Elena Ong',
    doctor: 'Dr. Rajesh Kumar',
    clinic: 'Orchard Family Clinic',
    specialty: 'GP',
    visitDate: '11 Sept 2026',
    visitTime: 'Morning',
    cover: 'Discounted consultation',
    received: '2026-09-09 08:14',
    status: 'Awaiting review',
    filterCategory: 'Pending',
  },
  {
    id: 'ZT-10544',
    requestId: 'CLM-2042',
    patient: 'Marcus Wei',
    doctor: 'Dr. Sophia Lim',
    clinic: 'Novena Dental Studio',
    specialty: 'Dental Surgeon',
    visitDate: '12 Sept 2026',
    visitTime: 'Afternoon',
    cover: 'Cashless treatment',
    received: '2026-09-09 09:30',
    status: 'Awaiting review',
    filterCategory: 'Pending',
  },
  {
    id: 'ZT-10482',
    requestId: 'CLM-2043',
    patient: 'Priya Nair',
    doctor: 'Dr. Amelia Tan',
    clinic: 'Camden Aesthetics',
    specialty: 'Dermatology',
    visitDate: '10 Sept 2026',
    visitTime: 'Afternoon',
    cover: 'Cashless treatment',
    received: '2026-09-09 10:15',
    status: 'Awaiting review',
    filterCategory: 'Pending',
  },
];

const IntakeQueuePage = () => {
  const [queueData, setQueueData] = useState(initialQueueData);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedItem, setSelectedItem] = useState(initialQueueData[0]);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  const filterOptions = ['All', 'Pending', 'Verified', 'Declined'];

  const filteredQueue = useMemo(() => {
    return queueData.filter((item) => {
      const matchesFilter =
        activeFilter === 'All' || item.filterCategory.toLowerCase() === activeFilter.toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.patient.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.doctor.toLowerCase().includes(query) ||
        item.clinic.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [queueData, searchQuery, activeFilter]);

  const handlePatientRegistered = (newPatient) => {
    setQueueData((prev) => [newPatient, ...prev]);
    setSelectedItem(newPatient);
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
      {/* Sidebar - Keeps the original width and structure */}
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
                Verify cashless before the clinic is notified.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                    {filteredQueue.map((row) => {
                      const isSelected = selectedItem?.id === row.id;

                      return (
                        <TableRow
                          key={row.id}
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
                              icon={
                                <AccessTimeFilledRoundedIcon
                                  sx={{
                                    fontSize: '13px !important',
                                    color: '#b45309 !important',
                                  }}
                                />
                              }
                              label={row.status}
                              sx={{
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                bgcolor: '#fef3c7',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                px: 0.5,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {filteredQueue.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            No intake records match your search or filter.
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
              {/* Detail Header */}
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={`REQUEST ${selectedItem?.requestId || 'CLM-2041'}`}
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
                  {selectedItem?.patient || 'Elena Ong'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 500,
                    mt: 0.25,
                  }}
                >
                  {selectedItem?.id || 'ZT-10501'}
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
                    {selectedItem?.doctor} · {selectedItem?.clinic}
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
                    {selectedItem?.specialty}
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
                    {selectedItem?.visitDate} · {selectedItem?.visitTime}
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
                    {selectedItem?.cover}
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
                    {selectedItem?.received}
                  </Typography>
                </Box>

                <Box sx={{ pt: 0.5 }}>
                  <Chip
                    size="small"
                    icon={
                      <AccessTimeFilledRoundedIcon
                        sx={{
                          fontSize: '13px !important',
                          color: '#b45309 !important',
                        }}
                      />
                    }
                    label={selectedItem?.status || 'Awaiting review'}
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      bgcolor: '#fef3c7',
                      color: '#b45309',
                      border: '1px solid #fde68a',
                    }}
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
                  sx={{
                    py: 1.2,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
                    '&:hover': {
                      boxShadow: '0 4px 6px rgba(16, 185, 129, 0.35)',
                    },
                  }}
                >
                  Send to clinic
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  size="large"
                  startIcon={<CancelOutlinedIcon />}
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
                  Decline
                </Button>
              </Stack>
            </Paper>
          </Box>
        </Box>

        {/* Register Patient with QR Modal */}
        <RegisterPatientModal
          open={registerModalOpen}
          onClose={() => setRegisterModalOpen(false)}
          onPatientRegistered={handlePatientRegistered}
        />
      </Box>
    );
};

export default IntakeQueuePage;
