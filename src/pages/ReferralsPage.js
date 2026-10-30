import React, { useState } from 'react';
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
  Snackbar,
  Alert,
} from '@mui/material';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import Sidebar from '../components/Sidebar';

const referralStats = [
  { label: 'REFERRED', value: 1 },
  { label: 'BOOKED', value: 1 },
  { label: 'COMPLETED', value: 1 },
  { label: 'PAID OUT', value: 1 },
];

const referralTableData = [
  {
    patient: 'ZT-10544',
    doctorClinic: 'Dr. Sophia Lim · Novena Dental Studio',
    status: 'Referred',
    commission: '$60',
    statusColor: {
      bg: '#f1f5f9',
      color: '#475569',
      border: '#e2e8f0',
    },
  },
  {
    patient: 'ZT-10501',
    doctorClinic: 'Dr. Rajesh Kumar · Orchard Family Clinic',
    status: 'Booked',
    commission: '$42',
    statusColor: {
      bg: '#fffbeb',
      color: '#d97706',
      border: '#fef3c7',
    },
  },
  {
    patient: 'ZT-10482',
    doctorClinic: 'Dr. Amelia Tan · Camden Aesthetics',
    status: 'Completed',
    commission: '$85',
    statusColor: {
      bg: '#ecfdf5',
      color: '#059669',
      border: '#a7f3d0',
    },
  },
  {
    patient: 'ZT-10390',
    doctorClinic: 'Dr. Marcus Chen · Orthosports Singapore',
    status: 'Paid Out',
    commission: '$118',
    statusColor: {
      bg: '#f0fdf4',
      color: '#16a34a',
      border: '#bbf7d0',
    },
  },
];

const ReferralsPage = () => {
  const [copied, setCopied] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const referralLink = 'https://app.zetly.health/ref/ABC01';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setToastOpen(true);
    setTimeout(() => setCopied(false), 2500);
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
              Referrals
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                mt: 0.25,
              }}
            >
              Track referral links, patient bookings, and commission payouts.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
          {/* Card 1: Referral Link */}
          <Paper
            elevation={1}
            sx={{
              p: 2.5,
              px: 3,
              borderRadius: 3,
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: '#ecfdf5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #d1fae5',
                }}
              >
                <LinkRoundedIcon sx={{ color: '#059669', fontSize: 24, transform: 'rotate(-45deg)' }} />
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: 'text.secondary',
                    fontSize: '0.6875rem',
                    display: 'block',
                    mb: 0.25,
                  }}
                >
                  REFERRAL LINK
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                    wordBreak: 'break-all',
                  }}
                >
                  {referralLink}
                </Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              onClick={handleCopyLink}
              startIcon={copied ? <CheckRoundedIcon /> : <ContentCopyRoundedIcon />}
              sx={{
                bgcolor: copied ? '#059669' : '#0f766e',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.875rem',
                textTransform: 'none',
                borderRadius: 2,
                px: 2.5,
                py: 1,
                boxShadow: 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: copied ? '#047857' : '#0d5f58',
                  boxShadow: 'none',
                },
              }}
            >
              {copied ? 'Copied' : 'Copy Link'}
            </Button>
          </Paper>

          {/* Card 2: Funnel Stats */}
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
              {referralStats.map((stat) => (
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
          <Box sx={{ px: 0.5 }}>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: '0.875rem',
              }}
            >
              48 referrals &bull; $1,420 SGD pending
            </Typography>
          </Box>

          {/* Card 3: Referrals Table */}
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
            <Typography
              variant="h6"
              component="h2"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                mb: 2,
              }}
            >
              Referrals
            </Typography>

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
                    <TableCell sx={{ width: '20%' }}>PATIENT</TableCell>
                    <TableCell sx={{ width: '45%' }}>DOCTOR / CLINIC</TableCell>
                    <TableCell sx={{ width: '20%' }}>STATUS</TableCell>
                    <TableCell align="right" sx={{ width: '15%' }}>COMMISSION</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {referralTableData.map((row) => (
                    <TableRow
                      key={row.patient}
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
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            color: 'text.primary',
                            fontSize: '0.875rem',
                          }}
                        >
                          {row.patient}
                        </Typography>
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

                      {/* Status */}
                      <TableCell>
                        <Chip
                          label={row.status}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: 24,
                            borderRadius: '12px',
                            bgcolor: row.statusColor.bg,
                            color: row.statusColor.color,
                            border: `1px solid ${row.statusColor.border}`,
                            px: 0.5,
                          }}
                        />
                      </TableCell>

                      {/* Commission */}
                      <TableCell align="right">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Box>

      {/* Copy Toast Feedback */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={2500}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToastOpen(false)} severity="success" sx={{ width: '100%', borderRadius: 2 }}>
          Referral link copied to clipboard!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReferralsPage;
