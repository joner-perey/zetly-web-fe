import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb', // Modern vibrant blue
      light: '#3b82f6',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#64748b',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    divider: '#e2e8f0',
    success: {
      main: '#10b981',
      light: '#ecfdf5',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b',
      light: '#fffbeb',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444',
      light: '#fef2f2',
      dark: '#dc2626',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontWeight: 600,
    },
    subtitle2: {
      fontWeight: 600,
      fontSize: '0.875rem',
    },
    body1: {
      fontSize: '0.9375rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedSuccess: {
          backgroundColor: '#10b981',
          '&:hover': {
            backgroundColor: '#059669',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #f1f5f9',
          padding: '14px 16px',
        },
        head: {
          color: '#64748b',
          fontWeight: 700,
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
        },
      },
    },
  },
});

export default theme;

