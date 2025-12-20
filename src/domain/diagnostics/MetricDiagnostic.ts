export interface DiagnosticItem {
  id: string;
  status: 'OK' | 'WARNING' | 'ERROR';
  message: string;
}

export interface MetricDiagnostics {
  permissions: {
    canRead: boolean;
    canWrite: boolean;
  };
  metrics: DiagnosticItem[];
  timestamp: string;
}
