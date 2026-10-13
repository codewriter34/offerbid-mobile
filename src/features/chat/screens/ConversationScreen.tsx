import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {RootStackScreenProps} from '@app/navigation/types';
import {useChat} from '@features/chat/useChat';
import {useRealtimeChat} from '@features/chat/useRealtimeChat';
import {ChatMessage, Conversation} from '@features/chat/chatTypes';
import {useAuthStore} from '@features/auth/authStore';
import {AvatarImage, MediaThumb} from '@shared/ui/CachedImage';
import {LoadingSpinner} from '@shared/ui/LoadingSpinner';
import {ErrorView} from '@shared/ui/ErrorView';
import {AppIcon} from '@shared/ui/AppIcon';
import {formatRelativeTime} from '@shared/lib/formatters';
import {openWhatsAppUrl} from '@shared/lib/whatsapp';
import {dismissScreen} from '@app/navigation/navigationRef';
import {colors} from '@shared/theme/colors';
import {shadows} from '@shared/theme/shadows';

type Props = RootStackScreenProps<'Conversation'>;

export const ConversationScreen: React.FC<Props> = ({route, navigation}) => {
  const {conversationId, listingId} = route.params;
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const {
    conversations,
    messages,
    isLoading,
    isSending,
    cooldown,
    error,
    loadMessages,
    loadMoreMessages,
    sendChatMessage,
    markChatRead,
  } = useChat();

  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  useRealtimeChat(conversationId);

  const conversation: Conversation | undefined = conversations.find(
    c => c.id === conversationId,
  );
  const threadMessages = messages[conversationId] ?? [];

  useFocusEffect(
    useCallback(() => {
      void loadMessages(conversationId);
      void markChatRead(conversationId);
    }, [conversationId]),
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (threadMessages.length > 0) {
      flatListRef.current?.scrollToEnd({animated: true});
    }
  }, [threadMessages.length]);

  const handleSend = async () => {
    if (!text.trim() || cooldown || isSending || !conversation) return;
    const msg = text.trim();
    setText('');
    const ok = await sendChatMessage(conversationId, conversation.peer.id, msg);
    if (!ok && error === 'CHAT_KEYS_MISSING') {
      Alert.alert(
        'Chat not available',
        "This person hasn't enabled in-app chat yet. Try WhatsApp instead.",
      );
    }
  };

  const handleLoadMore = () => {
    if (threadMessages.length > 0) {
      void loadMoreMessages(conversationId, threadMessages[0].id);
    }
  };

  if (isLoading && threadMessages.length === 0) {
    return <LoadingSpinner message="Loading conversation..." />;
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}>
      {/* Header */}
      <View
        className="flex-row items-center border-b border-slate-200 bg-white px-3 py-2"
        style={{paddingTop: insets.top + 8}}>
        <TouchableOpacity
          onPress={() => dismissScreen(navigation)}
          hitSlop={12}
          className="mr-2">
          <AppIcon name="back" size={22} color={colors.brand.black} />
        </TouchableOpacity>

        {conversation?.listingImageUrl ? (
          <View className="mr-2.5 overflow-hidden rounded-lg" style={{width: 40, height: 40}}>
            <MediaThumb
              uri={conversation.listingImageUrl}
              style={{width: 40, height: 40}}
            />
          </View>
        ) : null}

        <View className="min-w-0 flex-1">
          <Text className="text-[15px] font-semibold text-brand-black" numberOfLines={1}>
            {conversation?.peer.fullName ?? 'Chat'}
          </Text>
          {conversation?.listingTitle ? (
            <Text className="text-[12px] text-brand-gray" numberOfLines={1}>
              {conversation.listingTitle}
            </Text>
          ) : null}
        </View>

        {conversation?.peer.whatsappUrl ? (
          <TouchableOpacity
            onPress={() => void openWhatsAppUrl(conversation.peer.whatsappUrl!)}
            className="ml-2 flex-row items-center rounded-full px-3 py-1.5"
            style={{backgroundColor: '#25D366'}}>
            <AppIcon name="whatsapp" size={14} color="#FFFFFF" />
            <Text className="ml-1 text-[12px] font-semibold text-white">WhatsApp</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Messages */}
      {error && error !== 'CHAT_KEYS_MISSING' && threadMessages.length === 0 ? (
        <ErrorView message={error} onRetry={() => void loadMessages(conversationId)} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={threadMessages}
          keyExtractor={item => item.id}
          contentContainerStyle={{padding: 16, gap: 8}}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          renderItem={({item}) => (
            <MessageBubble message={item} isOwn={item.senderId === user?.id} />
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-center text-[14px] text-brand-gray">
                No messages yet.{'\n'}Say hello!
              </Text>
            </View>
          }
        />
      )}

      {/* Peer no keys banner */}
      {error === 'CHAT_KEYS_MISSING' ? (
        <View className="mx-4 mb-2 rounded-xl bg-[#FEF3C7] px-3 py-2.5">
          <Text className="text-[13px] text-[#92400E]">
            This person hasn't enabled in-app chat yet.
          </Text>
        </View>
      ) : null}

      {/* Composer */}
      <View
        className="flex-row items-end border-t border-slate-200 bg-white px-3 py-2"
        style={{paddingBottom: Math.max(insets.bottom, 12)}}>
        <TextInput
          className="min-h-[40px] flex-1 rounded-2xl border border-slate-200 bg-brand-white px-4 py-2 text-[15px] text-brand-black"
          placeholder="Message..."
          placeholderTextColor="#94A3B8"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={2000}
          editable={error !== 'CHAT_KEYS_MISSING'}
        />
        <TouchableOpacity
          onPress={() => void handleSend()}
          disabled={!text.trim() || cooldown || isSending || error === 'CHAT_KEYS_MISSING'}
          className="ml-2 h-10 w-10 items-center justify-center rounded-full"
          style={{
            backgroundColor:
              !text.trim() || cooldown || isSending ? '#E2E8F0' : colors.brand.blue,
          }}>
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <AppIcon name="share" size={16} color={!text.trim() || cooldown ? '#94A3B8' : '#FFFFFF'} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

function MessageBubble({message, isOwn}: {message: ChatMessage; isOwn: boolean}) {
  return (
    <View className={`max-w-[80%] ${isOwn ? 'self-end' : 'self-start'}`}>
      <View
        className={`rounded-2xl px-3.5 py-2.5 ${
          isOwn ? 'rounded-br-sm bg-brand-blue' : 'rounded-bl-sm bg-[#F1F5F9]'
        }`}>
        {message.decryptError ? (
          <Text className={`text-[13px] italic ${isOwn ? 'text-blue-200' : 'text-brand-gray'}`}>
            Unable to decrypt this message
          </Text>
        ) : (
          <Text className={`text-[14px] leading-5 ${isOwn ? 'text-white' : 'text-brand-black'}`}>
            {message.plaintext ?? '•••'}
          </Text>
        )}
      </View>
      <Text
        className={`mt-1 text-[11px] text-brand-gray ${isOwn ? 'text-right' : 'text-left'}`}>
        {formatRelativeTime(message.createdAt)}
      </Text>
    </View>
  );
}
