import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../hooks/useNotifications';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

interface NotificationBellProps {
  color?: string;
  size?: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ 
  color = '#FFFFFF', 
  size = 24 
}) => {
  const navigation = useNavigation();
  const { unreadCount, fetchNotifications } = useNotifications(navigation);

  useEffect(() => {
    // Fetch immediately
    fetchNotifications();
    
    // Set up polling interval to check for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const handlePress = () => {
    navigation.navigate('Notifications' as never);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{
        position: 'relative',
        padding: 8,
      }}
    >
      <Ionicons 
        name={unreadCount > 0 ? 'notifications' : 'notifications-outline'} 
        size={size} 
        color={color} 
      />
      
      {unreadCount > 0 && (
        <View
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            backgroundColor: '#EF4444',
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: '#0F0F23',
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: '700',
              textAlign: 'center',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount.toString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};