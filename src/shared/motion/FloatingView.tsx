import type { ReactNode } from 'react';

type FloatingViewProps = {
  children: ReactNode;
};

export function FloatingView({ children }: FloatingViewProps) {
  return <>{children}</>;
}
