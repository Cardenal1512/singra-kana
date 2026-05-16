import type { ReactNode } from 'react';
import { View } from 'react-native';

type MotionProps = {
  children: ReactNode;
};

export function MotionStagger({ children }: MotionProps) {
  return <View>{children}</View>;
}

export function MotionItem({ children }: MotionProps) {
  return <View>{children}</View>;
}
