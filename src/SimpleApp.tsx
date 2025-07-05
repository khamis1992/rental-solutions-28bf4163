import React from 'react';

// Simple test component to check if basic React rendering works
const SimpleApp = () => {
  console.log('🚀 SimpleApp component rendering...');
  
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      background: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333' }}>🔧 App Diagnostic Test</h1>
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h2>Environment Variables Test:</h2>
        <p><strong>VITE_SUPABASE_URL:</strong> {import.meta.env.VITE_SUPABASE_URL || '❌ Not found'}</p>
        <p><strong>VITE_SUPABASE_ANON_KEY:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Not found'}</p>
        
        <h3>All Environment Variables:</h3>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '4px',
          fontSize: '12px',
          overflow: 'auto'
        }}>
          {JSON.stringify(import.meta.env, null, 2)}
        </pre>
        
        <h3>Status:</h3>
        {import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY ? (
          <div style={{ color: 'green' }}>✅ Environment variables are loaded correctly!</div>
        ) : (
          <div style={{ color: 'red' }}>❌ Environment variables are missing!</div>
        )}
      </div>
    </div>
  );
};

export default SimpleApp; 