export interface DiagnosticItem {
  id: string;
  status: 'OK' | 'WARNING' | 'ERROR';
  message: string;
}

export interface MetricDiagnostics {
  permissions: {
      user: boolean;
      app: boolean;
  };
  metrics: DiagnosticItem[];
  timestamp: string;
}
