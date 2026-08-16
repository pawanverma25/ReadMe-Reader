import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const LOG_FILE_NAME = 'readme_crash_logs.txt';

const getLogFilePath = (): string => {
  const dir = FileSystem.documentDirectory || FileSystem.cacheDirectory || '';
  return `${dir}${LOG_FILE_NAME}`;
};

export const logError = async (context: string, error?: any): Promise<void> => {
  try {
    const filePath = getLogFilePath();
    const timestamp = new Date().toISOString();
    const errDetails = error
      ? typeof error === 'string'
        ? error
        : error.stack || error.message || JSON.stringify(error)
      : 'No stack trace';

    const logEntry = `[${timestamp}] [ERROR] ${context}\nDetails: ${errDetails}\n----------------------------------------\n`;

    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      const existingContent = await FileSystem.readAsStringAsync(filePath, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      // Keep last 100 KB to avoid uncontrolled log growth
      const truncated = existingContent.length > 100000 ? existingContent.slice(-80000) : existingContent;
      await FileSystem.writeAsStringAsync(filePath, truncated + logEntry, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } else {
      await FileSystem.writeAsStringAsync(filePath, logEntry, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }
  } catch (e) {
    console.error('Failed to write crash log entry:', e);
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
