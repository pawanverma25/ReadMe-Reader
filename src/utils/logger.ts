import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const LOG_FILE_NAME = 'readme_crash_logs.txt';

const getLogFilePath = (): string => {
  const dir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
  return `${dir}${LOG_FILE_NAME}`;
};

let writeQueue: Promise<void> = Promise.resolve();

const appendToLogFile = (logEntry: string): Promise<void> => {
  writeQueue = writeQueue.then(async () => {
    try {
      const filePath = getLogFilePath();
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      let existingContent = '';
      if (fileInfo.exists) {
        existingContent = await FileSystem.readAsStringAsync(filePath, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }
      const combined = existingContent + logEntry;
      // Keep last 150 KB to prevent unbounded file growth while keeping recent logs
      const truncated = combined.length > 150000 ? combined.slice(-120000) : combined;
      await FileSystem.writeAsStringAsync(filePath, truncated, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } catch (err) {
      // Avoid recursive crash
    }
  });
  return writeQueue;
};

export const logError = async (context: string, error?: any): Promise<void> => {
  try {
    const timestamp = new Date().toISOString();
    let errDetails = 'No details';

    if (error) {
      if (error instanceof Error) {
        errDetails = `${error.name}: ${error.message}\nStack: ${error.stack || 'No stack'}`;
      } else if (typeof error === 'string') {
        errDetails = error;
      } else {
        try {
          errDetails = JSON.stringify(error, Object.getOwnPropertyNames(error));
        } catch {
          errDetails = String(error);
        }
      }
    }

    const logEntry = `[${timestamp}] [${context}]\n${errDetails}\n----------------------------------------\n`;
    await appendToLogFile(logEntry);
  } catch (e) {
    // Silent fail to avoid loop
  }
};

let isCrashLoggingInitialized = false;

export const setupGlobalCrashLogging = (): void => {
  if (isCrashLoggingInitialized) return;
  isCrashLoggingInitialized = true;

  // React Native Global Error Handler (Fatal / Uncaught Exceptions)
  const globalAny = globalThis as any;
  if (globalAny && globalAny.ErrorUtils) {
    const originalHandler = globalAny.ErrorUtils.getGlobalHandler();
    globalAny.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
      const tag = isFatal ? 'FATAL APP CRASH' : 'UNCAUGHT EXCEPTION';
      logError(tag, error);
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  }

  // Intercept console.error to record runtime redbox errors and library failures
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    originalConsoleError(...args);
    try {
      const msg = args
        .map((a) => {
          if (a instanceof Error) return `${a.name}: ${a.message}\n${a.stack}`;
          if (typeof a === 'object') {
            try {
              return JSON.stringify(a);
            } catch {
              return String(a);
            }
          }
          return String(a);
        })
        .join(' ');

      if (
        !msg.includes('Failed to write crash log') &&
        !msg.includes('readme_crash_logs')
      ) {
        logError('Runtime Console Error', msg);
      }
    } catch (_) {}
  };

  // Unhandled promise rejections
  if (typeof globalAny.onunhandledrejection !== 'undefined') {
    globalAny.onunhandledrejection = (event: any) => {
      logError('Unhandled Promise Rejection', event?.reason || event);
    };
  }
};

export const getCrashLogs = async (): Promise<string> => {
  try {
    const filePath = getLogFilePath();
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (!fileInfo.exists) {
      return 'No crash logs recorded yet. ReadMe is running cleanly!';
    }
    return await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (error: any) {
    return `Error reading crash logs: ${error?.message || 'Unknown error'}`;
  }
};

export const clearCrashLogs = async (): Promise<void> => {
  try {
    const filePath = getLogFilePath();
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(filePath);
    }
  } catch (error) {
    console.error('Failed to clear crash logs:', error);
  }
};

export const exportCrashLogs = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const filePath = getLogFilePath();
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (!fileInfo.exists) {
      await logError('System Initialization', 'Crash log exported');
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/plain',
        dialogTitle: 'Export ReadMe Crash Logs',
        UTI: 'public.plain-text',
      });
      return { success: true };
    } else {
      return { success: false, error: 'Sharing is not available on this device' };
    }
  } catch (error: any) {
    console.error('Failed to export crash logs:', error);
    return { success: false, error: error?.message || 'Failed to share crash log file' };
  }
};
