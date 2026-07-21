import { useState, useEffect, useContext } from 'react';
import WizardUploadStep from '../components/wizard/WizardUploadStep';
import WizardStrategyStep from '../components/wizard/WizardStrategyStep';
import AllocationReportPage from './AllocationReportPage';
import { DataContext } from '../DataContext';

export default function AllocationWizardPage() {
  const { refreshData } = useContext(DataContext);
  const [step, setStep] = useState(() => {
    const saved = sessionStorage.getItem('wizard_step');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDataUploaded, setIsDataUploaded] = useState(() => {
    return sessionStorage.getItem('wizard_data_uploaded') === 'true';
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const goToStep = (s) => {
    sessionStorage.setItem('wizard_step', s);
    setStep(s);
  };
  const markDataUploaded = () => {
    sessionStorage.setItem('wizard_data_uploaded', 'true');
    setIsDataUploaded(true);
  };

  useEffect(() => {
    if (step === 3) setIsCollapsed(true);
  }, [step]);

  // On mount: verify with backend in case sessionStorage is stale
  useEffect(() => {
    const baseUrl = 'http://127.0.0.1:8000';
    Promise.all([
      fetch(`${baseUrl}/api/upload/status`).then(r => r.ok ? r.json() : null),
      fetch(`${baseUrl}/api/allocation/status`).then(r => r.ok ? r.json() : null)
    ]).then(([uploadData, allocData]) => {
      const dataUploaded = uploadData?.planogram_uploaded && uploadData?.stock_uploaded;
      if (dataUploaded) markDataUploaded();

      // If backend has no results, clear wizard state so old report isn't shown
      if (!allocData?.has_results) {
        sessionStorage.removeItem('wizard_step');
        sessionStorage.removeItem('wizard_data_uploaded');
      }
      
      setStep(prev => {
        const hasSavedStep = !!sessionStorage.getItem('wizard_step');
        if (!hasSavedStep) {
           if (allocData?.has_results) return 3;
           if (dataUploaded) return 2;
           return 1;
        } else {
           if (dataUploaded && prev === 1) return 2;
           return prev;
        }
      });
    }).catch(() => {});
  }, []);

  const handleReset = async () => {
    setIsResetting(true);
    const baseUrl = 'http://127.0.0.1:8000';
    try {
      await fetch(`${baseUrl}/api/upload/reset`, { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    sessionStorage.removeItem('wizard_step');
    sessionStorage.removeItem('wizard_data_uploaded');
    setIsDataUploaded(false);
    setStep(1);
    setShowConfirm(false);
    setIsResetting(false);
    refreshData(); // Clear the frontend DataContext cache with fresh (empty) data
  };

  return (
    <div>
      {showConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: 400, padding: 24, textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Start New Allocation?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
              Are you sure? You'll need to re-upload your data to start fresh. Your last report will remain available until you complete a new run.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setShowConfirm(false)} disabled={isResetting}>Cancel</button>
              <button className="btn btn-primary" onClick={handleReset} disabled={isResetting}>
                {isResetting ? 'Resetting...' : 'Yes, Start Fresh'}
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="card animate-in" style={{ marginBottom: 12, padding: isCollapsed ? '6px 16px' : '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {isCollapsed ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: 14 }}>
              Step {step} of 3: {step === 1 ? 'Upload Data' : step === 2 ? 'Set Priority' : 'View Report'}
            </span>
            <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 13 }} onClick={() => setIsCollapsed(false)}>
              Expand Wizard
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
          <div 
            onClick={() => goToStep(1)}
            style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            fontWeight: step >= 1 ? 700 : 500, 
            color: step >= 1 ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer'
          }}>
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
            onClick={() => { if (isDataUploaded) goToStep(2); }}
            style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            fontWeight: step >= 2 ? 700 : 500, 
            color: step >= 2 ? 'var(--primary)' : 'var(--text-muted)',
            cursor: isDataUploaded ? 'pointer' : 'not-allowed',
            opacity: isDataUploaded || step >= 2 ? 1 : 0.5
          }}>
            <div style={{ 
              width: 24, height: 24, borderRadius: '50%', 
              background: step >= 2 ? 'var(--primary)' : 'var(--border)', 
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 
            }}>2</div>
            Set Priority
          </div>
          
          <div style={{ height: 2, flex: 1, background: 'var(--border)', margin: '0 12px' }}>
            <div style={{ height: '100%', width: step >= 3 ? '100%' : '0%', background: 'var(--primary)', transition: 'width 0.3s' }} />
          </div>
          
          <div 
            onClick={() => { if (isDataUploaded) goToStep(3); }}
            style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            fontWeight: step >= 3 ? 700 : 500, 
            color: step >= 3 ? 'var(--primary)' : 'var(--text-muted)',
            cursor: isDataUploaded ? 'pointer' : 'not-allowed',
            opacity: isDataUploaded || step >= 3 ? 1 : 0.5
          }}>
            <div style={{ 
              width: 24, height: 24, borderRadius: '50%', 
              background: step >= 3 ? 'var(--primary)' : 'var(--border)', 
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 
            }}>3</div>
            View Report
          </div>
          </div>
          {step === 3 ? (
            <button className="btn btn-outline" style={{ marginLeft: 16, padding: '6px 12px', fontSize: 13, borderColor: 'var(--text-muted)' }} onClick={() => setShowConfirm(true)}>
              Start New Allocation
            </button>
          ) : (
            <button className="btn btn-ghost" style={{ marginLeft: 16, padding: '4px 8px', fontSize: 13 }} onClick={() => setIsCollapsed(true)} title="Collapse wizard header">
              Collapse
            </button>
          )}
          </>
        )}
      </div>

      <div style={{ minHeight: 400 }}>
        {step === 1 && <WizardUploadStep onComplete={() => { markDataUploaded(); goToStep(2); }} />}
        {step === 2 && <WizardStrategyStep onComplete={() => goToStep(3)} />}
        {step === 3 && (
          <div className="animate-in">
             <AllocationReportPage />
          </div>
        )}
      </div>
    </div>
  );
}
