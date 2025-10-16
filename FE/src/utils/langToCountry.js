export function langToCountry(lang) {
  const code = (lang || '').toLowerCase();
  return ({
    en: 'US', vi: 'VN', zh: 'CN', ja: 'JP', ko: 'KR',
    fr: 'FR', de: 'DE', es: 'ES', it: 'IT'
  }[code] || 'US');
}
