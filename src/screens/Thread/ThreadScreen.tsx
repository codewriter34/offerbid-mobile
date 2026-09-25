import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  AppState,
} from 'react-native';
import {RootStackScreenProps} from '../../types/navigation';
import {useThread} from '../../hooks/useThread';
import {useChatRealtime} from '../../hooks/useChatRealtime';
import {decryptMessage} from '../../services/chatService';
import {openWhatsAppUrl} from '../../services/whatsappBridge';
import {MessageBubble} from '../../components/MessageBubble';
import {LoadingSpinner} from '../../components/LoadingSpinner';
import {ErrorView} from '../../components/ErrorView';
import {useAuthStore} from '../../store/authStore';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';
import {formatPrice} from '../../utils/formatters';
import {MessageDto} from '../../types';

type Props = RootStackScreenProps<'Thread'>;

export const ThreadScreen: React.FC<Props> = ({route, navigation}) => {
  const {conversationId} = route.params;
  const currentUserId = useAuthStore(s => s.user?.id);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList>(null);

  const {
    conversation,
    messages,
    isLoading,
    isSending,
    error,
    cooldownMessage,
    hasMoreOlder,
    send,
    markRead,
    loadOlderMessages,
    appendIncomingMessage,
  } = useThread(conversationId);

  const whatsappUrl = conversation?.peer.whatsappUrl;

  const handleIncoming = useCallback(
    async (message: MessageDto) => {
      const plaintext = await decryptMessage(message);
      appendIncomingMessage({...message, plaintext});
      markRead();
    },
    [appendIncomingMessage, markRead],
  );

  useChatRealtime(conversationId, handleIncoming);

  useEffect(() => {
    markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, messages.length]);

  // Re-mark-as-read when the app comes back to the foreground while the
  // thread is open, per the API contract ("call on mount + app foreground
  // while open").
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') markRead();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const handleSend = async () => {
    const text = draft;
    if (!text.trim()) return;
    setDraft('');
    const ok = await send(text);
    if (ok) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({animated: true}));
    } else {
      setDraft(text);
    }
  };

  if (isLoading && messages.length === 0) {
    return <LoadingSpinner message="Loading conversation..." />;
  }

  if (error && !conversation) {
    return <ErrorView message={error} onRetry={() => navigation.goBack()} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        {conversation && (
          <TouchableOpacity
            style={styles.headerInfo}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('ListingDetail', {listingId: conversation.listing.id})
            }>
            {conversation.listing.image ? (
              <Image source={{uri: conversation.listing.image}} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerAvatar, styles.headerAvatarFallback]}>
                <Text style={styles.headerAvatarFallbackText}>
                  {conversation.peer.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                </Text>
              </View>
            )}
            <View style={styles.headerTextBlock}>
              <Text style={styles.headerName} numberOfLines={1}>
                {conversation.peer.fullName}
                {conversation.peer.isVerified ? ' ✓' : ''}
              </Text>
              <Text style={styles.headerListing} numberOfLines={1}>
                {conversation.listing.title} ·{' '}
                {formatPrice(conversation.listing.askingPrice, conversation.listing.currency)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        {whatsappUrl && (
          <TouchableOpacity
            style={styles.whatsappBtn}
            onPress={() => openWhatsAppUrl(whatsappUrl)}>
            <Text style={styles.whatsappBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}
      {cooldownMessage && (
        <View style={styles.cooldownBanner}>
          <Text style={styles.cooldownBannerText}>{cooldownMessage}</Text>
        </View>
      )}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <MessageBubble message={item} isOwnMessage={item.senderId === currentUserId} />
        )}
        contentContainerStyle={styles.listContent}
        onScroll={({nativeEvent}) => {
          if (nativeEvent.contentOffset.y < 40 && hasMoreOlder) {
            loadOlderMessages();
          }
        }}
        scrollEventThrottle={200}
        onContentSizeChange={() => {
          // Best-effort: keep the view pinned near the bottom on first load.
        }}
      />

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Message..."
          placeholderTextColor={colors.text.light}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!draft.trim() || isSending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!draft.trim() || isSending}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingTop: spacing.xxl,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {marginRight: spacing.sm},
  backBtnText: {...typography.body, color: colors.gradientStart},
  headerInfo: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    backgroundColor: colors.border,
  },
  headerAvatarFallback: {justifyContent: 'center', alignItems: 'center'},
  headerAvatarFallbackText: {...typography.bodySmall, color: colors.text.secondary},
  headerTextBlock: {flex: 1},
  headerName: {...typography.body, fontWeight: '700', color: colors.text.primary},
  headerListing: {...typography.caption, color: colors.text.secondary},
  whatsappBtn: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: '#25D36620',
  },
  whatsappBtnText: {...typography.caption, color: '#128C7E', fontWeight: '700'},
  errorBanner: {backgroundColor: colors.error + '20', padding: spacing.sm},
  errorBannerText: {...typography.bodySmall, color: colors.error, textAlign: 'center'},
  cooldownBanner: {backgroundColor: colors.warning + '20', padding: spacing.sm},
  cooldownBannerText: {...typography.bodySmall, color: colors.warning, textAlign: 'center'},
  listContent: {paddingVertical: spacing.md},
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sendBtnDisabled: {backgroundColor: colors.disabled},
  sendBtnText: {...typography.button, color: colors.black},
});
