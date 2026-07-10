import React from 'react';
import { Database, Play, Eye, MessageSquare, BarChart3, ShieldCheck, Download, Share2, Layers } from 'lucide-react';

export default function LandingPage({ onTryDemo, onConnectDB }) {
  return (
    <div className="landing-container animate-fade-in" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: 'var(--space-3)',
      maxWidth: '1200px',
      margin: '0 auto',
      gap: 'var(--space-5)'
    }}>
      {/* Hero Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: 'var(--space-4)',
        alignItems: 'center',
        marginTop: 'var(--space-4)',
        paddingTop: 'var(--space-3)'
      }} className="hero-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(124, 58, 237, 0.1)',
            border: '1px solid rgba(124, 58, 237, 0.2)',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '13px',
            color: '#A78BFA',
            alignSelf: 'flex-start',
            fontWeight: 500
          }}>
            <Layers size={14} /> Introducing QueryChat AI v1.0
          </div>
          <h1 style={{ fontSize: '56px', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            Chat with your <span style={{
              background: 'linear-gradient(to right, #60A5FA, #A78BFA)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Database</span> using AI
          </h1>
          <p style={{
            fontSize: '18px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '520px'
          }}>
            Ask questions in plain English and instantly receive SQL queries, interactive visualizations, and AI-generated insights from your database.
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
            marginTop: '10px'
          }}>
            <button onClick={onConnectDB} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={16} /> Connect Database
            </button>
            <button onClick={onTryDemo} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Play size={16} /> Try Demo
            </button>
            <button onClick={() => alert("Watch Demo: Visual walkthrough loading...")} className="btn btn-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={16} /> Watch Demo
            </button>
          </div>
        </div>

        {/* Visual Mockup */}
        <div style={{
          position: 'relative',
          padding: '12px',
          borderRadius: 'var(--radius-lg)',
          background: 'radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.15) 0%, rgba(124, 58, 237, 0.05) 90%)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--gradient-glow)'
        }} className="animate-float">
          {/* Mockup Chat Screen */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              background: '#1F2937',
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#EF4444' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#F59E0B' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22C55E' }}></div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '12px', fontFamily: 'monospace' }}>querychat_session.db</span>
            </div>
            
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '10px 14px',
                borderRadius: '12px',
                maxWidth: '85%',
                fontSize: '13px',
                alignSelf: 'flex-end',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                Show total bookings grouped by month.
              </div>
              
              <div style={{
                background: 'rgba(124,58,237,0.05)',
                padding: '12px 14px',
                borderRadius: '12px',
                maxWidth: '90%',
                fontSize: '13px',
                alignSelf: 'flex-start',
                border: '1px solid rgba(124,58,237,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ fontFamily: 'monospace', color: '#60A5FA', fontSize: '11px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                  SELECT DATE_FORMAT(booking_date, '%b') as Month, COUNT(*) as Bookings FROM bookings GROUP BY Month;
                </div>
                {/* Visual mini chart */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '60px', padding: '8px 0 2px' }}>
                  <div style={{ height: '40%', width: '14px', background: 'var(--gradient-primary)', borderRadius: '3px' }}></div>
                  <div style={{ height: '70%', width: '14px', background: 'var(--gradient-primary)', borderRadius: '3px' }}></div>
                  <div style={{ height: '50%', width: '14px', background: 'var(--gradient-primary)', borderRadius: '3px' }}></div>
                  <div style={{ height: '90%', width: '14px', background: 'var(--gradient-primary)', borderRadius: '3px' }}></div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  📊 Bookings peaked in April with 1,230 reservations.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h2 style={{ textAlign: 'center', fontWeight: 700 }}>Intelligent features for data analysts</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-2)'
        }}>
          {features.map((feat, i) => (
            <div key={i} className="glass-panel" style={{
              padding: '24px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                color: 'white',
                background: 'var(--gradient-primary)',
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(124,58,237,0.2)'
              }}>
                {feat.icon}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{feat.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: <MessageSquare size={18} />,
    title: 'Natural Language to SQL',
    desc: 'Input normal English sentences and receive clean, optimized SQL code generated by state-of-the-art LLMs.'
  },
  {
    icon: <Database size={18} />,
    title: 'Multi Database Support',
    desc: 'Seamlessly query SQLite, MySQL, PostgreSQL, SQL Server, and Oracle DB instances with simple config.'
  },
  {
    icon: <BarChart3 size={18} />,
    title: 'Interactive Charts',
    desc: 'Automatically transforms query results into beautiful Bar, Line, Pie, and Area charts.'
  },
  {
    icon: <Layers size={18} />,
    title: 'AI Insights',
    desc: 'Receives instant, clear explanations of what the queried data means in normal business terms.'
  },
  {
    icon: <Download size={18} />,
    title: 'Export Results',
    desc: 'Export structured data results directly to CSV, Excel, or copy raw SQL statements with one click.'
  },
  {
    icon: <ShieldCheck size={18} />,
    title: 'Secure Connections',
    desc: 'Queries execute locally. Credentials remain secured and never bypass safe server barriers.'
  }
];
