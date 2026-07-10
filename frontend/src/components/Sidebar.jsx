import React, { useState } from 'react';
import { 
  MessageSquare, 
  Database, 
  UploadCloud, 
  BarChart3, 
  Settings, 
  Menu, 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  User, 
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';

export default function Sidebar({ activeView, onViewChange, onNewChat, isConnected, activeDbName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const toggleSidebar = () => setCollapsed(!collapsed);
  const toggleTheme = () => {
    setIsDark(!isDark);
    if (isDark) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  };

  const navItems = [
    { id: 'chat', label: 'Chat', icon: <MessageSquare size={18} /> },
    { id: 'connect', label: 'Databases', icon: <Database size={18} /> },
    { id: 'upload', label: 'Upload Data', icon: <UploadCloud size={18} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <div style={{
      width: collapsed ? '72px' : '260px',
      height: '100vh',
      backgroundColor: 'var(--bg-card)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      padding: 'var(--space-2)',
      justifyContent: 'space-between',
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      zIndex: 10
    }}>
      {/* Top Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        
        {/* Logo and Collapse Button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: '6px'
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '18px' }}>
              <Sparkles size={20} style={{ color: 'var(--color-primary)' }} />
              <span>QueryChat <span style={{ color: '#A78BFA' }}>AI</span></span>
            </div>
          )}
          <button 
            onClick={toggleSidebar}
            className="btn btn-text"
            style={{ padding: '6px', borderRadius: '8px', minWidth: 'unset' }}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* New Chat Button */}
        <button 
          onClick={onNewChat}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: collapsed ? '12px' : '12px 16px',
            borderRadius: 'var(--radius-md)',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '12px',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}
        >
          <PlusCircle size={18} />
          {!collapsed && <span>New Chat</span>}
        </button>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: collapsed ? '12px' : '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: isActive ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                className="nav-item-btn"
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
                
                {/* Active side indicator */}
                {isActive && !collapsed && (
                  <div style={{
                    position: 'absolute',
                    right: '8px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)'
                  }}></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        
        {/* Connection status indicator */}
        {!collapsed && isConnected && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.05)',
            border: '1px solid rgba(34, 197, 94, 0.15)',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--color-success)'
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)', boxShadow: '0 0 8px var(--color-success)' }}></div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Connected: <strong>{activeDbName}</strong>
            </div>
          </div>
        )}

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="btn btn-secondary"
          style={{
            width: '100%',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '12px',
            padding: '10px',
            borderRadius: '10px'
          }}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* User Profile */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px',
          borderTop: '1px solid var(--border-color)',
          marginTop: '6px',
          justifyContent: collapsed ? 'center' : 'flex-start'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            border: '1px solid rgba(124, 58, 237, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#C084FC'
          }}>
            <User size={18} />
          </div>
          {!collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Soumya</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>soumya@querychat.ai</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
