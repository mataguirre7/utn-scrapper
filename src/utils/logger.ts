const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

export const logger = {
  log: (message: string, ...args: any[]) => {
    console.log(`${colors.cyan}[INFO]${colors.reset} ${message}`, ...args);
  },

  success: (message: string, ...args: any[]) => {
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`, ...args);
  },

  warn: (message: string, ...args: any[]) => {
    console.warn(`${colors.yellow}[WARN]${colors.reset} ${message}`, ...args);
  },

  error: (message: string, error?: any) => {
    console.error(`${colors.red}[ERROR]${colors.reset} ${message}`);
    if (error) {
      if (error instanceof Error) {
        console.error(`  ${colors.dim}${error.message}${colors.reset}`);
        if (error.stack) {
          console.error(`  ${colors.dim}${error.stack}${colors.reset}`);
        }
      } else {
        console.error(`  ${colors.dim}${JSON.stringify(error)}${colors.reset}`);
      }
    }
  },

  debug: (message: string, ...args: any[]) => {
    if (process.env.DEBUG_MODE === 'true') {
      console.log(`${colors.blue}[DEBUG]${colors.reset} ${message}`, ...args);
    }
  },
};

export default logger;
