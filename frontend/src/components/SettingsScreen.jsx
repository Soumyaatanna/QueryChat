import React, { useState } from 'react';
import { Settings, Shield, Sliders, Bell, Eye, EyeOff, Save, Check } from 'lucide-react';

export default function SettingsScreen({ initialApiKey, onSaveSettings }) {
  const [apiKey, setApiKey] = useState(initialApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [dialect, setDialect] = useState('mysql');
  const [llmProvider, setLlmProvider] = useState('gemini');
  const [language, setLanguage] = useState('en');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    if (onSaveSettings) {
      onSaveSettings({ apiKey, dialect, llmProvider });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{
      padding: '40px var(--space-3)',
      maxWidth: '750px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
      minHeight: '100vh',
      animation: 'fadeIn 0.4s ease-out'
    }}>
      
      {/* Title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700 }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Configure API credentials, choose LLM engines, set SQL dialects, and manage global layout configurations.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* API Credentials */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} style={{ color: 'var(--color-primary)' }} /> API Keys & Credentials
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Provide your Google Gemini API Key to enable Text-to-SQL query compilation and result summarization.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Google Gemini API Key</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="input-field"
                placeholder="Enter Gemini API Key..."
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Your API Key is kept in LocalStorage. It never exits safe system server lines except to query Google Gemini.
            </span>
          </div>
        </div>

        {/* Engine Configurations */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} style={{ color: 'var(--color-accent)' }} /> Query Configurations
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="form-grid-2col">
            
            {/* SQL Dialect */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>SQL Dialect Target</label>
              <select
                value={dialect}
                onChange={(e) => setDialect(e.target.value)}
                className="input-field"
                style={{ background: '#0b1220' }}
              >
                <option value="mysql">MySQL</option>
                <option value="sqlite">SQLite</option>
                <option value="postgres">PostgreSQL</option>
                <option value="sqlserver">Microsoft SQL Server</option>
              </select>
            </div>

            {/* LLM Engine */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>LLM Engine Provider</label>
              <select
                value={llmProvider}
                onChange={(e) => setLlmProvider(e.target.value)}
                className="input-field"
                style={{ background: '#0b1220' }}
              >
                <option value="gemini">Google Gemini (gemini-2.0-flash)</option>
                <option value="groq">Groq Cloud (gemma2-9b)</option>
                <option value="mock">Simulate LLM (Rule-based Fallback)</option>
              </select>
            </div>

            {/* Language */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Response Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input-field"
                style={{ background: '#0b1220' }}
              >
                <option value="en">English (default)</option>
                <option value="es">Español (Spanish)</option>
                <option value="fr">Français (French)</option>
                <option value="de">Deutsch (German)</option>
              </select>
            </div>

          </div>
        </div>

        {/* Notifications */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} style={{ color: '#F59E0B' }} /> Alert Notifications
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Notify on DB errors</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Triggers alerts when executed queries fail on databases.</span>
              </div>
              <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Notify on API Rate limits</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Triggers warnings when Gemini rate-limits are reached.</span>
              </div>
              <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px' }} />
            </div>
          </div>
        </div>

        {/* Save button banner */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '130px' }}
          >
            {saved ? <Check size={16} /> : <Save size={16} />}
            <span>{saved ? 'Saved Settings' : 'Save Changes'}</span>
          </button>
        </div>

      </div>

    </div>
  );
}
