import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-crisis-800 border border-red-500/30 rounded-xl text-center space-y-3 m-4">
          <p className="text-red-400 font-bold text-sm">Ocurrió un error cargando este componente.</p>
          <p className="text-xs text-slate-400">{this.state.error?.message}</p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition"
          >
            Recargar Vista
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
