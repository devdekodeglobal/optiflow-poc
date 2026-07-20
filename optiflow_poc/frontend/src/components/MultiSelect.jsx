import React, { useState, useRef, useEffect } from 'react';

export default function MultiSelect({ options, value = [], onChange, placeholder = "Select..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  const selectedValues = Array.isArray(value) ? value : [];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    let newValues;
    if (selectedValues.includes(option)) {
      newValues = selectedValues.filter(v => v !== option);
    } else {
      newValues = [...selectedValues, option];
    }
    onChange(newValues);
  };

  return (
    <div className="multi-select" ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        className="filter-select"
        style={{ 
          width: '100%', padding: '10px', borderRadius: 6, fontSize: 14, 
          background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selectedValues.length ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {selectedValues.length === 0 ? placeholder : selectedValues.join(', ')}
        </div>
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 9999,
          maxHeight: 250, overflowY: 'auto'
        }}>
          {options.map((opt, i) => (
            <div 
              key={i} 
              className="hover-row"
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}
              onClick={() => toggleOption(opt)}
            >
              <input type="checkbox" checked={selectedValues.includes(opt)} readOnly style={{ cursor: 'pointer' }} />
              <span>{opt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
