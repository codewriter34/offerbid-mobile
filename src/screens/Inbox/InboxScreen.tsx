import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet, RefreshControl} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {MainTabScreenProps} from '../../types/navigation';
import {useConversations} from '../../hooks/useConversations';
import {ConversationListItem} from '../../components/ConversationListItem';
import {EmptyState} from '../../components/EmptyState';
import {ErrorView} from '../../components/ErrorView';
import {LoadingSpinner} from '../../components/LoadingSpinner';
import {ConversationDto} from '../../types';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing} from '../../theme/spacing';

type Props = MainTabScreenProps<'Inbox'>;

export const InboxScreen: React.FC<Props> = ({navigation}) => {
  const {conversations, isLoading, error, hasMore, fetchConversations, loadMoreConversations} =
    useConversations();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh whenever the tab regains focus so unread counts / new
  // conversations show up without requiring a manual pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      fetchConversations(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations(true);
    setRefreshing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePress = (conversation: ConversationDto) => {
    navigation.navigate('Thread', {conversationId: conversation.id});
  };

  if (isLoading && conversations.length === 0) {
    return <LoadingSpinner message="Loading chats..." />;
  }

  if (error && conversations.length === 0) {
    return <ErrorView message={error} onRetry={() => fetchConversations(true)} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chats</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <ConversationListItem conversation={item} onPress={handlePress} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={hasMore ? loadMoreConversations : undefined}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <EmptyState
            title="No conversations yet"
            message="Message a seller from a listing to start a chat."
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  header: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {...typography.h2, color: colors.text.primary},
});
