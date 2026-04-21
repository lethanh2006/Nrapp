import { Message } from '@/types/chat';
import { User } from '@/context/AppContext';
import { Image } from 'expo-image';
import React, { useEffect, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

interface ChatMessagesProps {
  selectedUser: string | null;
  messages: Message[] | null;
  loggedInUser: User | null;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatMessages({
  selectedUser,
  messages,
  loggedInUser,
}: ChatMessagesProps) {
  const scrollRef = useRef<ScrollView>(null);

  const uniqueMessages = useMemo(() => {
    if (!messages) return [];
    const seen = new Set<string>();
    return messages.filter((m) => {
      if (seen.has(m._id)) return false;
      seen.add(m._id);
      return true;
    });
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [selectedUser, uniqueMessages]);

  if (!selectedUser) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Chọn cuộc trò chuyện để bắt đầu</Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
    >
      {uniqueMessages.map((msg) => {
        const isMe = msg.sender === loggedInUser?._id;
        return (
          <View key={msg._id} style={[styles.msgWrap, isMe ? styles.msgRight : styles.msgLeft]}>
            <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
              {msg.messageType === 'image' && msg.image && (
                <Image
                  source={{ uri: msg.image.url }}
                  style={styles.img}
                />
              )}
              {msg.text ? <Text style={styles.msgText}>{msg.text}</Text> : null}
            </View>
            <Text style={[styles.time, isMe && styles.timeRight]}>
              {formatTime(msg.createdAt)}
              {isMe && (msg.seen ? ' ✓✓' : ' ✓')}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#999999',
    fontSize: 16,
  },
  msgWrap: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  msgRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  msgLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '100%',
  },
  bubbleMe: {
    backgroundColor: '#0084FF',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#e5e5ea',
    borderBottomLeftRadius: 4,
  },
  msgText: {
    color: '#000000',
    fontSize: 15,
  },
  img: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 4,
  },
  time: {
    fontSize: 11,
    color: '#999999',
    marginTop: 4,
    marginHorizontal: 4,
  },
  timeRight: {
    marginRight: 8,
  },
});
