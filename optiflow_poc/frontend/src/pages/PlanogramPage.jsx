import React, { useState, useEffect, useMemo, useContext } from 'react';
import { getPlanogramData, updatePlanogramData } from '../api';
import { useLocation, useNavigate } from 'react-router-dom';
import PlanogramDrillDown from '../components/PlanogramDrillDown';
import { DataContext } from '../DataContext';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function PlanogramPage() {
  const navigate = useNavigate();
  const { filters, setFilters } = useContext(DataContext);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  
  const [editedRows, setEditedRows] = useState({});
  const [isSaving, setIsSaving] = useState(false);

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
        {hasEdits && (
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="btn btn-primary"
            style={{ padding: '8px 16px', borderRadius: '4px', fontWeight: 600 }}
          >
            {isSaving ? 'Saving...' : `Save Changes (${Object.keys(editedRows).length})`}
          </button>
        )}
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
