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
import * as ImagePicker from 'expo-image-picker';

interface MessageInputProps {
  selectedUser: string | null;
  message: string;
  setMessage: (v: string) => void;
  handleMessageSend: (e: any, imageUri?: string | null) => void;
}

export default function MessageInput({
  selectedUser,
  message,
  setMessage,
  handleMessageSend,
}: MessageInputProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền', 'Cho phép truy cập ảnh để gửi');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled) setImageUri(result.assets[0].uri);
    } catch (e) {
      Alert.alert('Lỗi', 'Không chọn được ảnh');
    }
  };

  const handleSubmit = () => {
    if (!message.trim() && !imageUri) return;
    handleMessageSend(null, imageUri);
    setImageUri(null);
  };

  if (!selectedUser) return null;

  return (
    <View style={styles.container}>
      {imageUri && (
        <View style={styles.previewWrap}>
          <Image source={{ uri: imageUri }} style={styles.previewImg} />
          <Pressable style={styles.removeImg} onPress={() => setImageUri(null)}>
            <Ionicons name="close" size={18} color="#fff" />
          </Pressable>
        </View>
      )}

      <View style={styles.row}>
        <Pressable style={styles.iconBtn} onPress={pickImage}>
          <Ionicons name="attach" size={22} color="#666666" />
        </Pressable>

        <TextInput
          style={styles.input}
          placeholder={imageUri ? 'Thêm chú thích...' : 'Nhập tin nhắn...'}
          placeholderTextColor="#aaaaaa"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={1000}
          editable={!imageUri}
        />

        <Pressable
          style={[
            styles.sendBtn,
            (!message.trim() && !imageUri) && styles.sendDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!message.trim() && !imageUri}
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
  previewWrap: {
    marginBottom: 8,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  previewImg: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  removeImg: {
    position: 'absolute',
    top: -6,
    right: -6,
    padding: 4,
    backgroundColor: '#ef4444',
    borderRadius: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  iconBtn: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
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
