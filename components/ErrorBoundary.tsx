import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("SuperAI view crashed", error, info.componentStack);
  }

  handleReset = (): void => {
    this.setState({ hasError: false });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <div className="max-w-md glass rounded-3xl p-8 border border-red-400/20">
          <div className="text-4xl" aria-hidden="true">
            ⚠️
          </div>
          <h2 className="mt-4 text-xl font-black text-white">
            Bu sahifada xatolik yuz berdi
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Ma'lumotlaringiz saqlanib qoldi. Sahifani qayta tiklab ko'ring.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition"
          >
            Qayta tiklash
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
