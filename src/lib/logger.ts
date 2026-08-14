export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export const logger = {
  log: (level: LogLevel, message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...(meta && { meta }),
    };

    // In a production environment, you might send this to Sentry, Datadog, CloudWatch, etc.
    // For now, we output it to the console with structured formatting.
    const logString = JSON.stringify(logData);

    switch (level) {
      case 'info':
        console.info(logString);
        break;
      case 'warn':
        console.warn(logString);
        break;
      case 'error':
        console.error(logString);
        break;
      case 'debug':
        if (process.env.NODE_ENV !== 'production') {
          console.debug(logString);
        }
        break;
    }
  },

  info: (message: string, meta?: any) => logger.log('info', message, meta),
  warn: (message: string, meta?: any) => logger.log('warn', message, meta),
  error: (message: string, meta?: any) => logger.log('error', message, meta),
  debug: (message: string, meta?: any) => logger.log('debug', message, meta),
};
