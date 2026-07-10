import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import ConnectionScreen from './components/ConnectionScreen';
import UploadScreen from './components/UploadScreen';
import AnalyticsScreen from './components/AnalyticsScreen';
import SettingsScreen from './components/SettingsScreen';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [view, setView] = useState('landing'); // 'landing', 'chat', 'connect', 'upload', 'analytics', 'settings'
  const [isConnected, setIsConnected] = useState(false);
  const [dbName, setDbName] = useState('');
  const [dbType, setDbType] = useState('');
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // Read API Key from LocalStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    if (savedKey) {
      setApiKey(savedKey);
    }

    // Check active connection status from backend
    const checkConnection = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/connection-status`);
        if (response.ok) {
          const data = await response.json();
          if (data.db_type) {
            setIsConnected(true);
            setDbType(data.db_type);
            setDbName(data.db_type === 'mysql' ? data.mysql_config.database : data.sqlite_path);
          }
        }
      } catch (e) {
        console.error("Failed to connect to backend api:", e);
      }
    };
    checkConnection();
  }, []);

  // Handler for New Chat button
  const handleNewChat = () => {
    setMessages([]);
    setView('chat');
  };

  // Handler to auto connect SQLite for Demo Mode
  const handleTryDemo = async () => {
    setIsGenerating(true);
    setView('chat');
    
    // Add introductory greeting
    setMessages([
      { sender: 'assistant', text: "Hello! I've connected to the SQLite Demo Database. Ask me anything about Products, Customers, Regions, or Budgets!" }
    ]);

    try {
      const response = await fetch(`${API_BASE}/api/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          db_type: 'sqlite',
          sqlite_path: 'querychat_demo.db'
        })
      });

      if (response.ok) {
        setIsConnected(true);
        setDbType('sqlite');
        setDbName('querychat_demo.db');
      } else {
        console.error("Failed to connect to demo database.");
      }
    } catch (e) {
      console.error("Demo connection network error:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler for successful manual database connection
  const handleConnectionSuccess = (connInfo) => {
    setIsConnected(true);
    setDbType(connInfo.db_type);
    setDbName(connInfo.db_name);
    setView('chat');
    setMessages([
      { sender: 'assistant', text: `Successfully connected to database '${connInfo.db_name}'! What would you like to query?` }
    ]);
  };

  // Handler for sending natural language message
  const handleSendMessage = async (text) => {
    // 1. Add user message
    const newMessages = [...messages, { sender: 'user', text }];
    setMessages(newMessages);
    setIsGenerating(true);

    try {
      // Send chat request to backend
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Gemini-API-Key': apiKey // send active API Key in header
        },
        body: JSON.stringify({ message: text })
      });

      const data = await response.json();
      setIsGenerating(false);

      if (response.ok) {
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: data.success 
            ? `Query executed successfully in ${data.duration_ms.toFixed(1)} ms!` 
            : "Oops! Database query execution failed.",
          responsePayload: data
        }]);
      } else {
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: `Error: ${data.detail || "An unexpected error occurred."}`
        }]);
      }
    } catch (e) {
      setIsGenerating(false);
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: `Network Error: Could not connect to API server (${e.message}).`
      }]);
    }
  };

  // Render current dashboard viewport
  const renderMainContent = () => {
    switch (view) {
      case 'landing':
        return (
          <LandingPage 
            onTryDemo={handleTryDemo} 
            onConnectDB={() => setView('connect')} 
          />
        );
      case 'chat':
        return (
          <ChatArea 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            isGenerating={isGenerating} 
            isConnected={isConnected} 
            onNavigateToConnect={() => setView('connect')} 
          />
        );
      case 'connect':
        return (
          <ConnectionScreen 
            currentStatus={{ isConnected, dbName, dbType }} 
            onConnectionSuccess={handleConnectionSuccess} 
          />
        );
      case 'upload':
        return (
          <UploadScreen 
            isConnected={isConnected} 
            onUploadSuccess={() => console.log("Upload completed")} 
          />
        );
      case 'analytics':
        return <AnalyticsScreen />;
      case 'settings':
        return (
          <SettingsScreen 
            initialApiKey={apiKey} 
            onSaveSettings={(settings) => {
              setApiKey(settings.apiKey);
              alert("Settings updated!");
            }} 
          />
        );
      default:
        return <LandingPage onTryDemo={handleTryDemo} onConnectDB={() => setView('connect')} />;
    }
  };

  // Layout structure based on view selection (Landing vs Dashboard panel)
  if (view === 'landing') {
    return (
      <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', width: '100vw' }}>
        {renderMainContent()}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-primary)' }}>
      {/* Dashboard Sidebar */}
      <Sidebar 
        activeView={view} 
        onViewChange={(newView) => setView(newView)} 
        onNewChat={handleNewChat} 
        isConnected={isConnected} 
        activeDbName={dbName} 
      />
      
      {/* Dashboard Main Viewport */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {renderMainContent()}
      </div>
    </div>
  );
}
