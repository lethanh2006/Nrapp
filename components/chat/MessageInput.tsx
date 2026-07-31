import type { ChatImageUpload } from '@/src/features/shared/chat/chat-service';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  Image,
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
  handleMessageSend: (image?: ChatImageUpload) => Promise<boolean>;
}

export default function MessageInput({
  selectedUser,
  message,
  setMessage,
  handleMessageSend,
}: MessageInputProps) {
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [sending, setSending] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cho phép ứng dụng truy cập thư viện ảnh.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const handleSubmit = async () => {
    if ((!message.trim() && !image) || sending) return;
    setSending(true);
    const sent = await handleMessageSend(
      image
        ? { uri: image.uri, fileName: image.fileName, mimeType: image.mimeType }
        : undefined,
    );
    if (sent) setImage(null);
    setSending(false);
  };

  if (!selectedUser) return null;

  return (
    <View style={styles.container}>
      {image && (
        <View style={styles.previewWrap}>
          <Image source={{ uri: image.uri }} style={styles.previewImage} />
          <Pressable style={styles.removeImage} onPress={() => setImage(null)}>
            <Ionicons name="close" size={18} color="#fff" />
          </Pressable>
        </View>
      )}
      <View style={styles.row}>
        <Pressable style={styles.attachButton} onPress={pickImage} disabled={sending}>
          <Ionicons name="image-outline" size={22} color="#0084FF" />
        </Pressable>
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
            (!message.trim() && !image) && styles.sendDisabled,
          ]}
          onPress={handleSubmit}
          disabled={(!message.trim() && !image) || sending}
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
  previewWrap: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  previewImage: {
    width: 88,
    height: 88,
    borderRadius: 10,
  },
  removeImage: {
    position: 'absolute',
    right: -7,
    top: -7,
    borderRadius: 14,
    padding: 3,
    backgroundColor: '#ef4444',
  },
  attachButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
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
