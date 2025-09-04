import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNotifications } from '../../hooks/useNotifications';

const { width: screenWidth } = Dimensions.get('window');

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  data: any;
}

export const NotificationsScreen = ({ navigation }: any) => {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    handleNotificationNavigation,
  } = useNotifications(navigation);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    handleNotificationNavigation(notification.data);
  };

  const handleDeleteNotification = (notificationId: string) => {
    Alert.alert(
      'DELETE NOTIFICATION',
      'Are you sure you want to delete this notification?',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'DELETE',
          style: 'destructive',
          onPress: () => deleteNotification(notificationId),
        },
      ]
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT_REMINDER':
      case 'PAYMENT_OVERDUE':
        return 'notifications';
      case 'PAYMENT_APPROVED':
        return 'check-circle';
      case 'PAYMENT_REJECTED':
        return 'cancel';
      case 'PAYMENT_VERIFICATION_NEEDED':
        return 'hourglass-empty';
      case 'NEW_MESSAGE':
        return 'message';
      case 'END_RENTAL_REQUEST':
      case 'END_RENTAL_AUTO_ACCEPT_WARNING':
        return 'exit-to-app';
      case 'NEW_TENANT_JOINED':
        return 'person-add';
      case 'PAYMENT_DATE_CHANGE_REQUEST':
      case 'PAYMENT_DATE_CHANGE_APPROVED':
      case 'PAYMENT_DATE_CHANGE_REJECTED':
        return 'schedule';
      default:
        return 'notifications';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 1) {
      return 'NOW';
    } else if (hours < 24) {
      return `${Math.floor(hours)}H AGO`;
    } else {
      return `${Math.floor(hours / 24)}D AGO`;
    }
  };

  return (
    <LinearGradient colors={['#0F0F23', '#1A1A2E', '#16213E']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 30,
          gap: 15,
        }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.1)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 28,
              fontWeight: '800',
              color: '#FFFFFF',
              letterSpacing: 2,
            }}>
              NOTIFICATIONS
            </Text>
            {unreadCount > 0 && (
              <Text style={{
                fontSize: 14,
                color: '#8B5CF6',
                letterSpacing: 1,
                marginTop: 2,
              }}>
                {unreadCount} UNREAD
              </Text>
            )}
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllAsRead}
              style={{
                paddingHorizontal: 15,
                paddingVertical: 8,
                borderRadius: 15,
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                borderWidth: 1,
                borderColor: '#8B5CF6',
              }}
            >
              <Text style={{
                color: '#8B5CF6',
                fontSize: 12,
                fontWeight: '600',
                letterSpacing: 1,
              }}>
                MARK ALL READ
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notifications List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#8B5CF6"
            />
          }
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {notifications.length === 0 ? (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 100,
              paddingHorizontal: 40,
            }}>
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.1)']}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <Ionicons name="notifications-outline" size={40} color="#8B5CF6" />
              </LinearGradient>
              
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#FFFFFF',
                textAlign: 'center',
                letterSpacing: 1,
                marginBottom: 10,
              }}>
                NO NOTIFICATIONS
              </Text>
              
              <Text style={{
                fontSize: 14,
                color: '#AAAAAA',
                textAlign: 'center',
                lineHeight: 20,
              }}>
                You're all caught up! New notifications will appear here.
              </Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 20, gap: 15 }}>
              {notifications.map((notification: Notification) => (
                <TouchableOpacity
                  key={notification.id}
                  onPress={() => handleNotificationPress(notification)}
                  style={{
                    borderRadius: 15,
                    overflow: 'hidden',
                  }}
                >
                  <LinearGradient
                    colors={
                      notification.read
                        ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']
                        : ['rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.08)']
                    }
                    style={{
                      padding: 20,
                      borderWidth: 1,
                      borderColor: notification.read
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 15,
                    }}>
                      {/* Icon */}
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: notification.read
                          ? 'rgba(255,255,255,0.1)'
                          : 'rgba(139, 92, 246, 0.2)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <MaterialIcons
                          name={getNotificationIcon(notification.type)}
                          size={20}
                          color={notification.read ? '#AAAAAA' : '#8B5CF6'}
                        />
                      </View>

                      {/* Content */}
                      <View style={{ flex: 1 }}>
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                        }}>
                          <Text style={{
                            fontSize: 16,
                            fontWeight: '700',
                            color: '#FFFFFF',
                            letterSpacing: 0.5,
                            flex: 1,
                            marginRight: 10,
                          }}>
                            {notification.title.toUpperCase()}
                          </Text>
                          
                          <Text style={{
                            fontSize: 12,
                            color: notification.read ? '#666666' : '#8B5CF6',
                            fontWeight: '600',
                            letterSpacing: 0.5,
                          }}>
                            {formatDate(notification.createdAt)}
                          </Text>
                        </View>

                        <Text style={{
                          fontSize: 14,
                          color: notification.read ? '#AAAAAA' : '#DDDDDD',
                          lineHeight: 20,
                          marginBottom: 15,
                        }}>
                          {notification.body}
                        </Text>

                        {/* Actions */}
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}>
                          {!notification.read && (
                            <View style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: '#8B5CF6',
                            }} />
                          )}
                          
                          <View style={{ flex: 1 }} />
                          
                          <TouchableOpacity
                            onPress={() => handleDeleteNotification(notification.id)}
                            style={{
                              padding: 8,
                              borderRadius: 8,
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            }}
                          >
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};