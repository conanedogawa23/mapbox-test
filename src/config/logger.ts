import winston from 'winston';
import path from 'path';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Logger configuration
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'mapbox-utility-service' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, stack }: { timestamp: string, level: string, message: string, stack?: string }) => {
          return `${timestamp} [${level}]: ${message}${stack ? `\n${stack}` : ''}`;
        })
      )
    },
    
    // File transport for errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // File transport for combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
  ],
  
  // Handle unhandled rejections and exceptions
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log') 
    })
  ],
  
  // Exit the process after logging unhandled exceptions
  exitOnError: false
});

// Additional method for audit logging
export const auditLogger = logger.child({ type: 'audit' });