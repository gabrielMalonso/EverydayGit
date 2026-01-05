import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// English resources
import enCommon from './resources/en/common.json';
import enNavigation from './resources/en/navigation.json';
import enCommits from './resources/en/commits.json';
import enBranches from './resources/en/branches.json';
import enSettings from './resources/en/settings.json';
import enSetup from './resources/en/setup.json';

// Portuguese (Brazil) resources
import ptBRCommon from './resources/pt-BR/common.json';
import ptBRNavigation from './resources/pt-BR/navigation.json';
import ptBRCommits from './resources/pt-BR/commits.json';
import ptBRBranches from './resources/pt-BR/branches.json';
import ptBRSettings from './resources/pt-BR/settings.json';
import ptBRSetup from './resources/pt-BR/setup.json';

// Spanish resources
import esCommon from './resources/es/common.json';
import esNavigation from './resources/es/navigation.json';
import esCommits from './resources/es/commits.json';
import esBranches from './resources/es/branches.json';
import esSettings from './resources/es/settings.json';
import esSetup from './resources/es/setup.json';

export const defaultNS = 'common';
export const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    commits: enCommits,
    branches: enBranches,
    settings: enSettings,
    setup: enSetup,
  },
  'pt-BR': {
    common: ptBRCommon,
    navigation: ptBRNavigation,
    commits: ptBRCommits,
    branches: ptBRBranches,
    settings: ptBRSettings,
    setup: ptBRSetup,
  },
  es: {
    common: esCommon,
    navigation: esNavigation,
    commits: esCommits,
    branches: esBranches,
    settings: esSettings,
    setup: esSetup,
  },
} as const;

// Get stored language or default to pt-BR
const getStoredLanguage = (): string => {
  if (typeof window === 'undefined') return 'pt-BR';
  try {
    const stored = window.localStorage.getItem('everydaygit.ui_language');
    if (stored && ['en', 'pt-BR', 'es'].includes(stored)) {
      return stored;
    }
  } catch {
    // Ignore storage errors
  }
  return 'pt-BR';
};

i18n.use(initReactI18next).init({
  resources,
  lng: getStoredLanguage(),
  fallbackLng: 'en',
  defaultNS,
  ns: ['common', 'navigation', 'commits', 'branches', 'settings', 'setup'],
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  react: {
    useSuspense: false,
  },
});

// Helper to change language and persist
export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('everydaygit.ui_language', lng);
    } catch {
      // Ignore storage errors
    }
  }
};

export default i18n;
