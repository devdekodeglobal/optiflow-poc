import { useState } from 'react';

export default function LoginPage({ onLogin }) {
  const [loginMode, setLoginMode] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginMode === 'admin') {
      if (password === 'dekode1234') {
        onLogin({ name: 'System Admin', role: 'admin' });
      } else {
        setError('Incorrect admin password');
      }
    } else if (loginMode === 'user') {
      if (password === 'dekode5678') {
        onLogin({ name: 'Standard User', role: 'user' });
      } else {
        setError('Incorrect user password');
      }
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
          <img src="/cfs-logo.png" alt="Centre For Sight" style={{ display: 'block', margin: '0 auto 24px', maxWidth: 240, height: 'auto' }} />
          <h2 style={{ fontSize: 16, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 2, margin: '0 0 8px', fontWeight: 600 }}>Login</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, letterSpacing: '0.5px' }}>OptiFlow v0.1</p>
        </div>

        {loginMode ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="animate-in">
            <input
              type="password"
              placeholder={`Enter ${loginMode} password...`}
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
                onClick={() => { setLoginMode(null); setError(''); setPassword(''); }}
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
              onClick={() => setLoginMode('admin')}
              style={{ padding: '14px', fontSize: 16, fontWeight: 700, borderRadius: 12, boxShadow: '0 4px 12px rgba(241,196,15,0.3)', background: 'linear-gradient(135deg, var(--gold), #f39c12)', border: 'none', color: 'var(--bg-app)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              Admin
            </button>
            
            <button
              className="btn btn-ghost"
              onClick={() => setLoginMode('user')}
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
