import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

type AppScreenProps = {
  background?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
};

type WebSafeAreaStyle = ViewStyle & {
  minHeight?: string;
  paddingBottom?: string;
  paddingTop?: string;
};

const webRootStyle = Platform.select<ViewStyle>({
  web: {
    minHeight: '100dvh',
  } as unknown as WebSafeAreaStyle,
});

const webHeaderStyle = Platform.select<ViewStyle>({
  web: {
    paddingTop: 'max(10px, env(safe-area-inset-top))',
  } as unknown as WebSafeAreaStyle,
});

const webFooterStyle = Platform.select<ViewStyle>({
  web: {
    paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
  } as unknown as WebSafeAreaStyle,
});

export function AppScreen({ background, children, footer, header }: AppScreenProps) {
  return (
    <View style={[styles.root, webRootStyle]}>
      {background}
      {header ? <View style={[styles.header, webHeaderStyle]}>{header}</View> : null}
      <View style={styles.content}>{children}</View>
      {footer ? <View style={[styles.footer, webFooterStyle]}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 10,
    position: 'relative',
    zIndex: 2,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 0,
    paddingHorizontal: 18,
    position: 'relative',
    zIndex: 1,
  },
  footer: {
    paddingBottom: 10,
    paddingHorizontal: 18,
    paddingTop: 8,
    position: 'relative',
    zIndex: 2,
  },
});
