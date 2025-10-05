import pino from 'pino';

// This is a more robust way to detect if the code is running on Netlify
const isNetlify = process.env.NETLIFY === 'true';

const logger = pino(
  isNetlify
    ? // In any Netlify environment (production, previews, etc.), use JSON logs.
      {
        level: 'info',
      }
    : // For local development, use pino-pretty.
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
