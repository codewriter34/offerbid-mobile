import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {DecryptedMessage} from '../store/chatStore';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';
import {spacing, borderRadius} from '../theme/spacing';

interface MessageBubbleProps {
  message: DecryptedMessage;
  isOwnMessage: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({message, isOwnMessage}) => {
  const isPending = message.id.startsWith('pending-');
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.row, isOwnMessage ? styles.rowOwn : styles.rowPeer]}>
      <View
        style={[
          styles.bubble,
          isOwnMessage ? styles.bubbleOwn : styles.bubblePeer,
          isPending && styles.bubblePending,
        ]}>
        {message.plaintext === null ? (
          <Text style={[styles.text, styles.undecryptable]}>
            🔒 Unable to decrypt this message
          </Text>
        ) : (
          <Text style={[styles.text, isOwnMessage ? styles.textOwn : styles.textPeer]}>
            {message.plaintext}
          </Text>
        )}
        <Text style={[styles.time, isOwnMessage ? styles.timeOwn : styles.timePeer]}>
          {isPending ? 'Sending…' : time}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginVertical: spacing.xs / 2,
  },
  rowOwn: {justifyContent: 'flex-end'},
  rowPeer: {justifyContent: 'flex-start'},
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  bubbleOwn: {
    backgroundColor: colors.gradientStart,
    borderBottomRightRadius: 2,
  },
  bubblePeer: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubblePending: {
    opacity: 0.6,
  },
  text: {...typography.body},
  textOwn: {color: colors.white},
  textPeer: {color: colors.text.primary},
  undecryptable: {color: colors.text.light, fontStyle: 'italic'},
  time: {...typography.caption, marginTop: 2, alignSelf: 'flex-end'},
  timeOwn: {color: 'rgba(255,255,255,0.7)'},
  timePeer: {color: colors.text.light},
});
