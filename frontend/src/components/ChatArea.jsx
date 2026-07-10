import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Terminal, 
  Copy, 
  Check, 
  Play, 
  BarChart2, 
  LineChart, 
  PieChart, 
  AreaChart, 
  CornerDownLeft, 
  Sparkles, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Database,
  Volume2,
  AlertTriangle
} from 'lucide-react';

// Custom SVG Chart Component
function CustomChart({ data, columns, activeChart, setActiveChart }) {
  if (!data || data.length === 0 || !columns || columns.length < 2) return null;

  // Identify numeric and text columns
  const numericCols = [];
  const textCols = [];

  columns.forEach((col, idx) => {
    // Check type of first few values
    const val = data[0][col];
    if (typeof val === 'number' || (!isNaN(val) && val !== null && val !== '')) {
      numericCols.push(col);
    } else {
      textCols.push(col);
    }
  });

  // Fallbacks if no clear separation
  const labelCol = textCols[0] || columns[0];
  const valueCol = numericCols[0] || columns[1];

  if (!valueCol) return <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Insufficient numeric data for chart.</div>;

  // Transform data
  const chartData = data.slice(0, 10).map((row) => ({
    label: String(row[labelCol] || ''),
    value: Number(row[valueCol] || 0)
  }));

  const maxVal = Math.max(...chartData.map(d => d.value), 1);
  const minVal = Math.min(...chartData.map(d => d.value), 0);

  const svgWidth = 500;
  const svgHeight = 220;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }} className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChart2 size={16} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Visualized Data: {valueCol} vs {labelCol}</span>
        </div>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '3px', borderRadius: '8px' }}>
          {[
            { id: 'bar', icon: <BarChart2 size={14} /> },
            { id: 'line', icon: <LineChart size={14} /> },
            { id: 'area', icon: <AreaChart size={14} /> },
            { id: 'pie', icon: <PieChart size={14} /> }
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setActiveChart(c.id)}
              style={{
                border: 'none',
                background: activeChart === c.id ? 'var(--color-primary)' : 'transparent',
                color: 'white',
                padding: '5px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {c.icon}
            </button>
          ))}
        </div>
      </div>

      {activeChart !== 'pie' ? (
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          {/* Y Axis Guide Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding.top + graphHeight * (1 - ratio);
            const val = minVal + (maxVal - minVal) * ratio;
            return (
              <g key={idx}>
                <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                <text x={padding.left - 10} y={y + 4} fill="var(--text-secondary)" fontSize="10" textAnchor="end">{val.toFixed(0)}</text>
              </g>
            );
          })}

          {/* Render Bars */}
          {activeChart === 'bar' && chartData.map((d, idx) => {
            const x = padding.left + (idx * (graphWidth / chartData.length)) + (graphWidth / chartData.length) * 0.15;
            const barWidth = (graphWidth / chartData.length) * 0.7;
            const barHeight = (d.value / maxVal) * graphHeight;
            const y = padding.top + graphHeight - barHeight;
            return (
              <g key={idx}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="url(#primaryGrad)"
                  rx="3"
                  ry="3"
                  style={{ transition: 'all 0.5s ease' }}
                />
                <text
                  x={x + barWidth / 2}
                  y={padding.top + graphHeight + 16}
                  fill="var(--text-secondary)"
                  fontSize="9"
                  textAnchor="middle"
                  transform={`rotate(-15, ${x + barWidth / 2}, ${padding.top + graphHeight + 16})`}
                >
                  {d.label.length > 8 ? d.label.substring(0, 7) + '..' : d.label}
                </text>
              </g>
            );
          })}

          {/* Render Line / Area */}
          {(activeChart === 'line' || activeChart === 'area') && (() => {
            const points = chartData.map((d, idx) => {
              const x = padding.left + (idx * (graphWidth / (chartData.length - 1 || 1)));
              const y = padding.top + graphHeight - (d.value / maxVal) * graphHeight;
              return { x, y, label: d.label };
            });

            const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${points[0].x} ${padding.top + graphHeight} Z`;

            return (
              <g>
                {activeChart === 'area' && (
                  <path d={areaPath} fill="url(#areaGrad)" stroke="none" />
                )}
                <path d={linePath} fill="none" stroke="var(--color-accent)" strokeWidth="3" />
                {points.map((p, idx) => (
                  <g key={idx}>
                    <circle cx={p.x} cy={p.y} r="5" fill="var(--color-primary)" stroke="white" strokeWidth="1.5" />
                    <text
                      x={p.x}
                      y={padding.top + graphHeight + 16}
                      fill="var(--text-secondary)"
                      fontSize="9"
                      textAnchor="middle"
                    >
                      {p.label.length > 8 ? p.label.substring(0, 7) + '..' : p.label}
                    </text>
                  </g>
                ))}
              </g>
            );
          })()}

          {/* Gradients */}
          <defs>
            <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(124, 58, 237, 0.4)" />
              <stop offset="100%" stopColor="rgba(37, 99, 235, 0.0)" />
            </linearGradient>
          </defs>
        </svg>
      ) : (
        /* Pie Chart rendering */
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '180px', gap: '20px' }}>
          <svg width="150" height="150" viewBox="-75 -75 150 150">
            {(() => {
              const total = chartData.reduce((sum, d) => sum + d.value, 0) || 1;
              let accumulatedAngle = 0;
              const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6'];

              return chartData.map((d, idx) => {
                const angle = (d.value / total) * 360;
                const x1 = Math.cos((accumulatedAngle - 90) * Math.PI / 180) * 60;
                const y1 = Math.sin((accumulatedAngle - 90) * Math.PI / 180) * 60;
                accumulatedAngle += angle;
                const x2 = Math.cos((accumulatedAngle - 90) * Math.PI / 180) * 60;
                const y2 = Math.sin((accumulatedAngle - 90) * Math.PI / 180) * 60;
                const largeArc = angle > 180 ? 1 : 0;

                return (
                  <path
                    key={idx}
                    d={`M 0 0 L ${x1} ${y1} A 60 60 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={colors[idx % colors.length]}
                    stroke="#111827"
                    strokeWidth="2"
                  />
                );
              });
            })()}
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', maxHeight: '140px', overflowY: 'auto' }}>
            {chartData.map((d, idx) => {
              const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6'];
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors[idx % colors.length] }}></div>
                  <span style={{ color: 'var(--text-secondary)' }}>{d.label}:</span>
                  <strong>{d.value}</strong>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatArea({ 
  messages, 
  onSendMessage, 
  isGenerating, 
  isConnected, 
  onNavigateToConnect 
}) {
  const [inputText, setInputText] = useState('');
  const [copiedIdx, setCopiedIdx] = useState(null);
  
  // Table state (specific to message indices)
  const [tableSearch, setTableSearch] = useState({});
  const [tableSort, setTableSort] = useState({}); // { msgIdx: { col, direction } }
  const [tablePage, setTablePage] = useState({});  // { msgIdx: page }
  const [activeCharts, setActiveCharts] = useState({}); // { msgIdx: 'bar' }

  const chatEndRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Follow-up suggestions
  const suggestions = [
    "Show all users",
    "How many users are in the database?",
    "Show all tables in the database",
    "List bookings detail"
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flex: 1,
      backgroundColor: 'var(--bg-primary)',
      position: 'relative'
    }}>
      
      {/* Header Bar */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-card)',
        backdropFilter: 'blur(12px)',
        zIndex: 5
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={20} style={{ color: 'var(--color-primary)' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Database Assistant</h2>
        </div>
        {!isConnected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-warning)' }}>No database connected</span>
            <button onClick={onNavigateToConnect} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              Connect
            </button>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {messages.length === 0 ? (
          /* Empty State */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            maxWidth: '500px',
            margin: '0 auto',
            textAlign: 'center',
            gap: '16px',
            animation: 'fadeIn 0.5s ease-out'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '24px',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(124, 58, 237, 0.3)',
              marginBottom: '8px'
            }}>
              <Terminal size={32} color="white" />
            </div>
            <h2 style={{ fontWeight: 700, fontSize: '24px' }}>QueryChat AI Chatbox</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
              Connect your database and start talking with your tables in plain English. We'll translate questions to SQL, pull the records, and plot charts instantly!
            </p>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              gap: '8px',
              marginTop: '16px'
            }}>
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(s)}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="suggestion-chip"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.sender === 'user';
            return (
              <div 
                key={idx} 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: isUser ? '80%' : '100%',
                  width: isUser ? 'auto' : '100%',
                  animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {/* Message Bubble */}
                <div style={{
                  padding: '14px 18px',
                  borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  background: isUser ? 'var(--gradient-primary)' : 'var(--bg-card)',
                  border: isUser ? 'none' : '1px solid var(--border-color)',
                  color: 'white',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  boxShadow: isUser ? '0 4px 14px rgba(37, 99, 235, 0.2)' : 'none'
                }}>
                  {msg.text}
                </div>

                {/* AI Assistant Output Section (SQL, Table, Charts, Explanation) */}
                {!isUser && msg.responsePayload && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '850px', width: '100%', marginTop: '4px' }}>
                    


                    {/* SQL Card */}
                    <div style={{
                      background: '#0B1220',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.02)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          <Terminal size={14} style={{ color: 'var(--color-primary)' }} />
                          <span>Generated SQL Query</span>
                        </div>
                        <button
                          onClick={() => handleCopy(msg.responsePayload.sql, idx)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px'
                          }}
                        >
                          {copiedIdx === idx ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                          <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre style={{
                        padding: '14px',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        color: '#A78BFA',
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                      }}>{msg.responsePayload.sql}</pre>
                    </div>

                    {/* Results Table Section */}
                    {msg.responsePayload.success ? (
                      <div>
                        {/* Table Controls (Search, Sort, Pagination) */}
                        <div style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px',
                            background: 'rgba(255,255,255,0.01)'
                          }}>
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>Query Execution Results ({msg.responsePayload.count} rows)</span>
                            
                            {/* Search filter input */}
                            <div style={{ position: 'relative', width: '220px' }}>
                              <input
                                type="text"
                                placeholder="Search rows..."
                                value={tableSearch[idx] || ''}
                                onChange={(e) => setTableSearch({...tableSearch, [idx]: e.target.value})}
                                style={{
                                  padding: '6px 12px 6px 32px',
                                  fontSize: '12px'
                                }}
                                className="input-field"
                              />
                              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            </div>
                          </div>

                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                  {msg.responsePayload.columns.map((col, cIdx) => {
                                    const isSorted = tableSort[idx]?.col === col;
                                    const dir = tableSort[idx]?.direction;
                                    return (
                                      <th 
                                        key={cIdx} 
                                        onClick={() => {
                                          const direction = isSorted && dir === 'asc' ? 'desc' : 'asc';
                                          setTableSort({...tableSort, [idx]: { col, direction }});
                                        }}
                                        style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          {col}
                                          {isSorted && (direction === 'asc' ? '▲' : '▼')}
                                        </div>
                                      </th>
                                    );
                                  })}
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  let filteredRows = [...msg.responsePayload.rows];
                                  const searchQ = (tableSearch[idx] || '').toLowerCase();
                                  
                                  // Apply search query
                                  if (searchQ) {
                                    filteredRows = filteredRows.filter(row => 
                                      row.some(cell => String(cell || '').toLowerCase().includes(searchQ))
                                    );
                                  }

                                  // Apply sort
                                  const sort = tableSort[idx];
                                  if (sort) {
                                    const colIdx = msg.responsePayload.columns.indexOf(sort.col);
                                    filteredRows.sort((a, b) => {
                                      const valA = a[colIdx];
                                      const valB = b[colIdx];
                                      if (typeof valA === 'number' && typeof valB === 'number') {
                                        return sort.direction === 'asc' ? valA - valB : valB - valA;
                                      }
                                      return sort.direction === 'asc' 
                                        ? String(valA).localeCompare(String(valB)) 
                                        : String(valB).localeCompare(String(valA));
                                    });
                                  }

                                  // Apply pagination
                                  const page = tablePage[idx] || 0;
                                  const pageSize = 5;
                                  const paginatedRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);

                                  if (paginatedRows.length === 0) {
                                    return (
                                      <tr>
                                        <td colSpan={msg.responsePayload.columns.length} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                          No rows found matching search filter.
                                        </td>
                                      </tr>
                                    );
                                  }

                                  return paginatedRows.map((row, rIdx) => (
                                    <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="table-row-hover">
                                      {row.map((cell, cIdx) => (
                                        <td key={cIdx} style={{ padding: '10px 16px', color: 'var(--text-primary)' }}>
                                          {cell === null ? <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', fontFamily: 'monospace' }}>NULL</span> : String(cell)}
                                        </td>
                                      ))}
                                    </tr>
                                  ));
                                })()}
                              </tbody>
                            </table>
                          </div>

                          {/* Pagination Footer */}
                          {(() => {
                            const searchQ = (tableSearch[idx] || '').toLowerCase();
                            let total = msg.responsePayload.rows.length;
                            if (searchQ) {
                              total = msg.responsePayload.rows.filter(row => 
                                row.some(cell => String(cell || '').toLowerCase().includes(searchQ))
                              ).length;
                            }
                            
                            const pageSize = 5;
                            const totalPages = Math.ceil(total / pageSize);
                            const page = tablePage[idx] || 0;

                            if (totalPages <= 1) return null;

                            return (
                              <div style={{
                                padding: '10px 16px',
                                borderTop: '1px solid var(--border-color)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '12px',
                                color: 'var(--text-secondary)',
                                backgroundColor: 'rgba(255,255,255,0.01)'
                              }}>
                                <span>Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, total)} of {total} rows</span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    disabled={page === 0}
                                    onClick={() => setTablePage({...tablePage, [idx]: page - 1})}
                                    style={{
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      border: '1px solid var(--border-color)',
                                      background: 'transparent',
                                      color: page === 0 ? 'rgba(255,255,255,0.1)' : 'white',
                                      cursor: page === 0 ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    <ChevronLeft size={14} />
                                  </button>
                                  <button
                                    disabled={page >= totalPages - 1}
                                    onClick={() => setTablePage({...tablePage, [idx]: page + 1})}
                                    style={{
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      border: '1px solid var(--border-color)',
                                      background: 'transparent',
                                      color: page >= totalPages - 1 ? 'rgba(255,255,255,0.1)' : 'white',
                                      cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    <ChevronRight size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Interactive SVG Chart */}
                        <CustomChart
                          data={msg.responsePayload.rows.map(row => {
                            const obj = {};
                            msg.responsePayload.columns.forEach((col, cIdx) => {
                              obj[col] = row[cIdx];
                            });
                            return obj;
                          })}
                          columns={msg.responsePayload.columns}
                          activeChart={activeCharts[idx] || 'bar'}
                          setActiveChart={(chartType) => setActiveCharts({...activeCharts, [idx]: chartType})}
                        />
                      </div>
                    ) : (
                      /* Exec Error Card */
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        padding: '14px 18px',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-error)',
                        fontSize: '13px'
                      }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <AlertTriangle size={16} /> SQL Execution Error
                        </div>
                        <pre style={{ fontSize: '11px', fontFamily: 'monospace', overflowX: 'auto', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px' }}>
                          {msg.responsePayload.error_message}
                        </pre>
                      </div>
                    )}

                    {/* AI Insights Summary Card */}
                    <div style={{
                      background: 'rgba(124, 58, 237, 0.03)',
                      border: '1px solid rgba(124, 58, 237, 0.15)',
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      gap: '12px'
                    }}>
                      <div style={{
                        background: 'var(--gradient-primary)',
                        width: '32px',
                        height: '32px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        flexShrink: 0
                      }}>
                        <Sparkles size={16} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#A78BFA' }}>AI Insights Summary</span>
                        <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                          {msg.responsePayload.explanation}
                        </p>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Skeleton thinking loader */}
        {isGenerating && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignSelf: 'flex-start', width: '100%', maxWidth: '850px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              alignSelf: 'flex-start',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span className="dot-typing" style={{ animation: 'typing 1s infinite', animationDelay: '0s' }}>.</span>
                <span className="dot-typing" style={{ animation: 'typing 1s infinite', animationDelay: '0.2s' }}>.</span>
                <span className="dot-typing" style={{ animation: 'typing 1s infinite', animationDelay: '0.4s' }}>.</span>
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>Thinking... Translating natural language to SQL</span>
            </div>

            {/* Skeleton Card */}
            <div style={{
              width: '100%',
              height: '100px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }} className="shimmer-loader"></div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Follow-up chips (shown when not loading and there are messages) */}
      {messages.length > 0 && !isGenerating && (
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '0 24px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          maskImage: 'linear-gradient(to right, white 85%, transparent 100%)'
        }}>
          {["Show users details", "Count total bookings", "List all tables"].map((q, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(q)}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              className="suggestion-chip-mini"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Area */}
      <div style={{ padding: '16px 24px 24px' }}>
        <div style={{
          position: 'relative',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--gradient-glow)',
          display: 'flex',
          flexDirection: 'column',
          padding: '10px'
        }}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your database..."
            style={{
              width: '100%',
              minHeight: '60px',
              maxHeight: '160px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '14px',
              padding: '8px',
              resize: 'none',
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.5
            }}
          />

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            paddingTop: '8px',
            marginTop: '4px'
          }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                onClick={onNavigateToConnect}
                title="Connect Database" 
                className="btn btn-text"
                style={{ padding: '8px', borderRadius: '8px', minWidth: 'unset' }}
              >
                <Database size={16} />
              </button>
              <button 
                title="Voice Input (UI only)" 
                className="btn btn-text"
                style={{ padding: '8px', borderRadius: '8px', minWidth: 'unset' }}
                onClick={() => alert("Voice Input: Feature visual template active.")}
              >
                <Volume2 size={16} />
              </button>
            </div>
            
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isGenerating}
              className="btn btn-primary"
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px'
              }}
            >
              <span>Send Query</span>
              <Send size={12} />
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}
