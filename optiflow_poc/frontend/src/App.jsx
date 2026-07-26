import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import AllocationReportPage from './pages/AllocationReportPage';
import AllocationFiltersSidebar from './components/AllocationFiltersSidebar';
import OverallDashboard from './pages/OverallDashboard';
import AllocationSummaryPage from './pages/AllocationSummaryPage';
import DispatchPage from './pages/DispatchPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ExecutivePage from './pages/ExecutivePage';
import AssortmentPage from './pages/AssortmentPage';

import StorePage from './pages/StorePage';
import BrandPage from './pages/BrandPage';
import RegionPage from './pages/RegionPage';
import PlanogramPage from './pages/PlanogramPage';
import LoginPage from './pages/LoginPage';
import { DataProvider } from './DataContext';

const SidebarItemWithFilters = ({ to, label, icon, sidebarCollapsed }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const [isExpanded, setIsExpanded] = useState(isActive);

  React.useEffect(() => {
    if (isActive) {
      setIsExpanded(true);
    }
  }, [isActive]);

  return (
    <>
      <NavLink 
        to={to} 
        className={`nav-link ${isActive ? 'active' : ''}`}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {icon}
          <span>{label}</span>
        </div>
        {!sidebarCollapsed && isActive && (
          <div 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsExpanded(!isExpanded); }}
            style={{ padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </NavLink>
      {!sidebarCollapsed && isActive && isExpanded && (
        <AllocationFiltersSidebar isDispatch={to === '/dispatch'} isPlanogram={to === '/planogram'} />
      )}
    </>
  );
};

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  const handleLogout = () => {
    setUser(null);
    window.location.pathname = '/';
  };

  return (
    <DataProvider>
      <Router>
      <div className="app-layout">
        <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <button 
            className="sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? '»' : '«'}
          </button>
          
          <div className="sidebar-brand" style={{ textAlign: sidebarCollapsed ? 'center' : 'left' }}>
            <h1 style={{ fontSize: '18px', lineHeight: '1.2', fontFamily: '"Montserrat", sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '-0.5px', transform: 'scaleX(0.95)', transformOrigin: sidebarCollapsed ? 'center' : 'left' }}>{!sidebarCollapsed && 'Centre For Sight'}</h1>
            {!sidebarCollapsed && <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#ffffff', fontWeight: 800, letterSpacing: '0.5px' }}>OptiFlow v0.1</p>}
          </div>

          <nav className="sidebar-nav">
            {/*
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              <span>Dashboard</span>
            </NavLink>
            */}


            {user.role === 'admin' && (
              <>
                <SidebarItemWithFilters 
                  to="/planogram" 
                  label="Planogram" 
                  icon={
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  } 
                  sidebarCollapsed={sidebarCollapsed} 
                />

                <SidebarItemWithFilters 
                  to="/allocation" 
                  label="Allocation" 
                  sidebarCollapsed={sidebarCollapsed}
                  icon={
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  }
                />
              </>
            )}

            {/* 
            <NavLink to="/allocation-report" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Allocation Report</span>
            </NavLink>
            */}

            <SidebarItemWithFilters 
              to="/dispatch" 
              label="Dispatch Orders" 
              sidebarCollapsed={sidebarCollapsed}
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />

            {/*
            <NavLink to="/allocation-dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Allocation Dashboard</span>
            </NavLink>

            <NavLink to="/assortment" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Stock Flow Overview</span>
            </NavLink>

            <NavLink to="/analytics" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>System Analytics</span>
            </NavLink>

            <NavLink to="/executive" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 8v8m-4-5v5m-4-2v2M2 4h20v16H2V4z" />
              </svg>
              <span>Executive Summary</span>
            </NavLink>
            */}

          </nav>



          <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 20px' }}>
            {!sidebarCollapsed ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ 
                    background: user.role === 'admin' ? 'var(--gold)' : 'var(--accent)', 
                    color: 'var(--bg-app)', 
                    padding: '4px 12px', 
                    borderRadius: 12, 
                    fontSize: 11, 
                    fontWeight: 800, 
                    textTransform: 'uppercase',
                    letterSpacing: 0.5
                  }}>
                    {user.role}
                  </div>
                </div>
                <button onClick={handleLogout} style={{ 
                  background: 'rgba(255,255,255,0.12)', 
                  color: '#fff', 
                  border: 'none', 
                  padding: '8px 16px', 
                  borderRadius: 8, 
                  fontSize: 12, 
                  cursor: 'pointer', 
                  textAlign: 'center', 
                  fontWeight: 600, 
                  width: '100%',
                  transition: 'background 0.2s'
                }} 
                onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.2)'} 
                onMouseOut={e => e.currentTarget.style.background='rgba(255,255,255,0.12)'}>
                  Logout
                </button>
              </div>
            ) : (
              <button onClick={handleLogout} title="Logout" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '8px', borderRadius: 6, cursor: 'pointer', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <Routes>
            <Route path="/" element={
              user.role === 'admin' ? <Navigate to="/allocation" replace /> : <Navigate to="/dispatch" replace />
            } />
            <Route path="/overall-dashboard" element={<Navigate to="/" replace />} />
            <Route path="/allocation-summary" element={<AllocationSummaryPage />} />
            <Route path="/allocation-report" element={<AllocationReportPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/executive" element={<ExecutivePage />} />
            <Route path="/assortment" element={<AssortmentPage />} />
            <Route path="/planogram" element={<PlanogramPage />} />
            <Route path="/allocation" element={<AllocationReportPage />} />
            <Route path="/dispatch" element={<DispatchPage />} />
            <Route path="/dispatch/:entityType/:entityName" element={<DispatchPage />} />
            <Route path="/store/:storeName" element={<StorePage />} />
            <Route path="/brand/:brandName" element={<BrandPage />} />
            <Route path="/region/:regionName" element={<RegionPage />} />
          </Routes>
        </main>
      </div>
    </Router>
    </DataProvider>
  );
}

export default App;
