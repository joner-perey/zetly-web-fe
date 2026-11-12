import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Avatar,
  Chip,
  Divider,
  Container,
} from '@mui/material';
import MedicalServicesRoundedIcon from '@mui/icons-material/MedicalServicesRounded';
import PhoneAndroidRoundedIcon from '@mui/icons-material/PhoneAndroidRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { resolveReferralLink } from '../services/onboardingService';

const ReferralRedirectPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadLink() {
      try {
        setLoading(true);
        setError('');
        const res = await resolveReferralLink(code);
        if (!isMounted) return;
        setData(res);

        // Attempt deep link if on mobile device
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile && res?.doctor_id) {
          const deepLink = `zetly://?doctorId=${res.doctor_id}&referral=${encodeURIComponent(code)}`;
          window.location.href = deepLink;
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to resolve referral link:', err);
        setError(err.message || 'Invalid or expired referral link.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (code) {
      loadLink();
    } else {
      setLoading(false);
      setError('No referral code provided.');
    }

    return () => {
      isMounted = false;
    };
  }, [code]);

  const handleOpenMobileApp = () => {
    if (data?.doctor_id) {
      window.location.href = `zetly://?doctorId=${data.doctor_id}&referral=${encodeURIComponent(code)}`;
    } else {
      window.location.href = `zetly://`;
    }
  };

  const handleContinueToWeb = () => {
    if (data?.doctor_id) {
      navigate(`/panel?doctorId=${data.doctor_id}`);
    } else {
      navigate('/panel');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Container maxWidth="sm">
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress size={48} sx={{ color: '#0f766e', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Redirecting you to the doctor's clinic...
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Resolving referral code: {code}
            </Typography>
          </Box>
        ) : error ? (
          <Card elevation={2} sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: '#fee2e2',
                color: '#dc2626',
                mx: 'auto',
                mb: 2,
              }}
            >
              <MedicalServicesRoundedIcon fontSize="large" />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
              Referral Link Not Found
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/panel')}
              sx={{
                bgcolor: '#0f766e',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: '#0d5f58' },
              }}
            >
              Browse Doctor Directory
            </Button>
          </Card>
        ) : (
          <Card
            elevation={2}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
            }}
          >
            {/* Header Badge */}
            <Box
              sx={{
                bgcolor: '#f0fdf4',
                borderBottom: '1px solid #dcfce7',
                px: 3,
                py: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <CheckCircleRoundedIcon sx={{ color: '#16a34a', fontSize: 22 }} />
              <Typography variant="subtitle2" sx={{ color: '#15803d', fontWeight: 600 }}>
                Special Referral Invitation &bull; {code}
              </Typography>
            </Box>

            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5, mb: 3 }}>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: '#0f766e',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                  }}
                >
                  {data?.doctor?.name
                    ? data.doctor.name
                        .replace(/^Dr\.?\s+/i, '')
                        .slice(0, 2)
                        .toUpperCase()
                    : 'ZT'}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {data?.doctor?.name || 'Partner Doctor'}
                    </Typography>
                    <VerifiedRoundedIcon sx={{ color: '#059669', fontSize: 20 }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 500, mt: 0.25 }}>
                    {data?.doctor?.clinic || 'Zetly Panel Clinic'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={data?.doctor?.specialty || 'General Practice'}
                      size="small"
                      sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 600, fontSize: '0.75rem' }}
                    />
                    {data?.doctor?.cashless_eligible && (
                      <Chip
                        label="Cashless treatment"
                        size="small"
                        sx={{ bgcolor: '#ecfdf5', color: '#059669', fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2.5 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Consultation Fee:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  ${data?.doctor?.consultation_fee ? Number(data.doctor.consultation_fee).toFixed(0) : '150'} SGD
                </Typography>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleOpenMobileApp}
                  startIcon={<PhoneAndroidRoundedIcon />}
                  sx={{
                    bgcolor: '#0f766e',
                    color: '#ffffff',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: 2,
                    py: 1.5,
                    fontSize: '1rem',
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: '#0d5f58',
                      boxShadow: 'none',
                    },
                  }}
                >
                  Open in Zetly Mobile App
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleContinueToWeb}
                  startIcon={<LanguageRoundedIcon />}
                  sx={{
                    borderColor: '#cbd5e1',
                    color: '#334155',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                    py: 1.25,
                    '&:hover': {
                      borderColor: '#94a3b8',
                      bgcolor: '#f8fafc',
                    },
                  }}
                >
                  Continue to Web Directory
                </Button>
              </Box>

              {/* <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  textAlign: 'center',
                  color: 'text.secondary',
                  mt: 3,
                  fontSize: '0.75rem',
                }}
              >
                Booking via this referral link applies guaranteed panel discounts and eligible cashless claims.
              </Typography> */}
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
};

export default ReferralRedirectPage;
