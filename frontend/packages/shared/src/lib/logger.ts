export const logger = {
  info: (component: string, message: any, data?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      component,
      message,
      ...(data && { data }),
    };
    console.log(`[${logEntry.timestamp}] [${logEntry.level}] [${component}] ${message}`, data || '');

    // You can also send logs to the backend if needed
    // app.Log.Info(`[${component}] ${message} ${data ? JSON.stringify(data) : ''}`);
  },

  warn: (component: string, message: string, data?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      component,
      message,
      ...(data && { data }),
    };
    console.warn(`[${logEntry.timestamp}] [${logEntry.level}] [${component}] ${message}`, data || '');

    // app.Log.Warning(`[${component}] ${message} ${data ? JSON.stringify(data) : ''}`);
  },

  error: (component: string, message: string, error?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      component,
      message,
      ...(error && { error }),
    };
    console.error(`[${logEntry.timestamp}] [${logEntry.level}] [${component}] ${message}`, error || '');

    // app.Log.Error(`[${component}] ${message} ${error ? JSON.stringify(error) : ''}`);
  },
};
