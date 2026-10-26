import { createTheme } from '@mui/material/styles'

export const dawTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00e5ff'
    },
    secondary: {
      main: '#7c4dff'
    },
    error: {
      main: '#ff3d00'
    },
    warning: {
      main: '#ffea00'
    },
    success: {
      main: '#00e676'
    },
    background: {
      default: '#0f1015',
      paper: '#171821'
    },
    text: {
      primary: '#eceff4',
      secondary: '#9aa0b4'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    }
  }
})
