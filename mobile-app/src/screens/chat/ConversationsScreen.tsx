import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { API_BASE_URL } from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');

export default function ConversationsScreen({ navigation }: any) {
  const { token, user } = useSelector((state: RootState) => state.auth);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return `${Math.round(diffInHours * 60)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.round(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderConversation = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.conversationCardContainer}
      onPress={() => navigation.navigate('Chat', {
        propertyId: item.propertyId,
        otherUser: item.otherUser,
        propertyTitle: item.propertyTitle
      })}
    >
      <LinearGradient
        colors={['#1E293B', '#334155']}
        style={styles.conversationCard}
      >
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6', '#EC4899']}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarText}>
              {item.otherUser.name.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
          {item.unreadCount > 0 && (
            <View style={styles.unreadIndicator}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName}>{item.otherUser.name.toUpperCase()}</Text>
            {item.lastMessage && (
              <Text style={styles.timestamp}>
                {formatLastMessageTime(item.lastMessage.createdAt).toUpperCase()}
              </Text>
            )}
          </View>
          
          <View style={styles.propertyContainer}>
            <MaterialIcons name="home" size={16} color="#22C55E" />
            <Text style={styles.propertyName}>{item.propertyTitle.toUpperCase()}</Text>
          </View>
          
          <View style={styles.lastMessageContainer}>
            <Text style={styles.lastMessage} numberOfLines={2}>
              {item.lastMessage ? 
                `${item.lastMessage.senderId === user?.id ? 'YOU: ' : ''}${item.lastMessage.content.toUpperCase()}` :
                'NO MESSAGES YET'
              }
            </Text>
          </View>
        </View>
        
        <View style={styles.arrowContainer}>
          <MaterialIcons name="arrow-forward-ios" size={16} color="#94A3B8" />
        </View>
      </LinearGradient>
      <View style={styles.conversationCardGlow} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0F0F23', '#1A1A2E', '#16213E']}
          style={styles.backgroundGradient}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.popToTop()} style={styles.backButton}>
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  style={styles.backButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                  <Text style={styles.backButtonText}>BACK</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.title}>MESSAGES</Text>
              <View style={styles.headerLine} />
            </View>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingText}>LOADING CONVERSATIONS...</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0F23', '#1A1A2E', '#16213E']}
        style={styles.backgroundGradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.popToTop()} style={styles.backButton}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                style={styles.backButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                <Text style={styles.backButtonText}>BACK</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.title}>MESSAGES</Text>
            <View style={styles.headerLine} />
          </View>

          {conversations.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <LinearGradient
                colors={['#1E293B', '#334155']}
                style={styles.emptyState}
              >
                <MaterialIcons name="chat-bubble-outline" size={48} color="#64748B" />
                <Text style={styles.emptyTitle}>NO CONVERSATIONS YET</Text>
                <Text style={styles.emptyDescription}>
                  {user?.userType === 'LANDLORD' 
                    ? 'MESSAGES WILL APPEAR HERE WHEN TENANTS CONTACT YOU'
                    : 'JOIN A PROPERTY TO START MESSAGING YOUR LANDLORD'
                  }
                </Text>
              </LinearGradient>
            </View>
          ) : (
            <ScrollView 
              style={styles.conversationsList}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ACTIVE CONVERSATIONS</Text>
                {conversations.map((item, index) => 
                  <View key={`${item.propertyId}-${item.otherUser.id}`}>
                    {renderConversation({ item })}
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  backButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 24,
  },
  headerLine: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 12,
  },
  conversationsList: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 20,
    opacity: 0.9,
  },
  conversationCardContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  conversationCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    alignItems: 'center',
  },
  conversationCardGlow: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 17,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    zIndex: -1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  unreadIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  timestamp: {
    fontSize: 10,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  propertyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  propertyName: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  lastMessageContainer: {
    flex: 1,
  },
  lastMessage: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  arrowContainer: {
    marginLeft: 12,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyState: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    width: '100%',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 1,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: 0.5,
  },
});