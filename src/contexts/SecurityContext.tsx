import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ScreenCapture from 'expo-screen-capture';
import { Lock, ShieldCheck } from 'lucide-react-native';

const STORAGE_KEYS = {
  APP_LOCK: '@readme_app_lock_enabled_v1',
  SECURE_SCREEN: '@readme_secure_screen_enabled_v1',
};

interface SecurityContextType {
  isAppLockEnabled: boolean;
  isSecureScreenEnabled: boolean;
  isUnlocked: boolean;
  toggleAppLock: (enabled: boolean) => Promise<boolean>;
  toggleSecureScreen: (enabled: boolean) => Promise<void>;
  authenticateWithSystem: () => Promise<boolean>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAppLockEnabled, setIsAppLockEnabled] = useState<boolean>(false);
  const [isSecureScreenEnabled, setIsSecureScreenEnabled] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Initialize Security Settings from AsyncStorage
  useEffect(() => {
    async function loadSecurityPrefs() {
      try {
        const lockVal = await AsyncStorage.getItem(STORAGE_KEYS.APP_LOCK);
        const secVal = await AsyncStorage.getItem(STORAGE_KEYS.SECURE_SCREEN);

        const lockEnabled = lockVal === 'true';
        const secureEnabled = secVal === 'true';

        setIsAppLockEnabled(lockEnabled);
        setIsSecureScreenEnabled(secureEnabled);

        if (secureEnabled) {
          await ScreenCapture.preventScreenCaptureAsync();
        }

        if (lockEnabled) {
          setIsUnlocked(false);
          // Auto prompt authentication on launch
          setTimeout(() => {
            promptSystemAuth();
          }, 300);
        } else {
          setIsUnlocked(true);
        }
      } catch (err) {
        console.error('Failed to load security preferences:', err);
      } finally {
        setIsLoaded(true);
      }
    }

    loadSecurityPrefs();
  }, []);

  // Listen to AppState (foreground / background switching)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (isAppLockEnabled) {
          setIsUnlocked(false);
        }
      } else if (nextAppState === 'active') {
        if (isAppLockEnabled && !isUnlocked) {
          promptSystemAuth();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [isAppLockEnabled, isUnlocked]);

  const promptSystemAuth = async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // Fallback if no biometric/PIN is enrolled on device
        setIsUnlocked(true);
        return true;
      }

      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock ReadMe',
        fallbackLabel: 'Use Device PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (res.success) {
        setIsUnlocked(true);
        return true;
      } else {
        setIsUnlocked(false);
        return false;
      }
    } catch (err) {
      console.error('System authentication error:', err);
      setIsUnlocked(true);
      return true;
    }
  };

  const toggleAppLock = async (enabled: boolean): Promise<boolean> => {
    if (enabled) {
      // Authenticate first before enabling
      const success = await promptSystemAuth();
      if (!success) return false;
    }

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_LOCK, String(enabled));
      setIsAppLockEnabled(enabled);
      if (!enabled) setIsUnlocked(true);
      return true;
    } catch (err) {
      console.error('Failed to save App Lock preference:', err);
      return false;
    }
  };

  const toggleSecureScreen = async (enabled: boolean): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SECURE_SCREEN, String(enabled));
      setIsSecureScreenEnabled(enabled);
      if (enabled) {
        await ScreenCapture.preventScreenCaptureAsync();
      } else {
        await ScreenCapture.allowScreenCaptureAsync();
      }
    } catch (err) {
      console.error('Failed to save Secure Screen preference:', err);
    }
  };

  return (
    <SecurityContext.Provider
      value={{
        isAppLockEnabled,
        isSecureScreenEnabled,
        isUnlocked,
        toggleAppLock,
        toggleSecureScreen,
        authenticateWithSystem: promptSystemAuth,
      }}
    >
      {children}

      {/* Global Native Lock Overlay Screen when App is Locked */}
      {isLoaded && isAppLockEnabled && !isUnlocked && (
        <View style={styles.lockOverlayContainer}>
          <View style={styles.lockContentBox}>
            <View style={styles.lockIconBg}>
              <Lock size={36} color="#EC407A" />
            </View>
            <Text style={styles.lockTitle}>ReadMe Locked</Text>
            <Text style={styles.lockSubtitle}>
              Authenticate using your device Fingerprint, Face ID, or PIN to continue.
            </Text>

            <TouchableOpacity
              style={styles.unlockBtn}
              onPress={() => promptSystemAuth()}
              activeOpacity={0.8}
            >
              <ShieldCheck size={20} color="#FFFFFF" />
              <Text style={styles.unlockBtnText}>Unlock with Device Security</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  lockOverlayContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0F1717',
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  lockContentBox: {
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
  },
  lockIconBg: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#201A27',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3E324C',
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F6F2FA',
    marginBottom: 8,
  },
  lockSubtitle: {
    fontSize: 13,
    color: '#ABA3B6',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 28,
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EC407A',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    gap: 10,
  },
  unlockBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
