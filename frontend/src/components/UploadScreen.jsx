import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, Database, Check, AlertCircle, RefreshCw, Table2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function UploadScreen({ isConnected, onUploadSuccess }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [tableName, setTableName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null); // { success: bool, message: str }

  const [activeTables, setActiveTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);

  // Fetch active tables list from backend
  const fetchTables = async () => {
    setLoadingTables(true);
    try {
      const response = await fetch(`${API_BASE}/api/tables`);
      if (response.ok) {
        const data = await response.json();
        setActiveTables(data.tables || []);
      }
    } catch (e) {
      print("Error fetching tables list:", e);
    } finally {
      setLoadingTables(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      // Auto fill table name
      const name = droppedFile.name.split('.')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
      setTableName(name);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const name = selectedFile.name.split('.')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
      setTableName(name);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadStatus(null);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('table_name', tableName);

    // Simulate progress updates for a smoother visual experience
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 200);

    try {
      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      const data = await response.json();
      setUploading(false);

      if (response.ok) {
        setUploadStatus({ success: true, message: data.message });
        setFile(null);
        setTableName('');
        fetchTables(); // Refresh tables list
        if (onUploadSuccess) onUploadSuccess();
      } else {
        setUploadStatus({ success: false, message: data.detail || "Upload failed." });
      }
    } catch (e) {
      clearInterval(progressInterval);
      setUploading(false);
      setUploadStatus({ success: false, message: `Upload error: ${e.message}` });
    }
  };

  return (
    <div style={{
      padding: '40px var(--space-3)',
      maxWidth: '850px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
      minHeight: '100vh',
      animation: 'fadeIn 0.4s ease-out'
    }}>
      
      {/* Title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700 }}>Upload Structured Data</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Upload your SQLite database (.db, .sqlite), CSV sheets, Excel files (.xlsx), or SQL dump schema files to import them directly into your database.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }} className="upload-grid">
        
        {/* Upload Card */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600 }}>File Uploader</h3>
          
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              height: '180px',
              border: dragOver ? '2px dashed var(--color-primary)' : '2px dashed var(--border-color)',
              background: dragOver ? 'rgba(37,99,235,0.05)' : 'rgba(0,0,0,0.1)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative'
            }}
          >
            <input
              type="file"
              onChange={handleFileSelect}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
              accept=".csv,.xlsx,.xls,.db,.sqlite,.sql"
            />
            
            <UploadCloud size={36} style={{ color: dragOver ? 'var(--color-primary)' : 'var(--text-secondary)' }} />
            <div style={{ textAlign: 'center', padding: '0 16px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600 }}>Drag & Drop file here</p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Supports SQLite (.db), CSV, Excel (.xlsx), or SQL Dump (.sql)
              </p>
            </div>
          </div>

          {/* Selected File Details */}
          {file && (
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              animation: 'fadeIn 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={18} style={{ color: 'var(--color-primary)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>

              {/* Table Name Input (For CSV/Excel) */}
              {file.name.match(/\.(csv|xlsx|xls)$/i) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)' }}>Destination Table Name</label>
                  <input
                    type="text"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                    placeholder="table_name"
                    className="input-field"
                    style={{ padding: '8px 12px', fontSize: '12px' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Upload Progress Loader */}
          {uploading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <span>Uploading and parsing file...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--gradient-primary)', borderRadius: '3px', transition: 'width 0.2s ease' }}></div>
              </div>
            </div>
          )}

          {/* Upload Result Alert */}
          {uploadStatus && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              background: uploadStatus.success ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)',
              border: uploadStatus.success ? '1px solid rgba(34, 197, 94, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)',
              color: uploadStatus.success ? 'var(--color-success)' : 'var(--color-error)'
            }}>
              {uploadStatus.success ? <Check size={16} /> : <AlertCircle size={16} />}
              <span style={{ lineHeight: 1.4 }}>{uploadStatus.message}</span>
            </div>
          )}

          {/* Action button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="btn btn-primary"
            style={{ width: '100%', borderRadius: '10px', height: '40px', marginTop: '4px' }}
          >
            {uploading ? 'Processing file...' : 'Import Data'}
          </button>
        </div>

        {/* Database Tables list */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Table2 size={18} style={{ color: 'var(--color-accent)' }} /> Active Tables
            </h3>
            <button onClick={fetchTables} disabled={loadingTables} className="btn btn-text" style={{ padding: '4px 8px', minWidth: 'unset' }}>
              <RefreshCw size={14} className={loadingTables ? "animate-spin" : ""} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '310px', overflowY: 'auto', paddingRight: '4px' }}>
            {loadingTables ? (
              /* Table skeleton loaders */
              [1, 2, 3].map(i => (
                <div key={i} style={{ height: '48px', borderRadius: '10px' }} className="shimmer-loader"></div>
              ))
            ) : activeTables.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '32px 16px',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                border: '1px dashed var(--border-color)',
                borderRadius: '12px'
              }}>
                No tables found in the connected database. Upload a CSV to get started!
              </div>
            ) : (
              activeTables.map((tbl, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(255,255,255,0.01)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Database size={16} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'monospace' }}>{tbl.name}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '12px' }}>
                    {tbl.rows} rows
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
