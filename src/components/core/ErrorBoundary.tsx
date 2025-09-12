import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; err?: any };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: any): State {
    return { hasError: true, err };
  }

  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error("💥 ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <div className="max-w-2xl mx-auto border rounded-lg p-4 bg-red-50">
            <h2 className="text-lg font-semibold text-red-700">Something went wrong</h2>
            <p className="text-sm text-red-800 mt-1">
              An error occurred while rendering the app. Open the browser console for details.
            </p>
            {this.state.err?.message && (
              <pre className="mt-3 text-xs bg-white p-2 rounded border overflow-x-auto">
                {String(this.state.err.message)}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
