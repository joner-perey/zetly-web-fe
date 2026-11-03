import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Divider,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import AttachEmailRoundedIcon from '@mui/icons-material/AttachEmailRounded';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import SmartphoneRoundedIcon from '@mui/icons-material/SmartphoneRounded';
import { sendQrEmail, registerClientWithQr } from '../services/onboardingService';

const insuranceProviders = [
  'AIA Singapore',
  'Great Eastern',
  'Prudential Singapore',
  'Singlife',
  'Income Insurance',
  'Cigna Healthcare',
  'Bupa Global',
];

const RegisterPatientModal = ({ open, onClose, onPatientRegistered }) => {
  const [step, setStep] = useState(1); // 1 = Form, 2 = QR Code Screen

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [clientCode, setClientCode] = useState(`ZT-${Math.floor(10500 + Math.random() * 400)}`);
  const [dob, setDob] = useState('1992-06-15');
  const [gender, setGender] = useState('Female');
  const [insurance, setInsurance] = useState('AIA Singapore');
  const [policyNumber, setPolicyNumber] = useState('POL-9921-X');
  const [planType, setPlanType] = useState('Corporate Comprehensive');
  const [cashless, setCashless] = useState(true);
  const [contactNumber, setContactNumber] = useState('+65 9123 4567');

  // Generated QR details
  const [onboardUrl, setOnboardUrl] = useState('');
  const [patientStatus, setPatientStatus] = useState('pending_activation');
  const [copied, setCopied] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState('success');

  // Direct SMTP Email sending state
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [registeredClientId, setRegisteredClientId] = useState(null);

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  // Handle Generate QR & Register Patient
  const handleGenerateQR = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    let targetUrl = '';
    let clientId = null;

    try {
      // Call Laravel backend to register patient
      const res = await registerClientWithQr({
        full_name: fullName.trim(),
        client_code: clientCode.trim(),
        email: patientEmail.trim() || null,
        date_of_birth: dob || null,
        gender: gender || null,
        insurance_provider: insurance || null,
        insurance_id: policyNumber || null,
        plan_type: planType || null,
        contact_number: contactNumber || null,
        cashless_eligible: cashless,
      });

      if (res?.onboard_url) {
        targetUrl = res.onboard_url;
      }
      if (res?.client?.id) {
        clientId = res.client.id;
        setRegisteredClientId(clientId);
      }
    } catch (err) {
      console.warn('Backend registration notice (continuing with client QR):', err.message);
    }

    if (!targetUrl) {
      const generatedToken = `inv_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`;
      targetUrl = `https://app.zetly.health/onboard?token=${generatedToken}&client=${encodeURIComponent(clientCode)}`;
    }

    setOnboardUrl(targetUrl);
    setPatientStatus('pending_activation');
    setEmailSent(false);
    setStep(2);

    if (onPatientRegistered) {
      onPatientRegistered({
        id: clientCode,
        requestId: `CLM-${Math.floor(2050 + Math.random() * 100)}`,
        patient: fullName,
        doctor: 'Dr. Rajesh Kumar',
        clinic: 'Orchard Family Clinic',
        specialty: 'GP',
        visitDate: 'Scheduled via App',
        visitTime: 'Pending booking',
        cover: cashless ? 'Cashless treatment' : 'Discounted consultation',
        received: 'Just now',
        status: 'Awaiting review',
        filterCategory: 'Pending',
      });
    }
  };

  // Copy Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(onboardUrl);
    setCopied(true);
    showToast('Onboarding link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  // Render High-Res Canvas with QR and branding
  const generateQrCardCanvas = (callback) => {
    const svgElement = document.getElementById('patient-qr-svg');
    if (!svgElement) return;

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
      ctx.fillText(fullName || 'Patient', canvas.width / 2, 385);

      ctx.fillStyle = '#64748b';
      ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(`${clientCode} \u2022 ${insurance}`, canvas.width / 2, 415);

      ctx.fillStyle = '#059669';
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText('Scan with Zetly App to set username & password', canvas.width / 2, 460);

      callback(canvas);
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Save QR As Standalone Image (PNG Card)
  const handleSaveAsImage = () => {
    generateQrCardCanvas((canvas) => {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      const fileName = `${(fullName || 'patient').trim().replace(/[^a-zA-Z0-9]/g, '_')}_Zetly_QR.png`;
      downloadLink.download = fileName;
      downloadLink.href = pngUrl;
      downloadLink.click();
      showToast(`Saved QR image: ${fileName}`);
    });
  };

  // Send QR Email directly via Laravel Backend + SMTP (No Microsoft Graph API)
  const handleSendEmail = () => {
    if (!patientEmail || !patientEmail.trim()) {
      showToast('Please enter the patient’s email address.', 'warning');
      return;
    }

    generateQrCardCanvas(async (canvas) => {
      setSendingEmail(true);
      try {
        const pngDataUrl = canvas.toDataURL('image/png');

        await sendQrEmail({
          email: patientEmail.trim(),
          qrCodeBase64: pngDataUrl,
          clientId: registeredClientId,
          clientCode: clientCode,
          patientName: fullName,
          insurance: insurance,
          policyNumber: policyNumber,
          planType: planType,
          cashless: cashless,
          onboardUrl: onboardUrl,
        });

        setEmailSent(true);
        showToast(`QR Code email sent successfully to ${patientEmail} via SMTP!`, 'success');
      } catch (err) {
        console.error('SMTP email sending error:', err);
        showToast(`Failed to send email: ${err.message}`, 'error');
      } finally {
        setSendingEmail(false);
      }
    });
  };

  // Simulate Patient Scan & Password Setup
  const handleSimulateScan = () => {
    setPatientStatus('activated');
    showToast(`Success! ${fullName} scanned QR and activated account.`);
  };

  // Reset Modal
  const handleReset = () => {
    setStep(1);
    setFullName('');
    setPatientEmail('');
    setClientCode(`ZT-${Math.floor(10500 + Math.random() * 400)}`);
    setPatientStatus('pending_activation');
    setEmailSent(false);
    setRegisteredClientId(null);
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleReset}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              p: 1,
            },
          },
        }}
      >
        {/* Modal Header */}
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {step === 2 && (
              <IconButton size="small" onClick={() => setStep(1)} sx={{ mr: 0.5 }}>
                <ArrowBackRoundedIcon fontSize="small" />
              </IconButton>
            )}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {step === 1 ? 'Register Patient & Generate QR' : 'Patient Onboarding QR'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {step === 1
                  ? 'Input verified insurance records to generate instant activation QR.'
                  : 'Patient scans this QR with Zetly App to set username & password.'}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={handleReset}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1.5 }}>
          {step === 1 ? (
            /* STEP 1: Registration Form */
            <Box component="form" onSubmit={handleGenerateQR} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Patient Full Name"
                  placeholder="e.g. Elena Ong"
                  size="small"
                  required
                  fullWidth
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  sx={{ flex: 2 }}
                />
                <TextField
                  label="Zetly ID / Member Code"
                  size="small"
                  required
                  fullWidth
                  value={clientCode}
                  onChange={(e) => setClientCode(e.target.value)}
                  sx={{ flex: 1 }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Patient Email Address"
                  placeholder="e.g. elena.ong@example.com"
                  type="email"
                  size="small"
                  fullWidth
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  sx={{ flex: 1.2 }}
                />
                <TextField
                  label="Patient Contact (Mobile)"
                  size="small"
                  fullWidth
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  sx={{ flex: 1 }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Date of Birth"
                  type="date"
                  size="small"
                  fullWidth
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  select
                  label="Gender"
                  size="small"
                  fullWidth
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </Box>

              <Divider sx={{ my: 0.5 }} />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  select
                  label="Insurance Provider"
                  size="small"
                  fullWidth
                  value={insurance}
                  onChange={(e) => setInsurance(e.target.value)}
                  sx={{ flex: 1.2 }}
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
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  sx={{ flex: 1 }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Plan Coverage"
                  size="small"
                  fullWidth
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value)}
                />
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Enable Cashless Consultation
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Auto-clears cashless eligibility upon clinic intake.
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={cashless}
                      onChange={(e) => setCashless(e.target.checked)}
                      color="success"
                    />
                  }
                  label=""
                  sx={{ m: 0 }}
                />
              </Box>

              <DialogActions sx={{ px: 0, pt: 1 }}>
                <Button onClick={handleReset} sx={{ textTransform: 'none', color: 'text.secondary' }}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<QrCode2RoundedIcon />}
                  sx={{
                    bgcolor: '#0f766e',
                    '&:hover': { bgcolor: '#0d5f58' },
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 3,
                  }}
                >
                  Generate QR & Activate
                </Button>
              </DialogActions>
            </Box>
          ) : (
            /* STEP 2: QR Code Presentation Screen */
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1 }}>
              {/* Status Banner */}
              <Box sx={{ width: '100%', mb: 2 }}>
                {patientStatus === 'activated' ? (
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    Account successfully linked! <strong>{fullName}</strong> has registered username & password.
                  </Alert>
                ) : (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Present this QR to <strong>{fullName}</strong>. Scanning will open the setup screen in their Zetly App.
                  </Alert>
                )}
              </Box>

              {/* QR Code Container */}
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
                  value={onboardUrl}
                  size={190}
                  level="H"
                  includeMargin={false}
                />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {fullName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {clientCode} &bull; {insurance}
                  </Typography>
                </Box>
              </Paper>

              {/* Activation Status Badge */}
              <Box sx={{ mb: 2 }}>
                {patientStatus === 'activated' ? (
                  <Chip
                    icon={<CheckCircleRoundedIcon />}
                    label="Account Activated & Linked"
                    color="success"
                    sx={{ fontWeight: 600, px: 1 }}
                  />
                ) : (
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
                )}
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
                  {onboardUrl}
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

              {/* Recipient Email Confirmation & Quick Edit */}
              <Box sx={{ width: '100%', mb: 2 }}>
                <TextField
                  label="Patient Recipient Email"
                  placeholder="e.g. patient@example.com"
                  type="email"
                  size="small"
                  fullWidth
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  helperText="Recipient will receive the welcome instructions with the QR code attached via SMTP."
                />
              </Box>

              {/* Email Sent Status Banner */}
              {emailSent && (
                <Alert
                  severity="success"
                  icon={<MarkEmailReadRoundedIcon />}
                  sx={{ width: '100%', mb: 2, borderRadius: 2 }}
                >
                  Email sent to <strong>{patientEmail}</strong> via SMTP with attached QR!
                </Alert>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
                <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
                  {/* Save as Image */}
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

                  {/* Send QR Email via Laravel SMTP */}
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={
                      sendingEmail ? (
                        <CircularProgress size={16} sx={{ color: '#fff' }} />
                      ) : emailSent ? (
                        <MarkEmailReadRoundedIcon />
                      ) : (
                        <AttachEmailRoundedIcon />
                      )
                    }
                    onClick={handleSendEmail}
                    disabled={sendingEmail}
                    sx={{
                      bgcolor: emailSent ? '#059669' : '#0f766e',
                      '&:hover': { bgcolor: emailSent ? '#047857' : '#0d5f58' },
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
                      : emailSent
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

                {patientStatus !== 'activated' ? (
                  <Button
                    fullWidth
                    variant="text"
                    onClick={handleSimulateScan}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.8125rem',
                      color: '#2563eb',
                      py: 0.5,
                    }}
                  >
                    Simulate App Scan (Test)
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleReset}
                    sx={{
                      bgcolor: '#059669',
                      '&:hover': { bgcolor: '#047857' },
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: 2,
                      py: 1,
                    }}
                  >
                    Done
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Toast Alert */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={5000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          severity={toastSeverity}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default RegisterPatientModal;
