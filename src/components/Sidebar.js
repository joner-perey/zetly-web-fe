import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Avatar,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  TextField,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

const menuItems = [
  {
    id: 'intake-queue',
    path: '/',
    label: 'Intake queue',
    icon: <InboxRoundedIcon fontSize="small" />,
    count: 3,
  },
  {
    id: 'panel',
    path: '/panel',
    label: 'Panel',
    icon: <MedicalServicesOutlinedIcon fontSize="small" />,
    count: null,
  },
  {
    id: 'referrals',
    path: '/referrals',
    label: 'Referrals',
    icon: <SwapHorizRoundedIcon fontSize="small" />,
    count: null,
  },
  {
    id: 'content',
    path: '/content',
    label: 'Content',
    icon: <CampaignOutlinedIcon fontSize="small" />,
    count: null,
  },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Menu anchor state
  const [anchorEl, setAnchorEl] = useState(null);

  // Dialog states
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  // User Profile Data
  const [userName, setUserName] = useState('Alex Tan');
  const [userEmail, setUserEmail] = useState('alex.tan@zetly.health');
  const [userRole, setUserRole] = useState('Claims lead');

  // Change Password Form Data
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Toast notification state
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  // Profile Dialog handlers
  const handleOpenProfile = () => {
    handleCloseMenu();
    setProfileOpen(true);
  };

  const handleSaveProfile = () => {
    setProfileOpen(false);
    setToast({ open: true, message: 'Profile updated successfully!', severity: 'success' });
  };

  // Password Dialog handlers
  const handleOpenPassword = () => {
    handleCloseMenu();
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordOpen(true);
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordError('');
    setPasswordOpen(false);
    setToast({ open: true, message: 'Password changed successfully!', severity: 'success' });
  };

  // Logout handlers
  const handleOpenLogout = () => {
    handleCloseMenu();
    setLogoutOpen(true);
  };

  const handleConfirmLogout = () => {
    localStorage.removeItem('zetly-api-token');
    localStorage.removeItem('zetly-current-user');
    setLogoutOpen(false);
    setToast({ open: true, message: 'You have been logged out.', severity: 'info' });
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  return (
    <Box
      component="aside"
      sx={{
        width: 250,
        minWidth: 250,
        height: '100%',
        bgcolor: '#ffffff',
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        p: 2.5,
        boxSizing: 'border-box',
      }}
    >
      {/* Sidebar Header */}
      <Box sx={{ mb: 3, px: 1 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'text.secondary',
            textTransform: 'uppercase',
          }}
        >
          Operations
        </Typography>
      </Box>

      {/* Menu List */}
      <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {menuItems.map((item) => {
          const isActive =
            item.id === 'intake-queue'
              ? location.pathname === '/' || location.pathname === '/intake-queue'
              : location.pathname.startsWith(item.path);

          return (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  px: 1.5,
                  color: isActive ? '#059669' : 'text.primary',
                  bgcolor: isActive ? '#ecfdf5 !important' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive ? '#d1fae5 !important' : 'rgba(0, 0, 0, 0.04)',
                  },
                  '&.Mui-selected': {
                    bgcolor: '#ecfdf5',
                    color: '#059669',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 34,
                    color: isActive ? '#059669' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
                {item.count !== null && (
                  <Chip
                    label={item.count}
                    size="small"
                    sx={{
                      height: 20,
                      minWidth: 20,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      bgcolor: '#fef3c7',
                      color: '#b45309',
                      border: '1px solid #fde68a',
                      '& .MuiChip-label': {
                        px: 0.75,
                      },
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Spacer to push footer to bottom */}
      <Box sx={{ flexGrow: 1 }} />

      {/* Sidebar Footer - Clickable user profile trigger */}
      <Divider sx={{ mb: 2 }} />
      <Box
        onClick={handleOpenMenu}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 1,
          borderRadius: 2,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'primary.main',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {userName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
        </Avatar>
        <Box sx={{ overflow: 'hidden', flexGrow: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              fontSize: '0.875rem',
              lineHeight: 1.2,
              color: 'text.primary',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {userName}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              display: 'block',
              mt: 0.25,
            }}
          >
            {userRole}
          </Typography>
        </Box>
        <UnfoldMoreRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
      </Box>

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            elevation: 3,
            sx: {
              minWidth: 200,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              p: 0.5,
              mb: 1,
            },
          },
        }}
      >
        <MenuItem onClick={handleOpenProfile} sx={{ borderRadius: 1.5, py: 1 }}>
          <ListItemIcon sx={{ minWidth: 32, color: 'text.secondary' }}>
            <PersonOutlineRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Profile"
            primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
          />
        </MenuItem>

        <MenuItem onClick={handleOpenPassword} sx={{ borderRadius: 1.5, py: 1 }}>
          <ListItemIcon sx={{ minWidth: 32, color: 'text.secondary' }}>
            <LockResetRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Change password"
            primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
          />
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem
          onClick={handleOpenLogout}
          sx={{
            borderRadius: 1.5,
            py: 1,
            color: '#dc2626',
            '&:hover': {
              bgcolor: '#fef2f2',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: '#dc2626' }}>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600, color: '#dc2626' }}
          />
        </MenuItem>
      </Menu>

      {/* 1. Profile Dialog */}
      <Dialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3, p: 1 },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            User Profile
          </Typography>
          <IconButton size="small" onClick={() => setProfileOpen(false)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: '1.25rem', fontWeight: 600 }}>
              {userName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {userName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Zetly Admin &bull; {userRole}
              </Typography>
            </Box>
          </Box>

          <TextField
            label="Full Name"
            size="small"
            fullWidth
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <TextField
            label="Email Address"
            size="small"
            fullWidth
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
          />
          <TextField
            label="Role"
            size="small"
            fullWidth
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setProfileOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveProfile}
            sx={{
              textTransform: 'none',
              bgcolor: '#0f766e',
              '&:hover': { bgcolor: '#0d5f58' },
              borderRadius: 1.5,
              px: 2.5,
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2. Change Password Dialog */}
      <Dialog
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3, p: 1 },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Change Password
          </Typography>
          <IconButton size="small" onClick={() => setPasswordOpen(false)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <DialogContentText sx={{ mb: 2, fontSize: '0.875rem' }}>
            Enter your current password and choose a new secure password.
          </DialogContentText>

          {passwordError && (
            <Alert severity="error" sx={{ mb: 2, py: 0.5, borderRadius: 1.5, fontSize: '0.8125rem' }}>
              {passwordError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSavePassword} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              size="small"
              fullWidth
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end">
                        {showCurrentPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              size="small"
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                        {showNewPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              size="small"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                        {showConfirmPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPasswordOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSavePassword}
            sx={{
              textTransform: 'none',
              bgcolor: '#0f766e',
              '&:hover': { bgcolor: '#0d5f58' },
              borderRadius: 1.5,
              px: 2.5,
            }}
          >
            Update Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* 3. Logout Confirmation Dialog */}
      <Dialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3, p: 1 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Log out of Zetly?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.875rem' }}>
            Are you sure you want to end your session? Any unsaved changes in active forms will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLogoutOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmLogout}
            sx={{
              textTransform: 'none',
              borderRadius: 1.5,
              px: 2.5,
            }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Alert */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
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

export default Sidebar;
