import React, { createContext, useState, useEffect } from 'react';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [allocationData, setAllocationData] = useState([]);
  const [allocationSummary, setAllocationSummary] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [lastRun, setLastRun] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const initialFilters = {
    zone: [],
    region: [],
    store_category: [],
    store_name: [],
    brand_name: [],
    commodity: []
  };

  // Global Filter State for Allocation Report
  const [filters, setFilters] = useState(initialFilters);
  // Global Filter State for Dispatch Orders
  const [dispatchFilters, setDispatchFilters] = useState(initialFilters);
  // Global Filter State for Planogram Editor
  const [planogramFilters, setPlanogramFilters] = useState(initialFilters);

  const resetFilters = () => setFilters(initialFilters);
  const resetDispatchFilters = () => setDispatchFilters(initialFilters);
  const resetPlanogramFilters = () => setPlanogramFilters(initialFilters);

  const fetchData = async (instantData = null) => {
    if (instantData && instantData.summary) {
      setAllocationSummary(instantData.summary);
      if (instantData.last_run_at) {
        const rawDateStr = instantData.last_run_at;
        const isoDateStr = rawDateStr.includes(' ') && !rawDateStr.includes('T') 
          ? rawDateStr.replace(' ', 'T') 
          : rawDateStr;
        const date = new Date(isoDateStr);
        setLastRun(!isNaN(date.getTime()) ? date.toLocaleString() : rawDateStr);
      }
    }

    setIsLoadingData(true);
    try {
      const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:8000'
        : 'https://optiflow-backend-977593391877.asia-south1.run.app';
      const q = new URLSearchParams({ page_size: 50000 }).toString();

      // 1. Fetch summary and dashboard (Fast queries, ~200ms)
      const summaryPromise = instantData && instantData.summary
        ? Promise.resolve()
        : fetch(`${baseUrl}/api/allocation/summary`)
            .then(res => res.ok ? res.json() : null)
            .then(summaryJson => {
              if (summaryJson) {
                setAllocationSummary(summaryJson);
                if (summaryJson.last_run_at) {
                  const rawDateStr = summaryJson.last_run_at;
                  const isoDateStr = rawDateStr.includes(' ') && !rawDateStr.includes('T') 
                    ? rawDateStr.replace(' ', 'T') 
                    : rawDateStr;
                  const date = new Date(isoDateStr);
                  setLastRun(!isNaN(date.getTime()) ? date.toLocaleString() : rawDateStr);
                }
              } else {
                setAllocationSummary(null);
                setLastRun(null);
              }
            })
            .catch(() => {
              setAllocationSummary(null);
              setLastRun(null);
            });

      const dashPromise = fetch(`${baseUrl}/api/dashboard/all-stores`)
        .then(res => res.ok ? res.json() : null)
        .then(dashJson => {
          if (dashJson) setDashboardData(dashJson);
        })
        .catch(() => {});

      // Wait for fast summary queries to resolve so header timestamp updates instantly
      await Promise.all([summaryPromise, dashPromise]);

      // 2. Fetch results (Slow query, 5-10s depending on network since payload is ~10MB)
      const resultsRes = await fetch(`${baseUrl}/api/allocation/results?${q}`).catch(() => null);
      if (resultsRes?.ok) {
        const json = await resultsRes.json();
        setAllocationData(json.allocations || []);
      } else {
        setAllocationData([]);
      }

    } catch (e) {
      console.error('Failed to fetch global allocation data', e);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DataContext.Provider value={{
      allocationData,
      allocationSummary,
      dashboardData,
      lastRun,
      isLoadingData,
      refreshData: fetchData,
      filters,
      setFilters,
      resetFilters,
      dispatchFilters,
      setDispatchFilters,
      resetDispatchFilters,
      planogramFilters,
      setPlanogramFilters,
      resetPlanogramFilters
    }}>
      {children}
    </DataContext.Provider>
  );
};
