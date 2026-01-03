import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import commonEN from './locales/en/common.json';
import commonVI from './locales/vi/common.json';
import commonZH from './locales/zh/common.json';
import commonJA from './locales/ja/common.json';
import commonKO from './locales/ko/common.json';

import landingEN from './locales/en/landing.json';
import landingVI from './locales/vi/landing.json';
import landingZH from './locales/zh/landing.json';
import landingJA from './locales/ja/landing.json';
import landingKO from './locales/ko/landing.json';

import signupEN from './locales/en/signup.json';
import signupVI from './locales/vi/signup.json';
import signupZH from './locales/zh/signup.json';
import signupJA from './locales/ja/signup.json';
import signupKO from './locales/ko/signup.json';   

import learnEN from './locales/en/learn.json';
import learnVI from './locales/vi/learn.json';
import learnZH from './locales/zh/learn.json';
import learnJA from './locales/ja/learn.json';
import learnKO from './locales/ko/learn.json';

const resources = {
  en: {
    common: commonEN,
    landing: landingEN,
    signup: signupEN,
    learn: learnEN
  },
  vi: {
    common: commonVI,
    landing: landingVI,
    signup: signupVI,
    learn: learnVI
  },
   zh: {
    common: commonZH,
    landing: landingZH,
    signup: signupZH,
    learn: learnZH
  },
  ja: {
    common: commonJA,
    landing: landingJA,
    signup: signupJA, 
    learn: learnJA
  },
  ko: {
    common: commonKO,
    landing: landingKO,
    signup: signupKO,
    learn: learnKO
  }
 
};




i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'landing', 'learn', 'signup'],
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'lang'
    },

    interpolation: {
      escapeValue: false
    },

    react: {
      useSuspense: true
    }
  });

// Load saved language on init
const savedLang = localStorage.getItem('lang');
if (savedLang && ['vi', 'en', 'zh', 'ja', 'ko'].includes(savedLang)) {
  i18n.changeLanguage(savedLang);
}

export default i18n;