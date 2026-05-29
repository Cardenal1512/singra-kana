import { Audio, type AVPlaybackSource } from 'expo-av';

export type SoundKey = 'tap' | 'success' | 'error' | 'popup' | 'whoosh';
export type MusicKey = 'kanaWrite' | 'menuLoop' | 'statistics';

type AudioServiceConfig = {
  enabled?: boolean;
  volume?: number;
};

type MusicServiceConfig = AudioServiceConfig & {
  loop?: boolean;
};

const soundSources: Record<SoundKey, AVPlaybackSource> = {
  tap: require('@/assets/sounds/tap.wav'),
  success: require('@/assets/sounds/success.wav'),
  error: require('@/assets/sounds/error.wav'),
  popup: require('@/assets/sounds/popup.wav'),
  whoosh: require('@/assets/sounds/whoosh.wav'),
};

const musicSources: Record<MusicKey, AVPlaybackSource> = {
  kanaWrite: require('@/assets/audio/kana-write.mp3'),
  menuLoop: require('@/assets/audio/menu-loop.mp3'),
  statistics: require('@/assets/audio/stadistics.mp3'),
};

class AudioService {
  private enabled = true;
  private hasConfiguredAudioMode = false;
  private loadingPromises = new Map<SoundKey, Promise<Audio.Sound>>();
  private sounds = new Map<SoundKey, Audio.Sound>();
  private volume = 0.38;

  configure({ enabled, volume }: AudioServiceConfig) {
    if (typeof enabled === 'boolean') {
      this.enabled = enabled;
    }

    if (typeof volume === 'number') {
      this.volume = Math.max(0, Math.min(1, volume));
      this.sounds.forEach((sound) => {
        void sound.setVolumeAsync(this.volume).catch(() => undefined);
      });
    }
  }

  async preloadAll() {
    if (!this.enabled) {
      return;
    }

    await this.configureAudioMode();
    await Promise.all((Object.keys(soundSources) as SoundKey[]).map((key) => this.preload(key)));
  }

  async preload(key: SoundKey) {
    const cachedSound = this.sounds.get(key);

    if (cachedSound) {
      return cachedSound;
    }

    const existingLoad = this.loadingPromises.get(key);

    if (existingLoad) {
      return existingLoad;
    }

    const loadPromise = Audio.Sound.createAsync(soundSources[key], {
      shouldPlay: false,
      volume: this.volume,
    }).then(({ sound }) => {
      this.sounds.set(key, sound);
      this.loadingPromises.delete(key);
      return sound;
    }).catch((error) => {
      this.loadingPromises.delete(key);
      throw error;
    });

    this.loadingPromises.set(key, loadPromise);
    return loadPromise;
  }

  async playSound(key: SoundKey, config?: AudioServiceConfig) {
    if (config) {
      this.configure(config);
    }

    if (!this.enabled) {
      return;
    }

    try {
      await this.configureAudioMode();
      const sound = await this.preload(key);
      await sound.setVolumeAsync(this.volume);
      await sound.replayAsync();
    } catch (error) {
      console.warn('[audio] Unable to play sound', { key, error });
    }
  }

  async unloadAll() {
    const sounds = Array.from(this.sounds.values());
    this.sounds.clear();
    this.loadingPromises.clear();
    await Promise.all(sounds.map((sound) => sound.unloadAsync().catch(() => undefined)));
  }

  private async configureAudioMode() {
    if (this.hasConfiguredAudioMode) {
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      staysActiveInBackground: false,
    });
    this.hasConfiguredAudioMode = true;
  }
}

export const audioService = new AudioService();

class MusicService {
  private currentKey?: MusicKey;
  private currentSound?: Audio.Sound;
  private enabled = true;
  private hasConfiguredAudioMode = false;
  private isLoading = false;
  private volume = 0.16;

  configure({ enabled, volume }: AudioServiceConfig) {
    if (typeof enabled === 'boolean') {
      this.enabled = enabled;
    }

    if (typeof volume === 'number') {
      this.volume = Math.max(0, Math.min(1, volume));
      void this.currentSound?.setVolumeAsync(this.volume).catch(() => undefined);
    }

    if (!this.enabled) {
      void this.stop();
    }
  }

  async playMusic(key: MusicKey, config?: MusicServiceConfig) {
    if (config) {
      this.configure(config);
    }

    if (!this.enabled || this.isLoading) {
      return;
    }

    try {
      await this.configureAudioMode();

      if (this.currentKey === key && this.currentSound) {
        const status = await this.currentSound.getStatusAsync();

        if (status.isLoaded && !status.isPlaying) {
          await this.currentSound.playAsync();
        }

        return;
      }

      this.isLoading = true;
      await this.currentSound?.unloadAsync().catch(() => undefined);
      const { sound } = await Audio.Sound.createAsync(musicSources[key], {
        isLooping: config?.loop ?? true,
        shouldPlay: true,
        volume: this.volume,
      });

      this.currentKey = key;
      this.currentSound = sound;
    } catch (error) {
      console.warn('[audio] Unable to play music', { key, error });
    } finally {
      this.isLoading = false;
    }
  }

  async stop() {
    const sound = this.currentSound;
    this.currentKey = undefined;
    this.currentSound = undefined;
    await sound?.unloadAsync().catch(() => undefined);
  }

  private async configureAudioMode() {
    if (this.hasConfiguredAudioMode) {
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      staysActiveInBackground: false,
    });
    this.hasConfiguredAudioMode = true;
  }
}

export const musicService = new MusicService();

export function playSound(key: SoundKey, config?: AudioServiceConfig) {
  void audioService.playSound(key, config);
}

export function playMusic(key: MusicKey, config?: MusicServiceConfig) {
  void musicService.playMusic(key, config);
}
