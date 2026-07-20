import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Ionicons';
import { BRAND, FONTS } from '../../../constants/brand';
import { useAuth } from '../../../hooks/useAuth';
import { getBackendAccessToken } from '../../../lib/backendApi';
import { connectOrderSocket, getChatMessages, sendChatMessage } from '../../../lib/orderApi';
import type { ChatMessage } from '@shared/types';

type Message = {
  id: string;
  sender_id: string;
  sender_role: 'user' | 'driver' | 'admin';
  text: string;
  sent_at: string;
};

function isUuidLike(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f-]{8,}$/i.test(value);
}

export default function ChatThreadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, orderId } = useLocalSearchParams<{ id?: string; orderId?: string }>();
  const { user: currentUser } = useAuth();
  const chatId = useMemo(() => orderId || id || '', [id, orderId]);
  const isValidOrderId = isUuidLike(chatId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList<Message>>(null);

  const normalizeMessage = useCallback((message: ChatMessage): Message => ({
    id: message.id,
    sender_id: message.sender_id,
    sender_role: message.sender_role === 'system' ? 'admin' : message.sender_role,
    text: message.content || '',
    sent_at: message.created_at || new Date().toISOString(),
  }), []);

  const appendMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (prev.some((item) => item.id === message.id)) return prev;
      return [...prev, message];
    });
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadMessages() {
      if (!isValidOrderId) {
        setLoading(false);
        return;
      }
      try {
        const result = await getChatMessages(chatId);
        if (!cancelled && result.data) {
          setMessages(result.data.map(normalizeMessage));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadMessages();
    return () => {
      cancelled = true;
    };
  }, [chatId, isValidOrderId, normalizeMessage]);

  useEffect(() => {
    if (!isValidOrderId) return;

    let socket: ReturnType<typeof connectOrderSocket> | null = null;
    let cancelled = false;

    getBackendAccessToken().then((token) => {
      if (!token || cancelled) return;
      socket = connectOrderSocket(chatId, token, {
        onChatMessage: (message) => appendMessage(normalizeMessage(message)),
      });
    });

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [appendMessage, chatId, isValidOrderId, normalizeMessage]);

  const send = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || !currentUser?.id || !isValidOrderId) return;

    setText('');
    setSending(true);
    try {
      const result = await sendChatMessage(chatId, trimmed);
      if (result.data) appendMessage(normalizeMessage(result.data));
    } catch {
      setText(trimmed);
    } finally {
      setSending(false);
    }
  }, [appendMessage, chatId, currentUser?.id, isValidOrderId, normalizeMessage, text]);

  const formatTime = useCallback((iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }, []);

  const isMe = useCallback((message: Message) => message.sender_id === currentUser?.id, [currentUser?.id]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.headerButton}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Ionicons name="arrow-back" size={22} color={BRAND.TEXT} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Chat commande</Text>
          <Text style={styles.headerSubtitle}>Messages securises</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={BRAND.RED} />
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubble-ellipses-outline" size={42} color={BRAND.TEXT3} />
              <Text style={styles.emptyText}>Aucun message</Text>
            </View>
          }
          renderItem={({ item }) => {
            const mine = isMe(item);
            return (
              <View style={[styles.messageRow, mine && styles.messageRowMine]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                  <Text style={[styles.messageText, mine && styles.messageTextMine]}>{item.text}</Text>
                  <Text style={[styles.messageTime, mine && styles.messageTimeMine]}>
                    {formatTime(item.sent_at)}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 12 }]}>
        <TextInput
          style={styles.input}
          placeholder="Votre message..."
          placeholderTextColor={BRAND.TEXT3}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
          accessibilityLabel="Message"
          onSubmitEditing={send}
        />
        <Pressable
          style={[styles.sendButton, (!text.trim() || sending || !isValidOrderId) && styles.sendButtonDisabled]}
          onPress={send}
          disabled={!text.trim() || sending || !isValidOrderId}
          accessibilityRole="button"
          accessibilityLabel="Envoyer"
        >
          {sending ? (
            <ActivityIndicator size={18} color={BRAND.SURFACE} />
          ) : (
            <Ionicons name="send" size={18} color={BRAND.SURFACE} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.BG,
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND.SURFACE,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.BORDER,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 15,
    color: BRAND.TEXT,
  },
  headerSubtitle: {
    fontFamily: FONTS.BODY,
    fontSize: 12,
    color: BRAND.GREEN,
  },
  headerSpacer: {
    width: 44,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    flexGrow: 1,
    padding: 16,
    gap: 10,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyText: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 15,
    color: BRAND.TEXT2,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleOther: {
    backgroundColor: BRAND.SURFACE,
    borderBottomLeftRadius: 4,
  },
  bubbleMine: {
    backgroundColor: BRAND.RED,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontFamily: FONTS.BODY,
    fontSize: 14,
    color: BRAND.TEXT,
    lineHeight: 20,
  },
  messageTextMine: {
    color: BRAND.SURFACE,
  },
  messageTime: {
    marginTop: 4,
    fontFamily: FONTS.BODY,
    fontSize: 10,
    color: BRAND.TEXT3,
    textAlign: 'right',
  },
  messageTimeMine: {
    color: BRAND.RED_LIGHT,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: BRAND.SURFACE,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: BRAND.BORDER,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    backgroundColor: BRAND.LIGHT,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: FONTS.BODY,
    fontSize: 14,
    color: BRAND.TEXT,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});
