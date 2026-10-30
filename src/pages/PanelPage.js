import React from 'react';
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
} from '@mui/material';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import Sidebar from '../components/Sidebar';

const doctorCredentialsData = [
  {
    id: 1,
    doctor: 'Dr. Amelia Tan',
    clinic: 'Camden Aesthetics',
    smc: 'M23481Z',
    status: 'SMC verified',
  },
  {
    id: 2,
    doctor: 'Dr. Rajesh Kumar',
    clinic: 'Orchard Family Clinic',
    smc: 'M18702C',
    status: 'SMC verified',
  },
  {
    id: 3,
    doctor: 'Dr. Sophia Lim',
    clinic: 'Novena Dental Studio',
    smc: 'D44109H',
    status: 'SMC verified',
  },
  {
    id: 4,
    doctor: 'Dr. Marcus Chen',
    clinic: 'Orthosports Singapore',
    smc: 'M15620B',
    status: 'SMC verified',
  },
];

const PanelPage = () => {
  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: 'background.default' }}>
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
                SMC credential status for listed doctors.
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

          {/* Doctor Credentials Table Card */}
          <Paper
            elevation={1}
            sx={{
              borderRadius: 2,
              p: 3,
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Card Header */}
            <Box sx={{ mb: 2.5 }}>
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  fontWeight: 700,
                  color: 'text.primary',
                  lineHeight: 1.2,
                }}
              >
                Doctor credentials
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  mt: 0.5,
                }}
              >
                Last sweep 8 Sept 2026
              </Typography>
            </Box>

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
                    <TableCell sx={{ width: '28%' }}>DOCTOR</TableCell>
                    <TableCell sx={{ width: '32%' }}>CLINIC</TableCell>
                    <TableCell sx={{ width: '20%' }}>SMC</TableCell>
                    <TableCell sx={{ width: '20%' }}>STATUS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {doctorCredentialsData.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{
                        transition: 'background-color 0.15s ease',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.02) !important',
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
                            fontSize: '0.9375rem',
                          }}
                        >
                          {row.doctor}
                        </Typography>
                      </TableCell>

                      {/* Clinic */}
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            fontWeight: 500,
                          }}
                        >
                          {row.clinic}
                        </Typography>
                      </TableCell>

                      {/* SMC */}
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            fontWeight: 500,
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                          }}
                        >
                          {row.smc}
                        </Typography>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.75,
                            color: '#059669',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                          }}
                        >
                          <GppGoodOutlinedIcon sx={{ fontSize: 18, color: '#059669' }} />
                          {row.status}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Box>
    );
  };

export default PanelPage;

