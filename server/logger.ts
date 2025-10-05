import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino(
  isProduction
    ? // Production config: JSON logs
      {
        level: 'info',
      }
    : // Development config: pretty logs
      {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
        level: 'info',
      }
);

export default logger;