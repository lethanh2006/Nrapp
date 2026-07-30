import React from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MessageInputProps {
  selectedUser: string | null;
  message: string;
  setMessage: (v: string) => void;
  handleMessageSend: () => void;
}

export default function MessageInput({
  selectedUser,
  message,
  setMessage,
  handleMessageSend,
}: MessageInputProps) {
  const handleSubmit = () => {
    if (!message.trim()) return;
    handleMessageSend();
  };

  if (!selectedUser) return null;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor="#aaaaaa"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={1000}
        />

        <Pressable
          style={[
            styles.sendBtn,
            !message.trim() && styles.sendDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!message.trim()}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    maxHeight: 100,
  },
  sendBtn: {
    padding: 12,
    backgroundColor: '#0084FF',
    borderRadius: 12,
  },
  sendDisabled: {
    opacity: 0.5,
  },
});
