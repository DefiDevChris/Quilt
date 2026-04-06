type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function emit(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (IS_PRODUCTION) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };
    // Structured JSON for log aggregation (CloudWatch, Datadog, etc.)
    const json = JSON.stringify(entry);
    if (level === 'error') {
      process.stderr.write(json + '\n');
    } else {
      process.stdout.write(json + '\n');
    }
  } else {
    const prefix = `[${level.toUpperCase()}]`;
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(prefix, message, context ?? '');
  }
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>) {
    if (!IS_PRODUCTION) emit('debug', message, context);
  },
  info(message: string, context?: Record<string, unknown>) {
    emit('info', message, context);
  },
  warn(message: string, context?: Record<string, unknown>) {
    emit('warn', message, context);
  },
  error(message: string, context?: Record<string, unknown>) {
    emit('error', message, context);
  },
};
