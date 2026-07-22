import React, { useState, useEffect, useContext } from 'react';
import WizardUploadStep from './WizardUploadStep';
import WizardStrategyStep from './WizardStrategyStep';
import { DataContext } from '../../DataContext';

export default function AllocationModal({ isOpen, onClose }) {
  const { refreshData } = useContext(DataContext);
  const [step, setStep] = useState(1);
  const [isDataUploaded, setIsDataUploaded] = useState(false);

  // When modal opens, check status
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      const baseUrl = 'http://127.0.0.1:8000';
      fetch(`${baseUrl}/api/upload/status`)
        .then(r => r.ok ? r.json() : null)
        .then(uploadData => {
          const dataUploaded = uploadData?.planogram && uploadData?.stock;
          setIsDataUploaded(dataUploaded);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const markDataUploaded = () => {
    setIsDataUploaded(true);
    setStep(2);
  };

  const handleRunComplete = () => {
    refreshData(); // updates the background report
    onClose();     // close modal
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div className="card animate-in" style={{ 
        width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto',
        position: 'relative', padding: 0
      }}>
        
        {/* Modal Header */}
        <div style={{ 
          padding: '16px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-surface)', position: 'sticky', top: 0, zIndex: 10
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>New Allocation</h2>
          <button 
            className="btn btn-ghost" 
            style={{ padding: 4, borderRadius: '50%', color: 'var(--text-muted)' }}
            onClick={onClose}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Wizard Steps Header */}
        <div style={{ padding: '16px 24px', background: 'var(--bg-app)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
            <div 
              onClick={() => setStep(1)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 8, 
                fontWeight: step >= 1 ? 700 : 500, 
                color: step >= 1 ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <div style={{ 
                width: 24, height: 24, borderRadius: '50%', 
                background: step >= 1 ? 'var(--primary)' : 'var(--border)', 
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 
              }}>1</div>
              Upload Data
            </div>
            
            <div style={{ height: 2, flex: 1, background: 'var(--border)', margin: '0 12px' }}>
              <div style={{ height: '100%', width: step >= 2 ? '100%' : '0%', background: 'var(--primary)', transition: 'width 0.3s' }} />
            </div>
            
            <div 
              onClick={() => { if (isDataUploaded || step >= 2) setStep(2); }}
              style={{ 
                display: 'flex', alignItems: 'center', gap: 8, 
                fontWeight: step >= 2 ? 700 : 500, 
                color: step >= 2 ? 'var(--primary)' : 'var(--text-muted)',
                cursor: (isDataUploaded || step >= 2) ? 'pointer' : 'not-allowed',
                opacity: (isDataUploaded || step >= 2) ? 1 : 0.5
              }}
            >
              <div style={{ 
                width: 24, height: 24, borderRadius: '50%', 
                background: step >= 2 ? 'var(--primary)' : 'var(--border)', 
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 
              }}>2</div>
              Set Priority
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 24, background: 'var(--bg-surface)', minHeight: 300 }}>
          {step === 1 && <WizardUploadStep onComplete={markDataUploaded} />}
          {step === 2 && <WizardStrategyStep onComplete={handleRunComplete} />}
        </div>
      </div>
    </div>
  );
}
