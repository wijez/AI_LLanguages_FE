import React, { useMemo } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { viVN, enUS, zhCN, jaJP, koKR } from '@mui/material/locale';
import { useTranslation } from 'react-i18next';

const map = { vi: viVN, en: enUS, zh: zhCN, ja: jaJP, ko: koKR };

export default function AppProviders({ children }) {
  const { i18n } = useTranslation();
  const lng = (i18n.resolvedLanguage || i18n.language || 'vi').slice(0,2);

  const theme = useMemo(() => createTheme(
    {
      direction: document.documentElement.dir,
      typography: {
        fontFamily: 'var(--app-font)',
        button: { textTransform: 'none', fontWeight: 700 },
        h1: { fontWeight: 800 },
        h2: { fontWeight: 800 },
        h3: { fontWeight: 700 }
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: { fontFamily: 'var(--app-font)' }
          }
        }
      }
    },
    map[lng]
  ), [lng]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
