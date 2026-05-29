import { useEffect, type ReactNode } from 'react';

import { useUserSession } from '@/src/features/user/presentation/context/UserSessionContext';
import { audioService, musicService } from '@/src/shared/audio/AudioService';

type AudioProviderProps = {
  children: ReactNode;
  musicVolume?: number;
  volume?: number;
};

export function AudioProvider({ children, musicVolume = 0.16, volume = 0.38 }: AudioProviderProps) {
  const { settings } = useUserSession();
  const soundEnabled = settings?.soundEnabled ?? true;
  const musicEnabled = settings?.musicEnabled ?? true;

  useEffect(() => {
    audioService.configure({ enabled: soundEnabled, volume });

    if (soundEnabled) {
      void audioService.preloadAll().catch((error) => {
        console.warn('[audio] Unable to preload sounds', error);
      });
    }
  }, [soundEnabled, volume]);

  useEffect(() => {
    musicService.configure({ enabled: musicEnabled, volume: musicVolume });
  }, [musicEnabled, musicVolume]);

  useEffect(() => {
    return () => {
      void audioService.unloadAll();
      void musicService.stop();
    };
  }, []);

  return children;
}
