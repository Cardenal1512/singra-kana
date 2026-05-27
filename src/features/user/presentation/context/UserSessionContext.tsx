import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { GetCurrentUserUseCase } from '@/src/features/user/application/useCases/GetCurrentUserUseCase';
import { LoginWithPinUseCase } from '@/src/features/user/application/useCases/LoginWithPinUseCase';
import { LogoutUseCase } from '@/src/features/user/application/useCases/LogoutUseCase';
import { SetCurrentUserUseCase } from '@/src/features/user/application/useCases/SetCurrentUserUseCase';
import { UpdateUserProfileUseCase } from '@/src/features/user/application/useCases/UpdateUserProfileUseCase';
import { UpdateUserSettingsUseCase } from '@/src/features/user/application/useCases/UpdateUserSettingsUseCase';
import type { UpdateUserProfileInput } from '@/src/features/user/domain/models/AppUser';
import type { PinLoginResult } from '@/src/features/user/domain/models/PinLogin';
import type { UpdateUserSettingsInput } from '@/src/features/user/domain/models/UserSettings';
import type { UserSession } from '@/src/features/user/domain/models/UserSession';
import type { LocalUserSessionStorage } from '@/src/features/user/domain/ports/LocalUserSessionStorage';
import type { PinAuthRepository } from '@/src/features/user/domain/repositories/PinAuthRepository';
import type { UserRepository } from '@/src/features/user/domain/repositories/UserRepository';
import type { UserSettingsRepository } from '@/src/features/user/domain/repositories/UserSettingsRepository';

type UserSessionContextValue = {
  currentUser?: UserSession['user'];
  settings?: UserSession['settings'];
  isFallback: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithPin: (pin: string, username?: string) => Promise<PinLoginResult>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setCurrentUser: (userId: string) => Promise<void>;
  updateProfile: (input: UpdateUserProfileInput) => Promise<void>;
  updateSettings: (input: UpdateUserSettingsInput) => Promise<void>;
};

type UserSessionProviderProps = {
  children: ReactNode;
  localUserSessionStorage: LocalUserSessionStorage;
  pinAuthRepository: PinAuthRepository;
  userRepository: UserRepository;
  userSettingsRepository: UserSettingsRepository;
};

const UserSessionContext = createContext<UserSessionContextValue | undefined>(undefined);

export function UserSessionProvider({
  children,
  localUserSessionStorage,
  pinAuthRepository,
  userRepository,
  userSettingsRepository,
}: UserSessionProviderProps) {
  const [session, setSession] = useState<UserSession | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = useCallback(async () => {
    setIsLoading(true);

    try {
      const useCase = new GetCurrentUserUseCase(
        userRepository,
        userSettingsRepository,
        localUserSessionStorage,
      );
      setSession(await useCase.execute());
    } finally {
      setIsLoading(false);
    }
  }, [localUserSessionStorage, userRepository, userSettingsRepository]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);

      try {
        const useCase = new GetCurrentUserUseCase(
          userRepository,
          userSettingsRepository,
          localUserSessionStorage,
        );
        const nextSession = await useCase.execute();

        if (isMounted) {
          setSession(nextSession);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [localUserSessionStorage, userRepository, userSettingsRepository]);

  const value = useMemo<UserSessionContextValue>(() => {
    return {
      currentUser: session?.user,
      settings: session?.settings,
      isFallback: session?.isFallback ?? false,
      isAuthenticated: Boolean(session),
      isLoading,
      loginWithPin: async (pin: string, username = 'adri') => {
        const useCase = new LoginWithPinUseCase(pinAuthRepository, localUserSessionStorage);
        const result = await useCase.execute({ username, pin });

        if (result.success) {
          await loadSession();
        }

        return result;
      },
      logout: async () => {
        const useCase = new LogoutUseCase(localUserSessionStorage);
        await useCase.execute();
        setSession(undefined);
      },
      refresh: loadSession,
      setCurrentUser: async (userId: string) => {
        const useCase = new SetCurrentUserUseCase(localUserSessionStorage);
        await useCase.execute(userId);
        await loadSession();
      },
      updateProfile: async (input: UpdateUserProfileInput) => {
        if (!session) {
          return;
        }

        const useCase = new UpdateUserProfileUseCase(userRepository);
        const user = await useCase.execute(session.user.id, input);
        setSession((current) => current ? { ...current, user } : current);
      },
      updateSettings: async (input: UpdateUserSettingsInput) => {
        if (!session) {
          return;
        }

        const useCase = new UpdateUserSettingsUseCase(userSettingsRepository);
        const settings = await useCase.execute(session.user.id, input);
        setSession((current) => current ? { ...current, settings } : current);
      },
    };
  }, [
    isLoading,
    loadSession,
    localUserSessionStorage,
    pinAuthRepository,
    session,
    userRepository,
    userSettingsRepository,
  ]);

  return createElement(UserSessionContext.Provider, { value }, children);
}

export function useUserSession() {
  const context = useContext(UserSessionContext);

  if (!context) {
    throw new Error('useUserSession must be used inside UserSessionProvider');
  }

  return context;
}
