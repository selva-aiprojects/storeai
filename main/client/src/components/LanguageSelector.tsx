import React from 'react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <span style={{ fontSize: '0.75rem', color: 'var(--module-reports)' }}>&#127760;</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        style={{
          background: 'var(--sidebar-bg)',
          color: 'var(--text-on-dark)',
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '4px 10px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--sidebar-border)',
          outline: 'none',
          cursor: 'pointer',
          transition: 'border var(--transition-fast)',
        }}
        title="Select Language"
      >
        {Object.values(SUPPORTED_LANGUAGES).map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
};
