import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { LocalUserSession } from '@/src/features/user/domain/models/LocalUserSession';
import type { LocalUserSessionStorage } from '@/src/features/user/domain/ports/LocalUserSessionStorage';

const currentUserIdKey = 'singra-kana-current-user-id';
const currentUsernameKey = 'singra-kana-current-username';
const currentDisplayNameKey = 'singra-kana-current-display-name';

export class ExpoLocalUserSessionStorage implements LocalUserSessionStorage {
  async getCurrentSession() {
    const currentUserId = await this.getCurrentUserId();

    if (!currentUserId) {
      return undefined;
    }

    return {
      currentUserId,
      username: await this.read(currentUsernameKey) ?? 'adri',
      displayName: await this.read(currentDisplayNameKey) ?? 'Adri',
    };
  }

  async setCurrentSession(session: LocalUserSession) {
    await Promise.all([
      this.write(currentUserIdKey, session.currentUserId),
      this.write(currentUsernameKey, session.username),
      this.write(currentDisplayNameKey, session.displayName),
    ]);
  }

  async getCurrentUserId() {
    return this.read(currentUserIdKey);
  }

  async setCurrentUserId(userId: string) {
    await this.write(currentUserIdKey, userId);
  }

  async clearCurrentSession() {
    await Promise.all([
      this.remove(currentUserIdKey),
      this.remove(currentUsernameKey),
      this.remove(currentDisplayNameKey),
    ]);
  }

  async clearCurrentUserId() {
    await this.clearCurrentSession();
  }

  private async read(key: string) {
    try {
      if (await canUseSecureStore()) {
        return await SecureStore.getItemAsync(key) ?? undefined;
      }

      return await AsyncStorage.getItem(key) ?? undefined;
    } catch {
      return readFromLocalStorage(key);
    }
  }

  private async write(key: string, value: string) {
    try {
      if (await canUseSecureStore()) {
        await SecureStore.setItemAsync(key, value);
        return;
      }

      await AsyncStorage.setItem(key, value);
    } catch {
      writeToLocalStorage(key, value);
    }
  }

  private async remove(key: string) {
    try {
      if (await canUseSecureStore()) {
        await SecureStore.deleteItemAsync(key);
        return;
      }

      await AsyncStorage.removeItem(key);
    } catch {
      removeFromLocalStorage(key);
    }
  }
}

async function canUseSecureStore() {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

function readFromLocalStorage(key: string) {
  try {
    return globalThis.localStorage?.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

function writeToLocalStorage(key: string, value: string) {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // Session persistence is best effort; in-memory fallback happens through the default user.
  }
}

function removeFromLocalStorage(key: string) {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    // Session persistence is best effort.
  }
}
