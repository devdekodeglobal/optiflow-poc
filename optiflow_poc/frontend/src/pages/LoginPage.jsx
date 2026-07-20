import { useState } from 'react';

export default function LoginPage({ onLogin }) {
  const [adminMode, setAdminMode] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (password === '1234') {
      onLogin({ name: 'System Admin', role: 'admin' });
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      background: 'radial-gradient(circle at top left, #f3f0ff, #fff), radial-gradient(circle at bottom right, #fff4e6, #fff)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative background blobs */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'var(--accent)', filter: 'blur(100px)', opacity: 0.1, borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40vw', height: '40vw', background: 'var(--gold)', filter: 'blur(100px)', opacity: 0.1, borderRadius: '50%' }} />

      <div className="card animate-in" style={{
        padding: '48px',
        width: '100%',
        maxWidth: 420,
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 24px 48px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.02)',
        borderRadius: 24,
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, background: 'var(--primary)', color: 'white', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 16px rgba(44, 62, 80, 0.2)' }}>
            <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </div>
          <h2 style={{ fontSize: 16, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 8px', fontWeight: 600 }}>Login</h2>
          <h1 style={{ fontSize: 28, margin: '0 0 4px', color: 'var(--primary)', fontWeight: 700, fontFamily: '"Montserrat", sans-serif', textTransform: 'uppercase', letterSpacing: '1px' }}>CENTRE FOR SIGHT</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, letterSpacing: '0.5px' }}>OptiFlow v0.1</p>
        </div>

        {adminMode ? (
          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="animate-in">
            <input
              type="password"
              placeholder="Enter admin password..."
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              style={{
                padding: '14px 16px',
                borderRadius: 12,
                border: '2px solid rgba(0,0,0,0.05)',
                fontSize: 15,
                width: '100%',
                boxSizing: 'border-box',
                background: '#f8f9fa',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                outline: 'none'
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 4px rgba(241, 196, 15, 0.1)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.05)'; e.target.style.background = '#f8f9fa'; e.target.style.boxShadow = 'none'; }}
              autoFocus
            />
            
            {error && <div style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 600, background: 'rgba(231,76,60,0.1)', padding: '8px', borderRadius: 8 }}>{error}</div>}
            
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => { setAdminMode(false); setError(''); setPassword(''); }}
                style={{ padding: '14px', flex: 1, fontWeight: 700, borderRadius: 12 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '14px', flex: 1, fontWeight: 700, borderRadius: 12, background: 'var(--gold)', color: 'var(--bg-app)', border: 'none' }}
              >
                Authenticate
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="animate-in">
            <button
              className="btn btn-primary"
              onClick={() => setAdminMode(true)}
              style={{ padding: '14px', fontSize: 16, fontWeight: 700, borderRadius: 12, boxShadow: '0 4px 12px rgba(241,196,15,0.3)', background: 'linear-gradient(135deg, var(--gold), #f39c12)', border: 'none', color: 'var(--bg-app)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              Admin
            </button>
            
            <button
              className="btn btn-ghost"
              onClick={() => onLogin({ name: 'Standard User', role: 'user' })}
              style={{ 
                padding: '14px', 
                fontSize: 16, 
                fontWeight: 700,
                background: '#f8f9fa',
                color: 'var(--primary)',
                border: '2px solid rgba(0,0,0,0.05)',
                borderRadius: 12,
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8
              }}
              onMouseOver={e => e.currentTarget.style.background = '#f1f3f5'}
              onMouseOut={e => e.currentTarget.style.background = '#f8f9fa'}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              User
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
