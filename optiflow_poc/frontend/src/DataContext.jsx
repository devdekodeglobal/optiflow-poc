import React, { createContext, useState, useEffect } from 'react';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [allocationData, setAllocationData] = useState([]);
  const [allocationSummary, setAllocationSummary] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [lastRun, setLastRun] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const baseUrl = 'https://optiflow-backend-977593391877.asia-south1.run.app';
      
      // Fetch 50,000 results once
      const q = new URLSearchParams({ page_size: 50000 }).toString();
      const res = await fetch(`${baseUrl}/api/allocation/results?${q}`);
      
      if (res.ok) {
        const json = await res.json();
        setAllocationData(json.allocations || []);
      } else if (res.status === 404) {
        setAllocationData([]);
      }

      // Fetch summary
      const summaryRes = await fetch(`${baseUrl}/api/allocation/summary`);
      if (summaryRes.ok) {
        const summaryJson = await summaryRes.json();
        setAllocationSummary(summaryJson);
        if (summaryJson.last_run_at) {
          setLastRun(new Date(summaryJson.last_run_at).toLocaleString());
        }
      } else if (summaryRes.status === 404) {
        setAllocationSummary(null);
        setLastRun(null);
      }

      // Fetch dashboard data
      const dashRes = await fetch(`${baseUrl}/api/dashboard/all-stores`);
      if (dashRes.ok) {
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
      refreshData: fetchData
    }}>
      {children}
    </DataContext.Provider>
  );
};
