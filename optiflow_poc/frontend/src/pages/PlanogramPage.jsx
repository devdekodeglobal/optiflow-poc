import React, { useState, useEffect, useMemo, useContext } from 'react';
import { getPlanogramData, updatePlanogramData, getPlanogramVersions, restorePlanogramVersion } from '../api';
import { useLocation, useNavigate } from 'react-router-dom';
import PlanogramDrillDown from '../components/PlanogramDrillDown';
import { DataContext } from '../DataContext';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function PlanogramPage() {
  const navigate = useNavigate();
  const { planogramFilters: filters, setPlanogramFilters: setFilters } = useContext(DataContext);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [editedRows, setEditedRows] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Version History State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [restoringId, setRestoringId] = useState(null);

  const fetchPlanogram = async () => {
    setLoading(true);
    try {
      const data = await getPlanogramData({
        page: 1,
        page_size: 5000 // Fetch all for client-side filtering
      });
      setRows(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanogram();
  }, []);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSave = async () => {
    const updates = Object.values(editedRows);
    if (updates.length === 0) return;
    setIsSaving(true);
    try {
      await updatePlanogramData(updates);
      setEditedRows({});
      await fetchPlanogram();
    } catch (err) {
      alert("Failed to save planogram edits: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenHistory = async () => {
    setIsHistoryOpen(true);
    setLoadingVersions(true);
    try {
      const res = await getPlanogramVersions();
      setVersions(res.versions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleRestore = async (v) => {
    const timeFormatted = new Date(v.timestamp).toLocaleString();
    if (!window.confirm(`Are you sure you want to restore the planogram backup from ${timeFormatted}? Current unsaved edits will be replaced.`)) {
      return;
    }

    setRestoringId(v.version_id);
    try {
      await restorePlanogramVersion(v.version_id);
      setEditedRows({});
      setIsHistoryOpen(false);
      await fetchPlanogram();
      alert(`Successfully restored planogram snapshot from ${timeFormatted}!`);
    } catch (err) {
      alert("Failed to restore planogram version: " + err.message);
    } finally {
      setRestoringId(null);
    }
  };

  const handleAddRow = (newRow) => {
    const uid = -Date.now() - Math.floor(Math.random() * 1000);
    const rowWithUid = { ...newRow, _uid: uid };
    setRows(prev => [...prev, rowWithUid]);
    setEditedRows(prev => ({ ...prev, [uid]: rowWithUid }));
  };

  const hasEdits = Object.keys(editedRows).length > 0;

  // Client side filtering since we fetched a large batch
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      const edited = editedRows[row._uid];
      if (edited?._deleted) return false;
      
      const checkRow = edited || row;
      
      if (filters.zone.length > 0 && !filters.zone.includes(checkRow.zone)) return false;
      if (filters.region.length > 0 && !filters.region.includes(checkRow.region)) return false;
      if (filters.store_category.length > 0 && !filters.store_category.includes(checkRow.store_category)) return false;
      if (filters.store_name.length > 0 && !filters.store_name.includes(checkRow.store_name)) return false;
      if (filters.brand_name.length > 0 && !filters.brand_name.includes(checkRow.brand_name)) return false;
      if (filters.commodity.length > 0 && !filters.commodity.includes(checkRow.commodity)) return false;
      return true;
    });
  }, [rows, filters, editedRows]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, color: 'var(--text-color)' }}>Planogram Editor</h1>
        </div>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button 
            type="button"
            onClick={handleOpenHistory}
            className="btn btn-secondary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6, 
              padding: '8px 16px', 
              borderRadius: 8, 
              fontSize: 13, 
              fontWeight: 600,
              background: '#fff',
              border: '1px solid var(--glass-border)'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            History & Backups
          </button>

          {hasEdits && (
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="btn btn-primary"
              style={{ padding: '8px 16px', borderRadius: 8, fontWeight: 600 }}
            >
              {isSaving ? 'Saving...' : `Save Changes (${Object.keys(editedRows).length})`}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, backgroundColor: 'var(--bg-primary)' }}>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {loading && rows.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <div className="spinner"></div>
            </div>
          ) : (
            <PlanogramDrillDown 
              filteredData={filteredRows}
              filters={filters}
              setFilters={handleFiltersChange}
              editedRows={editedRows}
              setEditedRows={setEditedRows}
              onAddRow={handleAddRow}
            />
          )}
        </div>
      </div>

      {/* Version History Modal */}
      {isHistoryOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
          <div className="card animate-in" style={{ width: 560, maxHeight: '80vh', background: '#fff', borderRadius: 16, padding: 28, display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Planogram Backups & History</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Automatic version snapshots saved on every edit</div>
                </div>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loadingVersions ? (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Loading version history...</div>
                </div>
              ) : versions.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  No backup versions found yet. Make edits to create your first version snapshot!
                </div>
              ) : (
                versions.map((v, idx) => {
                  const isCurrentRestoring = restoringId === v.version_id;
                  const dateObj = new Date(v.timestamp);

                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        justify: 'space-between', 
                        alignItems: 'center', 
                        padding: '14px 18px', 
                        borderRadius: 12, 
                        border: '1px solid var(--glass-border)', 
                        background: idx === 0 ? 'rgba(99, 102, 241, 0.03)' : '#fafafa',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {idx === 0 && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'var(--primary)', color: '#fff' }}>
                              ACTIVE VERSION
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {v.description || 'Saved snapshot'} · <strong style={{ color: 'var(--text-primary)' }}>{v.total_entries?.toLocaleString()}</strong> total entries
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRestore(v)}
                        disabled={isCurrentRestoring || idx === 0}
                        className="btn btn-secondary"
                        style={{
                          padding: '6px 14px',
                          fontSize: 12,
                          fontWeight: 600,
                          borderRadius: 6,
                          opacity: idx === 0 ? 0.5 : 1,
                          cursor: idx === 0 ? 'default' : 'pointer'
                        }}
                      >
                        {isCurrentRestoring ? 'Restoring...' : idx === 0 ? 'Current' : 'Restore ↩️'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setIsHistoryOpen(false)} 
                className="btn btn-secondary" 
                style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TextEditor({ row, column, onRowChange, onClose }) {
  return (
    <input
      type="text"
      autoFocus
      style={{ width: '100%', height: '100%', padding: '0 8px', border: '1px solid var(--primary-color)', outline: 'none' }}
      value={row[column.key] || ''}
      onChange={(e) => onRowChange({ ...row, [column.key]: e.target.value })}
      onBlur={() => onClose(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onClose(true);
        }
      }}
    />
  );
}
