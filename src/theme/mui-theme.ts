import { createTheme, responsiveFontSizes } from '@mui/material/styles';

const baseTheme = createTheme({
  palette: {
    background: {
      default: '#F4F7F6',
      paper: '#FFFFFF',
    },
    primary: {
      main: '#27AE60', // Wealth/Inflows
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F1C40F', // Highlights/Insights
      contrastText: '#2C3E50',
    },
    text: {
      primary: '#2C3E50', // Crisp deep charcoal-slate
      secondary: '#5A6C7D',
    },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    body1: {
      fontFamily: '"Inter", sans-serif',
    },
    body2: {
      fontFamily: '"Inter", sans-serif',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:active': {
            transform: 'scale(0.97)',
          },
        },
        contained: {
          boxShadow: '0 4px 14px 0 rgba(39, 174, 96, 0.39)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(39, 174, 96, 0.23)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #FFFFFF 0%, #E8ECEF 100%)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

export const theme = responsiveFontSizes(baseTheme);
