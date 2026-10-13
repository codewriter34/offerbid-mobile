import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {RootStackScreenProps} from '@app/navigation/types';
import {useChat} from '@features/chat/useChat';
import {Conversation} from '@features/chat/chatTypes';
import {AvatarImage, MediaThumb} from '@shared/ui/CachedImage';
import {EmptyState} from '@shared/ui/EmptyState';
import {LoadingSpinner} from '@shared/ui/LoadingSpinner';
import {ErrorView} from '@shared/ui/ErrorView';
import {formatRelativeTime} from '@shared/lib/formatters';
import {colors} from '@shared/theme/colors';

type Props = RootStackScreenProps<'Inbox'>;

export const InboxScreen: React.FC<Props> = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const {conversations, isLoading, error, fetchInbox} = useChat();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void fetchInbox();
    }, [fetchInbox]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInbox();
    setRefreshing(false);
  }, [fetchInbox]);

  const handlePress = (conv: Conversation) => {
    navigation.navigate('Conversation', {
      conversationId: conv.id,
      listingId: conv.listingId,
    });
  };

  return (
    <View className="flex-1 bg-white" style={{paddingTop: insets.top}}>
      <View className="border-b border-slate-200 px-4 py-3">
        <Text className="text-[22px] font-bold text-brand-black">Messages</Text>
      </View>

      {isLoading && conversations.length === 0 ? (
        <LoadingSpinner message="Loading messages..." />
      ) : error && conversations.length === 0 ? (
        <ErrorView message={error} onRetry={fetchInbox} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.brand.blue]}
            />
          }
          renderItem={({item}) => (
            <ConversationRow conv={item} onPress={handlePress} />
          )}
          ListEmptyComponent={
            <View className="py-16">
              <EmptyState
                title="No messages yet"
                message="When you message a seller, your conversations will appear here."
              />
            </View>
          }
        />
      )}
    </View>
  );
};

function ConversationRow({
  conv,
  onPress,
}: {
  conv: Conversation;
  onPress: (c: Conversation) => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => onPress(conv)}
      activeOpacity={0.75}
      className="flex-row items-center border-b border-slate-100 px-4 py-3">
      <View className="relative mr-3">
        <AvatarImage uri={conv.peer.avatarUrl} name={conv.peer.fullName} size={48} />
        {conv.listingImageUrl ? (
          <View className="absolute -bottom-1 -right-1 h-6 w-6 overflow-hidden rounded-md border border-white">
            <MediaThumb uri={conv.listingImageUrl} style={{width: 24, height: 24}} />
          </View>
        ) : null}
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-[15px] font-semibold text-brand-black" numberOfLines={1}>
            {conv.peer.fullName}
          </Text>
          {conv.lastMessageAt ? (
            <Text className="ml-2 shrink-0 text-[12px] text-brand-gray">
              {formatRelativeTime(conv.lastMessageAt)}
            </Text>
          ) : null}
        </View>
        <Text className="mt-0.5 text-[13px] text-brand-gray" numberOfLines={1}>
          {conv.listingTitle}
        </Text>
        {conv.lastMessagePreview ? (
          <Text className="mt-0.5 text-[12px] text-brand-gray" numberOfLines={1}>
            {conv.lastMessagePreview}
          </Text>
        ) : null}
      </View>

      {conv.unreadCount > 0 ? (
        <View className="ml-2 h-5 min-w-5 items-center justify-center rounded-full bg-brand-blue px-1.5">
          <Text className="text-[11px] font-bold text-white">
            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
