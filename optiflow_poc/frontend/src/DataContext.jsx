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

  const resetFilters = () => setFilters(initialFilters);
  const resetDispatchFilters = () => setDispatchFilters(initialFilters);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const baseUrl = 'http://127.0.0.1:8000';
      const q = new URLSearchParams({ page_size: 50000 }).toString();

      // Fetch all 3 in parallel
      const [allocRes, summaryRes, dashRes] = await Promise.all([
        fetch(`${baseUrl}/api/allocation/results?${q}`).catch(() => null),
        fetch(`${baseUrl}/api/allocation/summary`).catch(() => null),
        fetch(`${baseUrl}/api/dashboard/all-stores`).catch(() => null),
      ]);

      if (allocRes?.ok) {
        const json = await allocRes.json();
        setAllocationData(json.allocations || []);
      } else {
        setAllocationData([]);
      }

      if (summaryRes?.ok) {
        const summaryJson = await summaryRes.json();
        setAllocationSummary(summaryJson);
        if (summaryJson.last_run_at) {
          const rawDateStr = summaryJson.last_run_at;
          // Convert space-separated timestamp to ISO format for browser compatibility (e.g. Safari)
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

      if (dashRes?.ok) {
        const dashJson = await dashRes.json();
        setDashboardData(dashJson);
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
      resetDispatchFilters
    }}>
      {children}
    </DataContext.Provider>
  );
};
