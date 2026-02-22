import React, { useState, useMemo } from "react";
import { softwareList } from "./SoftwareData";

export default function SoftwareTable() {
  const [globalSearch, setGlobalSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "ascending" });
  const [filters, setFilters] = useState({
    name: "",
    version: "",
    type: "",
    category: "",
  });

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (e, key) => {
    setFilters({
      ...filters,
      [key]: e.target.value,
    });
  };

  const filteredAndSortedData = useMemo(() => {
    // 1. Filter
    let filteredData = softwareList.filter((item) => {
      // Global search
      const matchesGlobal = 
        item.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        item.category.toLowerCase().includes(globalSearch.toLowerCase()) ||
        (item.version && item.version.toLowerCase().includes(globalSearch.toLowerCase()));
      
      if (!matchesGlobal) return false;

      // Column filters
      const matchesName = item.name.toLowerCase().includes(filters.name.toLowerCase());
      const matchesVersion = (item.version || "").toLowerCase().includes(filters.version.toLowerCase());
      const matchesType = item.type.toLowerCase().includes(filters.type.toLowerCase());
      const matchesCategory = item.category.toLowerCase().includes(filters.category.toLowerCase());

      return matchesName && matchesVersion && matchesType && matchesCategory;
    });

    // 2. Sort
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        const aVal = (a[sortConfig.key] || "").toLowerCase();
        const bVal = (b[sortConfig.key] || "").toLowerCase();
        if (aVal < bVal) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  }, [globalSearch, filters, sortConfig]);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <span style={{ opacity: 0.3 }}>↕️</span>;
    return sortConfig.direction === "ascending" ? <span>🔼</span> : <span>🔽</span>;
  };

  const thStyle = {
    textAlign: "left",
    padding: "10px",
    borderBottom: "2px solid #ddd",
    cursor: "pointer",
    userSelect: "none",
    position: "relative",
    verticalAlign: "top"
  };

  const filterInputStyle = {
    width: "100%",
    padding: "6px",
    marginTop: "8px",
    fontSize: "13px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
    fontWeight: "normal"
  };

  return (
    <div style={{ marginBottom: "2rem" }}>
      <input
        type="text"
        placeholder="Global search by name, category, or version..."
        value={globalSearch}
        onChange={(e) => setGlobalSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: "20px",
          borderRadius: "6px",
          border: "1px solid #ccc",
          fontSize: "16px",
          boxSizing: "border-box"
        }}
      />

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
          <thead>
            <tr>
              <th style={thStyle} onClick={() => handleSort("name")}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Name <SortIcon columnKey="name" />
                </div>
                <input 
                  type="text" 
                  placeholder="Filter name..." 
                  value={filters.name}
                  onChange={(e) => handleFilterChange(e, "name")}
                  onClick={(e) => e.stopPropagation()}
                  style={filterInputStyle}
                />
              </th>
              <th style={thStyle} onClick={() => handleSort("version")}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Version <SortIcon columnKey="version" />
                </div>
                <input 
                  type="text" 
                  placeholder="Filter version..." 
                  value={filters.version}
                  onChange={(e) => handleFilterChange(e, "version")}
                  onClick={(e) => e.stopPropagation()}
                  style={filterInputStyle}
                />
              </th>
              <th style={thStyle} onClick={() => handleSort("type")}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Type <SortIcon columnKey="type" />
                </div>
                 <input 
                  type="text" 
                  placeholder="Filter type..." 
                  value={filters.type}
                  onChange={(e) => handleFilterChange(e, "type")}
                  onClick={(e) => e.stopPropagation()}
                  style={filterInputStyle}
                />
              </th>
              <th style={thStyle} onClick={() => handleSort("category")}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  Category <SortIcon columnKey="category" />
                </div>
                 <input 
                  type="text" 
                  placeholder="Filter category..." 
                  value={filters.category}
                  onChange={(e) => handleFilterChange(e, "category")}
                  onClick={(e) => e.stopPropagation()}
                  style={filterInputStyle}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData.length > 0 ? (
              filteredAndSortedData.map((item, index) => (
                <tr key={index} style={{ borderBottom: "1px solid #ddd" }}>
                  <td style={{ padding: "12px 10px" }}>
                    <strong>{item.name}</strong>
                  </td>
                  <td style={{ padding: "12px 10px" }}>{item.version || "-"}</td>
                  <td style={{ padding: "12px 10px" }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.85em',
                      backgroundColor: item.type === 'Environment Module' ? '#e6f7ff' : '#f6ffed',
                      border: `1px solid ${item.type === 'Environment Module' ? '#91d5ff' : '#b7eb8f'}`,
                      color: item.type === 'Environment Module' ? '#096dd9' : '#389e0d',
                      whiteSpace: 'nowrap',
                      fontWeight: 'bold'
                    }}>
                      {item.type}
                    </span>
                  </td>
                  <td style={{ padding: "12px 10px", fontSize: '0.9em', color: 'var(--ifm-color-emphasis-700)' }}>
                    {item.category}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  style={{ textAlign: "center", padding: "30px", color: 'var(--ifm-color-emphasis-600)' }}
                >
                  No software matches your search and filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
