import React, { useState, useEffect } from 'react';
import { BarChart3, Database, Layers, Timer, RefreshCw, Activity, Terminal } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    stats: {
      db_type: 'mysql',
      total_tables: 0,
      total_rows: 0,
      db_size: '0 KB',
      tables: []
    },
    queries: {
      total: 0,
      avg_time_ms: 0,
      recent: [],
      most_queried_tables: []
    }
  });

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/analytics`);
      if (response.ok) {
        const resData = await response.json();
        setData(resData);
      }
    } catch (e) {
      console.error("Error loading analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const statsCards = [
    { title: 'Total Tables', val: data.stats.total_tables, desc: 'Tables in schema', icon: <Layers size={20} />, color: 'var(--color-primary)' },
    { title: 'Total Rows', val: data.stats.total_rows.toLocaleString(), desc: 'Total database capacity', icon: <Database size={20} />, color: 'var(--color-accent)' },
    { title: 'Avg Execution Time', val: `${data.queries.avg_time_ms.toFixed(1)} ms`, desc: 'Latency per query', icon: <Timer size={20} />, color: '#10B981' },
    { title: 'Queries Run', val: data.queries.total, desc: 'Queries in current session', icon: <Activity size={20} />, color: '#F59E0B' },
  ];

  return (
    <div style={{
      padding: '40px var(--space-3)',
      maxWidth: '1000px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
      minHeight: '100vh',
      animation: 'fadeIn 0.4s ease-out'
    }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700 }}>Database Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Real-time metadata reports, query latency telemetry, and table utilization metrics for <strong>{data.stats.db_name || 'Active Database'}</strong>.
          </p>
        </div>
        
        <button onClick={fetchAnalytics} disabled={loading} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh stats</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {statsCards.map((c, i) => (
          <div key={i} className="glass-panel" style={{
            padding: '24px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{c.title}</span>
              <span style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', color: 'white' }}>{c.val}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{c.desc}</span>
            </div>
            
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: c.color
            }}>
              {c.icon}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="analytics-charts-grid">
        
        {/* Most Queried Tables Chart */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} style={{ color: 'var(--color-primary)' }} /> Popular Tables
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Frequencies of queries targeted per table in this session.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            {data.queries.most_queried_tables.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                Run queries in the chat window to populate utilization metrics.
              </div>
            ) : (
              data.queries.most_queried_tables.map((t, idx) => {
                const maxQueries = Math.max(...data.queries.most_queried_tables.map(item => item.queries), 1);
                const percent = (t.queries / maxQueries) * 100;
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: 'monospace' }}>
                      <span style={{ fontWeight: 600 }}>{t.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{t.queries} queries</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', background: 'var(--gradient-primary)', borderRadius: '4px', transition: 'width 0.5s ease-out' }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Database Space Allocation */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} style={{ color: 'var(--color-accent)' }} /> Space Allocation (Rows)
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Row volume comparisons across active database tables.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            {data.stats.tables.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                No active tables detected in database.
              </div>
            ) : (
              data.stats.tables.slice(0, 5).map((t, idx) => {
                const maxRows = Math.max(...data.stats.tables.map(item => item.rows), 1);
                const percent = (t.rows / maxRows) * 100;
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: 'monospace' }}>
                      <span style={{ fontWeight: 600 }}>{t.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{t.rows.toLocaleString()} rows</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(to right, #10B981, #3B82F6)', borderRadius: '4px', transition: 'width 0.5s ease-out' }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Recent Query Telemetry Logs */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={18} style={{ color: '#10B981' }} /> Recent Query Logs
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Live trace monitoring of the last 5 executed SQL queries.</p>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', height: '36px' }}>
                <th style={{ padding: '8px 12px' }}>Timestamp</th>
                <th style={{ padding: '8px 12px' }}>Natural Query</th>
                <th style={{ padding: '8px 12px' }}>Executed SQL</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Latency</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.queries.recent.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No queries logged in this session yet.
                  </td>
                </tr>
              ) : (
                data.queries.recent.slice(-5).reverse().map((q, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {new Date(q.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-primary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {q.question}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#A78BFA', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {q.sql}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>
                      {q.duration_ms.toFixed(1)} ms
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 600,
                        background: q.status === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color: q.status === 'success' ? 'var(--color-success)' : 'var(--color-error)'
                      }}>
                        {q.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
