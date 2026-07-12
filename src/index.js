import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: '#006064', color: '#fff', fontFamily: 'sans-serif', textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 48 }}>🦀</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Something went wrong.</div>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '12px 28px', borderRadius: 50, border: 'none', background: '#FF8A71', color: '#002D2F', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}
          >
            Reload Kani Do
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
