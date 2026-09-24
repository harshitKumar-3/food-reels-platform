import React from 'react';

const COUNTRIES = [
  { code: '+91',  name: 'India',      flag: '🇮🇳', regex: /^\d{10}$/,    example: '9876543210' },
  { code: '+1',   name: 'USA/Canada', flag: '🇺🇸', regex: /^\d{10}$/,    example: '2025550123' },
  { code: '+44',  name: 'UK',         flag: '🇬🇧', regex: /^\d{10,11}$/, example: '7700900077' },
  { code: '+61',  name: 'Australia',  flag: '🇦🇺', regex: /^\d{9}$/,     example: '412345678'  },
  { code: '+971', name: 'UAE',        flag: '🇦🇪', regex: /^\d{9}$/,     example: '501234567'  },
  { code: '+65',  name: 'Singapore',  flag: '🇸🇬', regex: /^\d{8}$/,     example: '81234567'   },
];

export const validatePhone = (countryCode, phone) => {
  const country = COUNTRIES.find((c) => c.code === countryCode);
  if (!country) return 'Invalid country code';
  if (!phone.trim()) return 'Phone number is required';
  const numericPhone = phone.replace(/\D/g, '');
  if (!country.regex.test(numericPhone)) {
    return `Enter a valid ${country.name} number (e.g. ${country.example})`;
  }
  return '';
};

const inputBaseStyle = {
  padding: '10px 14px',
  borderRadius: '8px',
  fontSize: '14px',
  lineHeight: '1.4',
  outline: 'none',
  backgroundColor: 'var(--color-input-bg, #1e1e1e)',
  color: 'inherit',
  boxSizing: 'border-box',
};

const PhoneInput = ({ value, onChange, error }) => {
  const [countryCode, setCountryCode] = React.useState('+91');
  const [phone, setPhone] = React.useState('');

  // Sync when value is pre-populated (e.g. edit form)
  React.useEffect(() => {
    if (value) {
      const match = COUNTRIES.find((c) => value.startsWith(c.code));
      if (match) {
        setCountryCode(match.code);
        setPhone(value.substring(match.code.length).trim());
      } else {
        setPhone(value);
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];

  const handleCountryChange = (newCode) => {
    setCountryCode(newCode);
    onChange(newCode + ' ' + phone.trim());
  };

  const handlePhoneChange = (newPhone) => {
    setPhone(newPhone);
    onChange(countryCode + ' ' + newPhone.trim());
  };

  const borderColor = error ? '#f43f5e' : 'var(--color-border, #333)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {/* Row: flag+code selector | number input */}
      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
        {/* Country selector */}
        <select
          value={countryCode}
          onChange={(e) => handleCountryChange(e.target.value)}
          aria-label="Country code"
          style={{
            ...inputBaseStyle,
            width: '140px',
            flexShrink: 0,
            border: `1px solid ${borderColor}`,
            cursor: 'pointer',
            appearance: 'auto',
          }}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.code}
            </option>
          ))}
        </select>

        {/* Phone number input */}
        <input
          type="tel"
          inputMode="numeric"
          placeholder={selectedCountry.example}
          value={phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          aria-label="Phone number"
          style={{
            ...inputBaseStyle,
            flex: 1,
            minWidth: 0,
            border: `1px solid ${borderColor}`,
          }}
        />
      </div>

      {/* Inline error */}
      {error && (
        <span
          role="alert"
          style={{ color: '#f43f5e', fontSize: '12px', marginTop: '2px' }}
        >
          {error}
        </span>
      )}
    </div>
  );
};

export default PhoneInput;
