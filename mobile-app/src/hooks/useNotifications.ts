import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { API_BASE_URL } from '../services/api';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotifications(navigation?: any) {
  const { token, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  async function registerForPushNotificationsAsync() {
    let token = '';

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      
      try {
        // For development, use a simulated token
        // In production, you'll need to set up EAS with a real project ID
        if (__DEV__) {
          // Generate consistent simulated token for development
          token = `ExponentPushToken[${Math.random().toString(36).substr(2, 9)}]`;
          console.log('Using simulated push token for development:', token);
        } else {
          const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
          if (!projectId) {
            throw new Error('Project ID not found - EAS configuration required for production');
          }
          
          token = (await Notifications.getExpoPushTokenAsync({
            projectId,
          })).data;
          
          console.log('Push token:', token);
        }
      } catch (e) {
        console.log('Error getting push token:', e);
        // Fallback to simulated token
        token = `ExponentPushToken[${Math.random().toString(36).substr(2, 9)}]`;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  async function updatePushTokenOnServer(pushToken: string) {
    if (!token || !isAuthenticated) return;

    try {
      await fetch(`${API_BASE_URL}/user/push-token`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ pushToken }),
      });
      console.log('Push token updated on server');
    } catch (error) {
      console.error('Failed to update push token:', error);
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return;

    // Register for push notifications
    registerForPushNotificationsAsync().then(async (pushToken) => {
      if (pushToken) {
        await updatePushTokenOnServer(pushToken);
      }
    });

    // Handle notification received while app is running
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Handle notification tapped
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);
      
      // Navigate based on notification type
      handleNotificationNavigation(data);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated, token]);

  // Handle navigation based on notification type
  const handleNotificationNavigation = (data: any) => {
    if (!navigation) {
      console.log('Navigation not available:', data);
      return;
    }
    
    try {
      switch (data.type) {
        case 'message':
          navigation.navigate('Chat', { propertyId: data.propertyId });
          break;
        case 'payment_reminder':
        case 'payment_approved':
        case 'payment_rejected':
        case 'payment_overdue':
          navigation.navigate('Payments');
          break;
        case 'payment_verification':
          navigation.navigate('PaymentVerification');
          break;
        case 'end_rental_request':
        case 'end_rental_warning':
        case 'rental_ended':
        case 'rental_auto_ended':
          navigation.navigate('PropertyDetails', { propertyId: data.propertyId });
          break;
        case 'payment_date_change_request':
        case 'payment_date_change_response':
          navigation.navigate('PaymentChangeRequests');
          break;
        case 'new_tenant':
          navigation.navigate('PropertyDetails', { propertyId: data.propertyId });
          break;
        default:
          console.log('Unknown notification type:', data.type);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  // Fetch notifications from server
  const fetchNotifications = async () => {
    if (!token || !isAuthenticated) {
      console.log('Cannot fetch notifications - not authenticated');
      return;
    }

    try {
      console.log('Fetching notifications from:', `${API_BASE_URL}/notifications`);
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      console.log('Notifications response:', data);
      
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        console.log('Updated unread count to:', data.unreadCount);
      } else {
        console.log('Failed to fetch notifications:', data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!token || !isAuthenticated) return;

    try {
      await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!token || !isAuthenticated) return;

    try {
      await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    if (!token || !isAuthenticated) return;

    try {
      await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    handleNotificationNavigation,
  };
}