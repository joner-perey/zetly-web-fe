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
import { sendQrEmail, registerClientWithQr, checkClientCodeExists, checkClientEmailExists } from '../services/onboardingService';

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

const RegisterPatientModal = ({ open, onClose, onPatientRegistered, closeOnGenerate = true }) => {
  const [step, setStep] = useState(1); // 1 = Form, 2 = QR Code Screen

  // Form Fields (starts clean with no dummy data)
  const [fullName, setFullName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [clientCode, setClientCode] = useState(`ZT-${Math.floor(10500 + Math.random() * 400)}`);
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [insurance, setInsurance] = useState('AIA Singapore');
  const [policyNumber, setPolicyNumber] = useState('');
  const [planType, setPlanType] = useState('');
  const [cashless, setCashless] = useState(true);
  const [contactNumber, setContactNumber] = useState('');

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
  const [clientCodeError, setClientCodeError] = useState('');
  const [checkingCode, setCheckingCode] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);

  const showToast = (message, severity = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  // Check if patient email is already registered in DB
  const handlePatientEmailBlur = async () => {
    const trimmed = patientEmail.trim();
    if (!trimmed) {
      setEmailError('');
      return;
    }
    setCheckingEmail(true);
    try {
      const res = await checkClientEmailExists(trimmed);
      if (res?.exists) {
        setEmailError(res.message || `Email '${trimmed}' is already registered.`);
      } else {
        setEmailError('');
      }
    } catch (err) {
      console.warn('checkClientEmailExists blur check error:', err);
    } finally {
      setCheckingEmail(false);
    }
  };

  // Check if member code is already registered in DB
  const handleClientCodeBlur = async () => {
    const trimmed = clientCode.trim();
    if (!trimmed) {
      setClientCodeError('Member code is required.');
      return;
    }
    setCheckingCode(true);
    try {
      const res = await checkClientCodeExists(trimmed);
      if (res?.exists) {
        setClientCodeError(res.message || `Member code '${trimmed}' is already registered.`);
      } else {
        setClientCodeError('');
      }
    } catch (err) {
      console.warn('checkClientCodeExists blur check error:', err);
    } finally {
      setCheckingCode(false);
    }
  };

  // Reset Modal
  const handleReset = () => {
    setStep(1);
    setFullName('');
    setPatientEmail('');
    setClientCode(`ZT-${Math.floor(10500 + Math.random() * 400)}`);
    setDob('');
    setGender('Male');
    setInsurance('AIA Singapore');
    setPolicyNumber('');
    setPlanType('');
    setCashless(true);
    setContactNumber('');
    setClientCodeError('');
    setCheckingCode(false);
    setEmailError('');
    setCheckingEmail(false);
    setPatientStatus('pending_activation');
    setEmailSent(false);
    setRegisteredClientId(null);
    onClose();
  };

  // Handle Generate QR & Register Patient
  const handleGenerateQR = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const trimmedCode = clientCode.trim();
    if (!trimmedCode) {
      setClientCodeError('Member code is required.');
      showToast('Please enter a valid member code.', 'warning');
      return;
    }

    if (clientCodeError) {
      showToast(clientCodeError, 'error');
      return;
    }

    if (emailError) {
      showToast(emailError, 'error');
      return;
    }

    const trimmedEmail = patientEmail.trim();

    // Proactively verify uniqueness before proceeding
    setCheckingCode(true);
    if (trimmedEmail) setCheckingEmail(true);

    try {
      const checkRes = await checkClientCodeExists(trimmedCode);
      if (checkRes?.exists) {
        const errorMsg = checkRes.message || `Member code '${trimmedCode}' is already registered.`;
        setClientCodeError(errorMsg);
        showToast(errorMsg, 'error');
        setCheckingCode(false);
        if (trimmedEmail) setCheckingEmail(false);
        return;
      }

      if (trimmedEmail) {
        const checkEmailRes = await checkClientEmailExists(trimmedEmail);
        if (checkEmailRes?.exists) {
          const errorMsg = checkEmailRes.message || `Email '${trimmedEmail}' is already registered.`;
          setEmailError(errorMsg);
          showToast(errorMsg, 'error');
          setCheckingCode(false);
          setCheckingEmail(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Pre-registration check warning:', err.message);
    } finally {
      setCheckingCode(false);
      setCheckingEmail(false);
    }

    try {
      const res = await registerClientWithQr({
        full_name: fullName.trim(),
        client_code: trimmedCode,
        email: trimmedEmail || null,
        date_of_birth: dob || null,
        gender: gender || null,
        insurance_provider: insurance || null,
        insurance_id: policyNumber.trim() || null,
        plan_type: planType.trim() || null,
        contact_number: contactNumber.trim() || null,
        cashless_eligible: cashless,
      });

      const targetUrl = res?.onboard_url;
      const backendToken = res?.token;
      const clientId = res?.client?.id;

      if (clientId) {
        setRegisteredClientId(clientId);
      }

      const newPatientRecord = {
        id: clientId,
        client_code: trimmedCode,
        full_name: fullName.trim(),
        email: trimmedEmail || '',
        contact_number: contactNumber.trim() || '',
        date_of_birth: dob || '',
        gender: gender || 'Male',
        insurance_provider: insurance || 'AIA Singapore',
        insurance_id: policyNumber.trim() || 'N/A',
        plan_type: planType.trim() || 'Standard Plan',
        cashless_eligible: cashless,
        onboarding_status: 'pending_activation',
        onboarding_token: backendToken,
        onboard_url: targetUrl,
        created_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
      };

      if (onPatientRegistered) {
        onPatientRegistered(newPatientRecord);
      }

      if (closeOnGenerate) {
        handleReset();
        return;
      }

      setOnboardUrl(targetUrl);
      setPatientStatus('pending_activation');
      setEmailSent(false);
      setStep(2);
    } catch (err) {
      const msg = err.message || 'Registration failed.';
      const isEmailDuplicate = /email/i.test(msg) && /already (been )?taken|already registered|exists|unique/i.test(msg);
      const isCodeDuplicate = (/client code|client_code/i.test(msg) || !isEmailDuplicate) && /already (been )?taken|already registered|exists|unique/i.test(msg);

      if (isEmailDuplicate) {
        setEmailError(msg);
      } else if (isCodeDuplicate) {
        setClientCodeError(msg);
      }
      showToast(msg, 'error');
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
    const svgElement = document.getElementById('modal-patient-qr-svg');
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

  // Send QR Email directly via Laravel Backend + SMTP
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
            <Box component="form" onSubmit={handleGenerateQR} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Patient Full Name"
                  placeholder="Enter full name"
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
                  onChange={(e) => {
                    setClientCode(e.target.value);
                    if (clientCodeError) setClientCodeError('');
                  }}
                  onBlur={handleClientCodeBlur}
                  error={Boolean(clientCodeError)}
                  helperText={clientCodeError}
                  InputProps={{
                    endAdornment: checkingCode ? <CircularProgress size={16} sx={{ color: '#32998f' }} /> : null,
                  }}
                  sx={{ flex: 1 }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Patient Email Address"
                  placeholder="patient@example.com"
                  type="email"
                  size="small"
                  fullWidth
                  value={patientEmail}
                  onChange={(e) => {
                    setPatientEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  onBlur={handlePatientEmailBlur}
                  error={Boolean(emailError)}
                  helperText={emailError || 'Must be unique per patient'}
                  InputProps={{
                    endAdornment: checkingEmail ? <CircularProgress size={16} sx={{ color: '#32998f' }} /> : null,
                  }}
                  sx={{ flex: 1.2 }}
                />
                <TextField
                  label="Patient Contact (Mobile)"
                  placeholder="+65 ..."
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
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
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
                  placeholder="e.g. POL-12345"
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
                  placeholder="e.g. Corporate Comprehensive"
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
                  id="modal-patient-qr-svg"
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

              <Box sx={{ width: '100%', mb: 2 }}>
                <TextField
                  label="Patient Recipient Email"
                  placeholder="patient@example.com"
                  type="email"
                  size="small"
                  fullWidth
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  helperText="Recipient will receive the welcome instructions with the QR code attached via SMTP."
                />
              </Box>

              {emailSent && (
                <Alert
                  severity="success"
                  icon={<MarkEmailReadRoundedIcon />}
                  sx={{ width: '100%', mb: 2, borderRadius: 2 }}
                >
                  Email sent to <strong>{patientEmail}</strong> via SMTP with attached QR!
                </Alert>
              )}

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
