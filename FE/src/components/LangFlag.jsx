import React from 'react';
import ReactCountryFlag from 'react-country-flag';
import { langToCountry } from '../utils/langToCountry';

export default function LangFlag({ code, size = 40, rounded = true }) {
  const cc = langToCountry(code);
  return (
    <div
      className={`overflow-hidden ${rounded ? 'rounded-xl' : ''}`}
      style={{ width: size, height: size }}
      title={cc}
    >
      <ReactCountryFlag
        countryCode={cc}
        svg
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}
