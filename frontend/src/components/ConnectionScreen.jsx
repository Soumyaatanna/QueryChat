import React, { useState } from 'react';
import { Database, Server, Lock, Globe, Check, AlertCircle, RefreshCw } from 'lucide-react';

const DB_TYPES = [
  { id: 'sqlite', name: 'SQLite', desc: 'Local SQL database file', icon: <Database size={24} /> },
  { id: 'mysql', name: 'MySQL', desc: 'Popular open-source SQL DB', icon: <Server size={24} /> },
  { id: 'postgres', name: 'PostgreSQL', desc: 'Powerful enterprise object-relational', icon: <Globe size={24} />, disabled: true },
  { id: 'sqlserver', name: 'SQL Server', desc: 'Microsoft relational database', icon: <Server size={24} />, disabled: true },
  { id: 'oracle', name: 'Oracle', desc: 'Enterprise relational database', icon: <Lock size={24} />, disabled: true },
];

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function ConnectionScreen({ currentStatus, onConnectionSuccess }) {
  const [selectedType, setSelectedType] = useState('mysql');
  const [formData, setFormData] = useState({
    host: '127.0.0.1',
    port: '3306',
    username: 'root',
    password: '',
    database: '',
    sqlite_path: 'querychat_demo.db'
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: bool, message: str }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleConnect = async (isTestOnly = false) => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch(`${API_BASE}/api/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          db_type: selectedType,
          host: formData.host,
          port: parseInt(formData.port),
          username: formData.username,
          password: formData.password,
          database: formData.database,
          sqlite_path: formData.sqlite_path
        })
      });

      const data = await response.json();
      setTesting(false);

      if (response.ok) {
        setTestResult({ success: true, message: isTestOnly ? "Connection test successful!" : "Database connected successfully!" });
        if (!isTestOnly && onConnectionSuccess) {
          onConnectionSuccess({
            db_type: selectedType,
            db_name: selectedType === 'mysql' ? formData.database : formData.sqlite_path
          });
        }
      } else {
        setTestResult({ success: false, message: data.detail || "Failed to establish connection." });
      }
    } catch (e) {
      setTesting(false);
      setTestResult({ success: false, message: `Network error: ${e.message}` });
    }
  };

  return (
    <div style={{
      padding: '40px var(--space-3)',
      maxWidth: '900px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
      height: '100%',
      overflowY: 'auto',
      animation: 'fadeIn 0.4s ease-out'
    }}>
      
      {/* Title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700 }}>Connect a Database</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Select your database type and fill in the connection details below. If you want to use SQLite, you can connect the auto-seeded demo file.
        </p>
      </div>

      {/* Grid of Database Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {DB_TYPES.map((db) => {
          const isSelected = selectedType === db.id;
          return (
            <div
              key={db.id}
              onClick={() => !db.disabled && setSelectedType(db.id)}
              style={{
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-card)',
                border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                cursor: db.disabled ? 'not-allowed' : 'pointer',
                opacity: db.disabled ? 0.4 : 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative',
                transition: 'all 0.2s'
              }}
              className={!db.disabled ? "db-type-card" : ""}
            >
              <div style={{
                color: isSelected ? 'var(--color-primary)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {db.icon}
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '16px' }}>{db.name}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {db.desc}
              </p>
              {db.disabled && (
                <span style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  fontSize: '9px',
                  background: 'rgba(255,255,255,0.05)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  color: 'var(--text-secondary)'
                }}>Coming Soon</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Connection Form */}
      <div className="glass-panel" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', fontSize: '18px', fontWeight: 600 }}>
          {selectedType === 'sqlite' ? 'SQLite Database Credentials' : 'MySQL Database Credentials'}
        </h3>
        
        {selectedType === 'sqlite' ? (
          /* SQLite filepath field */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>SQLite Database Filepath</label>
            <input
              type="text"
              name="sqlite_path"
              value={formData.sqlite_path}
              onChange={handleInputChange}
              className="input-field"
              placeholder="e.g. querychat_demo.db"
            />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Note: To use the pre-loaded CSV dataset (regions, products, customers), keep the path as `querychat_demo.db`.
            </span>
          </div>
        ) : (
          /* MySQL server fields */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }} className="form-grid-2col">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Host Server</label>
              <input
                type="text"
                name="host"
                value={formData.host}
                onChange={handleInputChange}
                className="input-field"
                placeholder="e.g. localhost or 127.0.0.1"
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Port Number</label>
              <input
                type="text"
                name="port"
                value={formData.port}
                onChange={handleInputChange}
                className="input-field"
                placeholder="e.g. 3306"
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="input-field"
                placeholder="e.g. root"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Enter password..."
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Database Name</label>
              <input
                type="text"
                name="database"
                value={formData.database}
                onChange={handleInputChange}
                className="input-field"
                placeholder="e.g. restro"
              />
            </div>
          </div>
        )}

        {/* Test results banner */}
        {testResult && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            background: testResult.success ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)',
            border: testResult.success ? '1px solid rgba(34, 197, 94, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)',
            color: testResult.success ? 'var(--color-success)' : 'var(--color-error)'
          }}>
            {testResult.success ? <Check size={16} /> : <AlertCircle size={16} />}
            <span style={{ lineHeight: 1.4 }}>{testResult.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
          <button
            onClick={() => handleConnect(true)}
            disabled={testing}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {testing && <RefreshCw size={14} className="animate-spin" />}
            <span>Test Connection</span>
          </button>
          
          <button
            onClick={() => handleConnect(false)}
            disabled={testing}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}
          >
            {testing && <RefreshCw size={14} className="animate-spin" />}
            <span>Connect DB</span>
          </button>
        </div>

      </div>

    </div>
  );
}
