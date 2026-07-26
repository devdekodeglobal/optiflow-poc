import React, { useMemo, useState } from 'react';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';

const HIERARCHY = ['network', 'zone', 'region', 'store_category', 'store_name', 'brand_name', 'commodity'];

const HIERARCHY_LABELS = {
  network: 'All Zones',
  zone: 'Zone',
  region: 'Region',
  store_category: 'Store Grade',
  store_name: 'Store',
  brand_name: 'Brand',
  commodity: 'Commodity'
};

function TextEditor({ row, column, onRowChange, onClose }) {
  return (
    <input
      id={`editor-${column.key}`}
      name={`editor-${column.key}`}
      type={['facing', 'back_stock', 'soh'].includes(column.key) ? "number" : "text"}
      autoFocus
      style={{ width: '100%', height: '100%', padding: '0 8px', border: '2px solid var(--primary)', outline: 'none' }}
      value={row[column.key] || ''}
      onChange={(event) => {
        const val = ['facing', 'back_stock', 'soh'].includes(column.key) 
          ? Number(event.target.value) 
          : event.target.value;
        onRowChange({ ...row, [column.key]: val });
      }}
      onBlur={() => onClose(true)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onClose(true);
        }
      }}
    />
  );
}

export default function PlanogramDrillDown({ 
  filteredData, 
  filters, 
  setFilters,
  editedRows,
  setEditedRows,
  onAddRow
}) {
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [editingCard, setEditingCard] = useState(null); // { oldName: string, newName: string }
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ name: '', storeGrade: '', facing: 0, depth: 0 });

  // Determine current drill down level based on active filters
  const currentLevelIndex = useMemo(() => {
    let deepestActiveLevel = -1;
    
    if (filters.commodity && filters.commodity.length > 0) deepestActiveLevel = 6;
    else if (filters.brand_name && filters.brand_name.length > 0) deepestActiveLevel = 5;
    else if (filters.store_name && filters.store_name.length > 0) deepestActiveLevel = 4;
    else if (filters.store_category && filters.store_category.length > 0) deepestActiveLevel = 3;
    else if (filters.region && filters.region.length > 0) deepestActiveLevel = 2;
    else if (filters.zone && filters.zone.length > 0) deepestActiveLevel = 1;

    if (deepestActiveLevel === -1) return 0;

    const fieldName = HIERARCHY[deepestActiveLevel];
    const selection = filters[fieldName] || [];
    
    if (selection.length === 1) return deepestActiveLevel;
    return deepestActiveLevel - 1;
  }, [filters]);

  const nextLevelName = HIERARCHY[currentLevelIndex + 1];
  const nextLevelLabel = HIERARCHY_LABELS[nextLevelName];

  // Summarize current filtered data for the top KPI bar
  const summary = useMemo(() => {
    let facing = 0;
    let backStock = 0;
    let skus = 0;
    
    filteredData.forEach(i => {
      facing += parseInt(i.facing) || 0;
      backStock += parseInt(i.back_stock) || 0;
      skus += parseInt(i.sku_count) || 0;
    });

    return { facing, backStock, skus };
  }, [filteredData]);

  // Group data by next level to render cards
  const childrenData = useMemo(() => {
    if (!nextLevelName || currentLevelIndex === 5) return [];

    const grouped = {};
    filteredData.forEach(item => {
      let key = item[nextLevelName] || `Unknown ${nextLevelName}`;
      if (!grouped[key]) {
        grouped[key] = { items: [], displayName: key };
      }
      grouped[key].items.push(item);
    });

    return Object.entries(grouped).map(([key, groupObj]) => {
      const items = groupObj.items;
      let facing = 0;
      let backStock = 0;
      let skus = 0;

      items.forEach(i => {
        facing += parseInt(i.facing) || 0;
        backStock += parseInt(i.back_stock) || 0;
        skus += parseInt(i.sku_count) || 0;
      });

      return { name: key, displayName: groupObj.displayName, facing, backStock, skus, count: items.length, items };
    }).sort((a, b) => b.facing - a.facing);
  }, [filteredData, nextLevelName, currentLevelIndex]);

  const handleDrillDown = (childName) => {
    const newFilters = { ...filters };
    newFilters[nextLevelName] = [childName];
    setFilters(newFilters);
  };

  const handleBreadcrumbClick = (levelIndex) => {
    const newFilters = { ...filters };
    if (levelIndex < 6) newFilters.commodity = [];
    if (levelIndex < 5) newFilters.brand_name = [];
    if (levelIndex < 4) newFilters.store_name = [];
    if (levelIndex < 3) newFilters.store_category = [];
    if (levelIndex < 2) newFilters.region = [];
    if (levelIndex < 1) newFilters.zone = [];
    
    setFilters(newFilters);
  };

  const handleDeleteCard = (e, child) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete all planogram entries for ${child.displayName}?`)) {
      const newEditedRows = { ...editedRows };
      child.items.forEach(item => {
        newEditedRows[item._uid] = { ...item, _deleted: true };
      });
      setEditedRows(newEditedRows);
    }
  };

  const handleRenameCardSave = (e, child) => {
    e.stopPropagation();
    if (editingCard.newName === child.name || !editingCard.newName.trim()) {
      setEditingCard(null);
      return;
    }
    
    if (window.confirm(`Are you sure you want to rename "${child.name}" to "${editingCard.newName.trim()}"? This will update all underlying planogram entries.`)) {
      const newEditedRows = { ...editedRows };
      child.items.forEach(item => {
        const existingEdit = newEditedRows[item._uid] || { ...item };
        existingEdit[nextLevelName] = editingCard.newName.trim();
        newEditedRows[item._uid] = existingEdit;
      });
      setEditedRows(newEditedRows);
    }
    setEditingCard(null);
  };

  const handleAddNewCard = () => {
    setModalData({ name: '', storeGrade: '', facing: 0, depth: 0 });
    setIsAddModalOpen(true);
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (!modalData.name.trim()) return;

    // Construct a new default row based on active filters
    const newRow = {
      zone: filters.zone?.[0] || 'Unknown',
      region: filters.region?.[0] || 'Unknown',
      store_category: filters.store_category?.[0] || 'Unknown',
      store_name: filters.store_name?.[0] || 'Unknown',
      brand_name: filters.brand_name?.[0] || 'Unknown',
      commodity: filters.commodity?.[0] || 'Unknown',
      facing: 0,
      back_stock: 0,
      sku_count: 0
    };
    
    // Override the next level with the new name
    newRow[nextLevelName] = modalData.name.trim();

    // If Store level, apply grade
    if (nextLevelName === 'store_name' && modalData.storeGrade.trim()) {
      newRow.store_category = modalData.storeGrade.trim();
    }

    // If Commodity level, apply facing and depth
    if (nextLevelName === 'commodity') {
      newRow.facing = parseInt(modalData.facing) || 0;
      newRow.back_stock = parseInt(modalData.depth) || 0;
    }
    
    onAddRow(newRow);
    setIsAddModalOpen(false);
  };

  const handleDeleteLeaf = (uid) => {
    if (window.confirm("Delete this entry?")) {
      const originalRow = filteredData.find(r => r._uid === uid);
      setEditedRows(prev => ({
        ...prev,
        [uid]: { ...originalRow, _deleted: true }
      }));
    }
  };

  const handleEditChange = (uid, field, value) => {
    const originalRow = filteredData.find(r => r._uid === uid);
    if (!originalRow) return;
    
    const existingEdit = editedRows[uid] || { ...originalRow };
    existingEdit[field] = value;
    
    setEditedRows(prev => ({ ...prev, [uid]: existingEdit }));
  };

  const renderKPIBar = () => {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card animate-in" style={{ padding: '16px 20px', background: '#fff', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, marginBottom: 4 }}>TARGET</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{(summary.facing + summary.backStock).toLocaleString()}</div>
        </div>
        <div className="card animate-in" style={{ padding: '16px 20px', background: '#fff', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, marginBottom: 4 }}>FACING</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--info)' }}>{summary.facing.toLocaleString()}</div>
        </div>
        <div className="card animate-in" style={{ padding: '16px 20px', background: '#fff', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, marginBottom: 4 }}>DEPTH</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--warning)' }}>{summary.backStock.toLocaleString()}</div>
        </div>
      </div>
    );
  };

  const renderBreadcrumbs = () => {
    const crumbs = [];
    crumbs.push(
      <span key="network" style={{ cursor: 'pointer', color: currentLevelIndex === 0 ? 'var(--text-primary)' : 'var(--brand-primary)', fontWeight: currentLevelIndex === 0 ? 700 : 500 }} onClick={() => handleBreadcrumbClick(0)}>
        All Zones
      </span>
    );

    const addCrumb = (key, arr, name, lvl) => {
      if (arr && arr.length > 0) {
        crumbs.push(<span key={`sep${lvl}`} style={{ margin: '0 8px', color: 'var(--text-secondary)' }}>/</span>);
        crumbs.push(
          <span key={key} style={{ cursor: 'pointer', color: currentLevelIndex === lvl ? 'var(--text-primary)' : 'var(--brand-primary)', fontWeight: currentLevelIndex === lvl ? 700 : 500 }} onClick={() => handleBreadcrumbClick(lvl)}>
            {arr.length === 1 ? (lvl === 3 ? `Grade ${arr[0]}` : arr[0]) : `Multiple ${name} (${arr.length})`}
          </span>
        );
      }
    };

    addCrumb('zone', filters.zone, 'Zones', 1);
    addCrumb('region', filters.region, 'Regions', 2);
    addCrumb('grade', filters.store_category, 'Grades', 3);
    addCrumb('store', filters.store_name, 'Stores', 4);
    addCrumb('brand', filters.brand_name, 'Brands', 5);
    addCrumb('commodity', filters.commodity, 'Commodities', 6);

    return (
      <div style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
        {crumbs}
      </div>
    );
  };

  const renderCards = () => {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Select {nextLevelLabel}</h3>
          <button 
            onClick={handleAddNewCard} 
            style={{
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              padding: '8px 20px',
              borderRadius: 24,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-dark)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            + Add New {nextLevelLabel}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {childrenData.map((child, idx) => {
            const isEditing = editingCard?.oldName === child.name;
            
            return (
              <div 
                key={idx} 
                className="card animate-in" 
                style={{ padding: 20, cursor: isEditing ? 'default' : 'pointer', transition: 'all 0.2s', background: '#fff', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)', borderRadius: 'var(--radius-lg)' }}
                onClick={() => { if (!isEditing) handleDrillDown(child.name); }}
                onMouseEnter={(e) => {
                  if (isEditing) return;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = 'var(--primary-light)';
                }}
                onMouseLeave={(e) => {
                  if (isEditing) return;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  {isEditing ? (
                    <input 
                      id={`rename_card_${String(child.name).replace(/[^a-zA-Z0-9]/g, '_')}`}
                      autoFocus
                      type="text" 
                      name={`rename_${child.name}`}
                      className="input" 
                      value={editingCard.newName}
                      onClick={e => e.stopPropagation()}
                      onChange={e => setEditingCard({ ...editingCard, newName: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter') handleRenameCardSave(e, child); if(e.key === 'Escape') setEditingCard(null); }}
                      onBlur={e => handleRenameCardSave(e, child)}
                      style={{ fontSize: 16, fontWeight: 700, padding: '4px 8px' }}
                    />
                  ) : (
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{child.displayName}</h4>
                  )}
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!isEditing && (nextLevelName === 'store_name' || nextLevelName === 'brand_name') && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); setEditingCard({ oldName: child.name, newName: child.name }); }} className="btn-icon" title="Rename">
                          ✎
                        </button>
                        <button onClick={(e) => handleDeleteCard(e, child)} className="btn-icon" style={{ color: 'var(--error)' }} title="Delete">
                          ×
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Target</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{(child.facing + child.backStock).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Facing</span>
                    <span style={{ fontWeight: 700, color: 'var(--info)' }}>{child.facing.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Depth</span>
                    <span style={{ fontWeight: 700, color: 'var(--warning)' }}>{child.backStock.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const renderLeafNodes = () => {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Commodities</h3>
          <button 
            onClick={handleAddNewCard} 
            style={{
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              padding: '8px 20px',
              borderRadius: 24,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-dark)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            + Add New Commodity
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {filteredData.map((item, idx) => {
            return (
              <div key={item._uid || idx} className="card animate-in" style={{ padding: 24, background: '#fff', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)', borderRadius: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, borderBottom: '1px solid var(--glass-border)', paddingBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{item.brand_name} <span style={{ color: 'var(--text-tertiary)' }}>-</span> {item.commodity}</h3>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ background: 'var(--bg-inset)', padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Store Type: <span style={{ color: 'var(--text-primary)' }}>{item.store_type || 'N/A'}</span></span>
                      <span style={{ background: 'var(--bg-inset)', padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Brand Type: <span style={{ color: 'var(--text-primary)' }}>{item.brand_type || 'N/A'}</span></span>
                      <span style={{ background: 'var(--bg-inset)', padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Category: <span style={{ color: 'var(--text-primary)' }}>{item.brand_category || 'N/A'}</span></span>
                      <span style={{ background: 'var(--bg-inset)', padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Supplier: <span style={{ color: 'var(--text-primary)' }}>{item.supplier_name || 'N/A'}</span></span>
                      <span style={{ background: 'var(--bg-inset)', padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Code: <span style={{ color: 'var(--text-primary)' }}>{item.brand_code || 'N/A'}</span></span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteLeaf(item._uid)} 
                    style={{ 
                      color: 'var(--error)', 
                      background: 'rgba(231,76,60,0.1)', 
                      border: 'none', 
                      padding: '8px 16px', 
                      borderRadius: 10, 
                      fontSize: 13, 
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(231,76,60,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(231,76,60,0.1)'}
                  >
                    Delete
                  </button>
                </div>
                
                <div style={{ display: 'flex', gap: 24 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Facing (Display)</label>
                    <input 
                      id={`facing_${item._uid}`}
                      type="number" 
                      name={`facing_${item._uid}`}
                      value={item.facing !== null ? item.facing : ''} 
                      onChange={(e) => handleEditChange(item._uid, 'facing', e.target.value)}
                      style={{ 
                        width: '100%', 
                        fontSize: 22, 
                        fontWeight: 800, 
                        padding: '14px 20px', 
                        borderRadius: 12, 
                        border: '2px solid var(--glass-border)', 
                        background: 'var(--bg-inset)', 
                        color: 'var(--info)', 
                        transition: 'all 0.2s', 
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = 'var(--gold)'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 4px rgba(241,196,15,0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.background = 'var(--bg-inset)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Depth (Reserve)</label>
                    <input 
                      id={`depth_${item._uid}`}
                      type="number" 
                      name={`depth_${item._uid}`}
                      value={item.back_stock !== null ? item.back_stock : ''} 
                      onChange={(e) => handleEditChange(item._uid, 'back_stock', e.target.value)}
                      style={{ 
                        width: '100%', 
                        fontSize: 22, 
                        fontWeight: 800, 
                        padding: '14px 20px', 
                        borderRadius: 12, 
                        border: '2px solid var(--glass-border)', 
                        background: 'var(--bg-inset)', 
                        color: 'var(--warning)', 
                        transition: 'all 0.2s', 
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = 'var(--gold)'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 4px rgba(241,196,15,0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.background = 'var(--bg-inset)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const renderTableView = () => {
    if (currentLevelIndex < 5) {
      const columns = [
        { 
          key: 'name', 
          name: nextLevelLabel ? nextLevelLabel.toUpperCase() : 'NAME', 
          resizable: true,
          renderCell: (p) => (
            <span 
              style={{ 
                color: 'var(--primary)', 
                cursor: 'pointer',
                textDecoration: 'underline',
                fontWeight: 600
              }}
              onClick={() => handleDrillDown(p.row.id)}
            >
              {p.row.name}
            </span>
          )
        },
        { key: 'totalTarget', name: 'TARGET', resizable: true },
        { key: 'facing', name: 'FACING', resizable: true },
        { key: 'backStock', name: 'DEPTH', resizable: true },
      ];

      const rows = childrenData.map(child => ({
        id: child.name,
        name: child.displayName || child.name,
        totalTarget: (child.facing + child.backStock).toLocaleString(),
        facing: child.facing.toLocaleString(),
        backStock: child.backStock.toLocaleString(),
      }));

      return (
        <div className="animate-in" style={{ height: 'auto' }}>
          <DataGrid
            key={currentLevelIndex}
            columns={columns}
            rows={rows}
            rowKeyGetter={(row) => row.id}
            className="rdg-light"
            style={{ height: 'auto' }}
            rowHeight={52}
            headerRowHeight={48}
            onRowClick={(row) => handleDrillDown(row.id)}
          />
        </div>
      );
    }

    // Leaf node table view
    const columns = [
      { key: 'zone', name: 'Zone', width: 120, resizable: true, renderEditCell: TextEditor },
      { key: 'region', name: 'Region', width: 150, resizable: true, renderEditCell: TextEditor },
      { key: 'store_name', name: 'Store Name', width: 220, resizable: true, renderEditCell: TextEditor },
      { key: 'store_category', name: 'Grade', width: 80, resizable: true, renderEditCell: TextEditor },
      { key: 'brand_name', name: 'Brand Name', width: 150, resizable: true, renderEditCell: TextEditor },
      { key: 'commodity', name: 'Commodity', width: 130, resizable: true, renderEditCell: TextEditor },
      { key: 'facing', name: 'Facing (Display)', width: 120, resizable: true, renderEditCell: TextEditor },
      { key: 'back_stock', name: 'Depth', width: 100, resizable: true, renderEditCell: TextEditor },
    ];

    const handleRowsChange = (newRows, { indexes }) => {
      const changes = {};
      for (const index of indexes) {
        const row = newRows[index];
        changes[row._uid] = row;
      }
      setEditedRows(prev => ({ ...prev, ...changes }));
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Raw Data View</h3>
          <button 
            onClick={() => onAddRow({ facing: 0, back_stock: 0 })} 
            style={{
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              padding: '8px 20px',
              borderRadius: 24,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-dark)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            + Add Empty Row
          </button>
        </div>
        <div style={{ flex: 1, backgroundColor: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <DataGrid
            key={currentLevelIndex}
            columns={columns}
            rows={filteredData}
            onRowsChange={handleRowsChange}
            className="rdg-light"
            style={{ height: '100%' }}
          />
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>
      <div style={{ padding: '24px 32px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          {renderBreadcrumbs()}
          <div style={{ display: 'flex', background: '#ebe9f0', borderRadius: 8, padding: 4, border: '1px solid var(--border)' }}>
            <button 
              onClick={() => setViewMode('cards')} 
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                background: viewMode === 'cards' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'cards' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Cards
            </button>
            <button 
              onClick={() => setViewMode('table')} 
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                background: viewMode === 'table' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'table' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Table
            </button>
          </div>
        </div>
        {renderKPIBar()}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', padding: '0 32px 32px' }}>
        {viewMode === 'table' ? renderTableView() : (currentLevelIndex < 5 ? renderCards() : renderLeafNodes())}
      </div>

      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="card animate-in" style={{ width: 400, background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Add New {nextLevelLabel}</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
            </div>
            
            <form onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>{nextLevelLabel} Name</label>
                <input 
                  id="modalItemName"
                  name="modalItemName"
                  type="text"
                  autoFocus
                  required
                  value={modalData.name}
                  onChange={(e) => setModalData({...modalData, name: e.target.value})}
                  style={{ width: '100%', fontSize: 16, padding: '12px 16px', borderRadius: 10, border: '2px solid var(--glass-border)', outline: 'none' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                />
              </div>

              {nextLevelName === 'store_name' && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>Store Grade</label>
                  <input 
                    id="modalStoreGrade"
                    name="modalStoreGrade"
                    type="text"
                    value={modalData.storeGrade}
                    onChange={(e) => setModalData({...modalData, storeGrade: e.target.value})}
                    placeholder="e.g. A, B, SIS"
                    style={{ width: '100%', fontSize: 16, padding: '12px 16px', borderRadius: 10, border: '2px solid var(--glass-border)', outline: 'none' }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                  />
                </div>
              )}

              {nextLevelName === 'commodity' && (
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>Facing (Display)</label>
                    <input 
                      id="modalFacing"
                      name="modalFacing"
                      type="number"
                      required
                      value={modalData.facing}
                      onChange={(e) => setModalData({...modalData, facing: e.target.value})}
                      style={{ width: '100%', fontSize: 16, padding: '12px 16px', borderRadius: 10, border: '2px solid var(--glass-border)', outline: 'none' }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>Depth (Reserve)</label>
                    <input 
                      id="modalDepth"
                      name="modalDepth"
                      type="number"
                      required
                      value={modalData.depth}
                      onChange={(e) => setModalData({...modalData, depth: e.target.value})}
                      style={{ width: '100%', fontSize: 16, padding: '12px 16px', borderRadius: 10, border: '2px solid var(--glass-border)', outline: 'none' }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Save {nextLevelLabel}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
