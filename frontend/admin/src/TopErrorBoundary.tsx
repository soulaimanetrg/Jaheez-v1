import React, { Component, type ReactNode } from 'react';

export class TopErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'sans-serif', color: '#c2410c', backgroundColor: '#fffaf8', minHeight: '100vh' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Top-Level React Crash</h2>
          <div style={{ padding: 16, backgroundColor: '#fed7aa', borderRadius: 8, color: '#7c2d12', fontWeight: 600, marginBottom: 16 }}>
            {this.state.error.message}
          </div>
          <pre style={{ background: '#fef3c7', padding: 16, borderRadius: 8, fontSize: 13, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
