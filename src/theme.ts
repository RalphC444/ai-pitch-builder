import { createTheme } from '@mui/material/styles';

/**
 * MUI theme built from the Nexus / Unified Email Experience Figma tokens
 */
export const theme = createTheme({
  palette: {
    primary: { main: '#0068bc', dark: '#005296', light: '#339bef', contrastText: '#ffffff' },
    success: { main: '#149c4d' },
    warning: { main: '#fe800f' },
    error: { main: '#c41e2f' },
    text: { primary: '#1c2024', secondary: '#5c5c5c' },
    background: { default: '#f0f4f8', paper: '#ffffff' },
    divider: '#ebebeb',
  },
  typography: {
    fontFamily: "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 40, borderRadius: 6, paddingInline: 16 },
        sizeSmall: { minHeight: 32, paddingInline: 12, fontSize: 12 },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { color: 'rgba(0, 0, 0, 0.64)' } },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: {
        tooltip: { backgroundColor: '#333333', fontSize: 12, fontWeight: 500 },
        arrow: { color: '#333333' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { fontSize: 14, borderColor: '#e3e6eb' },
        head: { fontWeight: 600, color: '#1c2024', backgroundColor: '#f6f8fb' },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { fontSize: 14, backgroundColor: '#ffffff' },
      },
    },
    MuiMenuItem: {
      styleOverrides: { root: { fontSize: 14 } },
    },
  },
});

export default theme;
