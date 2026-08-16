import React, {useState, useEffect, useRef} from 'react';
import {Text, StyleSheet} from 'react-native';
import {colors} from '@shared/theme/colors';
import {typography} from '@shared/theme/typography';
import {formatCountdown} from '@shared/lib/formatters';

interface CountdownTimerProps {
  expiresAt: string;
  onExpired?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expiresAt,
  onExpired,
}) => {
  const [display, setDisplay] = useState(() => formatCountdown(expiresAt));
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;

    const tick = () => {
      const text = formatCountdown(expiresAt);
      setDisplay(text);
      if (text === 'Expired' && !expiredRef.current) {
        expiredRef.current = true;
        onExpired?.();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isUrgent =
    display !== 'Expired' &&
    !display.includes(':') === false &&
    (() => {
      const expiry = new Date(expiresAt).getTime();
      return expiry - Date.now() < 3600000;
    })();

  return (
    <Text
      style={[
        styles.timer,
        display === 'Expired'
          ? styles.expired
          : isUrgent
            ? styles.urgent
            : styles.normal,
      ]}>
      {display}
    </Text>
  );
};

const styles = StyleSheet.create({
  timer: {
    ...typography.bodySmall,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  normal: {
    color: colors.text.primary,
  },
  urgent: {
    color: colors.error,
  },
  expired: {
    color: colors.text.light,
  },
});
