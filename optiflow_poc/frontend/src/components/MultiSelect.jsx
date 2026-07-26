import React, { useState, useRef, useEffect } from 'react';

export default function MultiSelect({ options, value = [], onChange, placeholder = "Select..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  
  const selectedValues = Array.isArray(value) ? value : [];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
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
      <style>{`
        .filter-input-search::placeholder {
          color: rgba(255, 255, 255, 0.9) !important;
          opacity: 1 !important;
        }
      `}</style>
      <div 
        className="filter-select"
        style={{ 
          width: '100%', padding: '8px 12px', borderRadius: 6, fontSize: 13, fontWeight: 500,
          background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', cursor: 'text',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          transition: 'background 0.2s'
        }}
        onClick={() => setIsOpen(true)}
        onMouseOver={e => e.currentTarget.style.background='rgba(255, 255, 255, 0.15)'}
        onMouseOut={e => e.currentTarget.style.background='rgba(255, 255, 255, 0.1)'}
      >
        <input 
          id={`multiselect-${placeholder ? placeholder.replace(/\s+/g, '-').toLowerCase() : 'search'}`}
          name={`multiselect-${placeholder ? placeholder.replace(/\s+/g, '-').toLowerCase() : 'search'}`}
          type="text"
          className="filter-input-search"
          value={isOpen ? searchTerm : (selectedValues.length ? selectedValues.join(', ') : '')}
          placeholder={selectedValues.length && isOpen ? selectedValues.join(', ') : placeholder}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          style={{
            width: '100%', border: 'none', background: 'transparent', outline: 'none',
            color: selectedValues.length || isOpen ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
            fontWeight: 600, fontSize: 13, textOverflow: 'ellipsis'
          }}
        />
        <svg width="16" height="16" fill="none" stroke="rgba(255, 255, 255, 0.85)" viewBox="0 0 24 24" onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); setSearchTerm(''); }} style={{ cursor: 'pointer', flexShrink: 0, marginLeft: 8 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: 'var(--primary-dark)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 9999,
          display: 'flex', flexDirection: 'column',
          maxHeight: 250, padding: '4px 0'
        }}>
          <div style={{ overflowY: 'auto' }}>
            {options.filter(opt => opt.toString().toLowerCase().includes(searchTerm.toLowerCase())).map((opt, i) => (
              <div 
                key={i} 
                style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#ffffff', transition: 'background 0.1s' }}
                onMouseOver={e => e.currentTarget.style.background='rgba(255, 255, 255, 0.1)'}
                onMouseOut={e => e.currentTarget.style.background='transparent'}
                onClick={() => toggleOption(opt)}
              >
                <input 
                  id={`checkbox_${i}_${String(opt).replace(/[^a-zA-Z0-9]/g, '_')}`}
                  name={`checkbox_${i}_${String(opt).replace(/[^a-zA-Z0-9]/g, '_')}`}
                  type="checkbox" 
                  checked={selectedValues.includes(opt)} 
                  readOnly 
                  style={{ cursor: 'pointer' }} 
                />
                <span>{opt}</span>
              </div>
            ))}
            {options.filter(opt => opt.toString().toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
              <div style={{ padding: '12px', fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
