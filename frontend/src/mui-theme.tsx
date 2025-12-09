import { createTheme } from '@mui/material/styles';

/**
 * VALE TECH - TEMA GLOBAL
 * Paleta de cores consistente em todo o aplicativo
 */
const theme = createTheme({
  palette: {
    // Cores Primárias/Ação
    primary: {
      main: '#006FAD',      // Azul 300C principal
      light: '#4d9dc4',     // Azul mais claro
      dark: '#004a73',      // Azul mais escuro
      contrastText: '#fff',
    },
    secondary: {
      main: '#6C757D',      // Cinza neutro
      light: '#868e96',
      dark: '#5a6268',
      contrastText: '#fff',
    },
    
    // Cores de Status/Feedback
    success: {
      main: '#28A745',      // Verde
      light: '#d4edda',
      dark: '#1e7e34',
      contrastText: '#fff',
    },
    error: {
      main: '#DC3545',      // Vermelho
      light: '#f8d7da',
      dark: '#bd2130',
      contrastText: '#fff',
    },
    warning: {
      main: '#FFC107',      // Amarelo
      light: '#fff3cd',
      dark: '#e0a800',
      contrastText: '#212529',
    },
    info: {
      main: '#17A2B8',      // Azul claro
      light: '#d1ecf1',
      dark: '#117a8b',
      contrastText: '#fff',
    },
    
    // Cores de Fundo e Texto
    background: {
      default: '#F8F9FA',   // Fundo da tela
      paper: '#FFFFFF',     // Fundo de cards/papers
    },
    text: {
      primary: '#212529',   // Texto principal
      secondary: '#6c757d', // Texto secundário
    },
  },
  
  typography: {
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  
  shape: {
    borderRadius: 8,
  },
  
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme;
