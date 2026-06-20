import React, { Component } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="bg-white border border-rose-100 rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertOctagon size={32} className="animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              {this.state.error?.message || 'An unexpected client-side application error occurred.'}
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center justify-center space-x-2 py-3 px-6 w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold rounded-2xl shadow-lg transition duration-200"
            >
              <RefreshCw size={18} />
              <span>Retry and Refresh</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
