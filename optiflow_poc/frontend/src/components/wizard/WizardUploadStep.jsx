import { useState, useRef, useCallback } from 'react';
import { uploadFile } from '../../api';

const UPLOAD_CONFIGS = [
  {
    key: 'sales',
    title: 'Sales Data',
    endpoint: '/api/upload/sales',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
  },
  {
    key: 'stock',
    title: 'Stock Data',
    endpoint: '/api/upload/stock',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
];

export default function WizardUploadStep({ onComplete }) {
  const fileInputRefs = useRef({});
  const [uploads, setUploads] = useState({});
  const [uploading, setUploading] = useState({});
  const [error, setError] = useState(null);

  const handleUpload = useCallback(async (config, file) => {
    setUploading(prev => ({ ...prev, [config.key]: true }));
    setError(null);
    try {
      const result = await uploadFile(config.endpoint, file);
      setUploads(prev => ({ ...prev, [config.key]: result }));
    } catch (err) {
      setError(`Failed to upload ${config.title}: ${err.message}`);
    } finally {
      setUploading(prev => ({ ...prev, [config.key]: false }));
    }
  }, []);

  const handleFileSelect = useCallback((e, config) => {
    const file = e.target.files[0];
    if (file) handleUpload(config, file);
  }, [handleUpload]);

  const allUploaded = uploads.stock && uploads.sales;

  return (
    <div className="animate-in">
      {error && (
        <div className="card" style={{
          marginBottom: 20,
          borderColor: 'var(--danger)',
          background: 'var(--danger-bg)',
          padding: '14px 20px'
        }}>
          <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: 13 }}>{error}</span>
        </div>
      )}

      <div className="upload-grid">
        {UPLOAD_CONFIGS.map((config) => {
          const isUploaded = !!uploads[config.key];
          const isUploading = !!uploading[config.key];

          return (
            <div
              key={config.key}
              className={`upload-zone animate-in ${isUploaded ? 'uploaded' : ''}`}
              onClick={() => fileInputRefs.current[config.key]?.click()}
            >
              <input
                id={`fileUpload_${config.key}`}
                name={`fileUpload_${config.key}`}
                type="file"
                accept=".csv"
                ref={(el) => (fileInputRefs.current[config.key] = el)}
                onChange={(e) => handleFileSelect(e, config)}
              />

              <div className="icon">{config.icon}</div>
              <h3 style={{ marginBottom: 0 }}>{config.title}</h3>

              {isUploading && (
                <div className="stats" style={{ color: 'var(--gold)' }}>
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2, margin: '8px auto 0' }}></div>
                </div>
              )}

              {isUploaded && !isUploading && (
                <div className="stats">
                  ✓ {uploads[config.key].rows?.toLocaleString() || uploads[config.key].total_rows?.toLocaleString()} rows loaded
                  {uploads[config.key].stores && ` · ${uploads[config.key].stores} stores`}
                  {uploads[config.key].warehouse_skus && ` · ${uploads[config.key].warehouse_skus} WH SKUs`}
                  {uploads[config.key].warehouse_total_units && ` · ${uploads[config.key].warehouse_total_units.toLocaleString()} units`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card animate-in" style={{ textAlign: 'center', padding: '32px' }}>
        <h3 style={{ marginBottom: 24, fontSize: 18 }}>Ready to set priority?</h3>
        <button 
          className="btn btn-primary" 
          style={{ 
            width: '100%', maxWidth: 350, margin: '0 auto', 
            padding: '14px 24px', fontSize: 16, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
          }}
          disabled={!allUploaded}
          onClick={onComplete}
        >
          Next: Set Priority <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      </div>
    </div>
  );
}
