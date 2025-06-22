import { LogService } from '@logger';

// Helper to serialize error objects for logging
function serializeError(error: any) {
  if (error instanceof Error) {
    // Standard Error object
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
  }
  // For other object-like errors
  if (typeof error === 'object' && error !== null) {
    return error;
  }
  // For primitive types
  return {
    value: String(error),
  };
}

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

    // Send logs to the backend
    LogService.Info(component, String(message), data ?? null).catch((err) => {
      console.error(`[logger] Failed to send INFO log to backend for component ${component}:`, err);
    });
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

    // Send logs to the backend
    LogService.Warn(component, message, data ?? null).catch((err) => {
      console.error(`[logger] Failed to send WARN log to backend for component ${component}:`, err);
    });
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

    // Send logs to the backend, ensuring error is serializable
    const data = error ? { error: serializeError(error) } : null;
    LogService.Error(component, message, data ?? null).catch((err) => {
      console.error(`[logger] Failed to send ERROR log to backend for component ${component}:`, err);
    });
  },
};
