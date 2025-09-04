import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { API_BASE_URL } from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');

interface NotificationSettings {
  paymentReminders: boolean;
  paymentUpdates: boolean;
  messages: boolean;
  endRentalNotifications: boolean;
  tenantUpdates: boolean;
  paymentDateChangeRequests: boolean;
  reminderDaysBefore: number;
}

export const NotificationSettingsScreen = ({ navigation }: any) => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    paymentReminders: true,
    paymentUpdates: true,
    messages: true,
    endRentalNotifications: true,
    tenantUpdates: true,
    paymentDateChangeRequests: true,
    reminderDaysBefore: 3,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    setLoading(true);
    
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      const response = await fetch(`${API_BASE_URL}/notifications/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedSettings),
      });
      
      const data = await response.json();
      if (data.success) {
        setSettings(updatedSettings);
        Alert.alert('SUCCESS', 'Notification settings updated successfully');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      Alert.alert('ERROR', 'Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const SettingItem = ({
    title,
    subtitle,
    value,
    onValueChange,
    icon,
  }: {
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    icon: string;
  }) => (
    <View style={{
      marginBottom: 20,
      borderRadius: 15,
      overflow: 'hidden',
    }}>
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
        style={{
          padding: 20,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 15,
        }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Ionicons name={icon as any} size={20} color="#8B5CF6" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '700',
              color: '#FFFFFF',
              letterSpacing: 0.5,
              marginBottom: 4,
            }}>
              {title.toUpperCase()}
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#AAAAAA',
              lineHeight: 18,
            }}>
              {subtitle}
            </Text>
          </View>

          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: '#333333', true: '#8B5CF6' }}
            thumbColor={value ? '#FFFFFF' : '#666666'}
            ios_backgroundColor="#333333"
          />
        </View>
      </LinearGradient>
    </View>
  );

  const ReminderDaysItem = () => (
    <View style={{
      marginBottom: 20,
      borderRadius: 15,
      overflow: 'hidden',
    }}>
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
        style={{
          padding: 20,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 15,
        }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Ionicons name="calendar" size={20} color="#8B5CF6" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '700',
              color: '#FFFFFF',
              letterSpacing: 0.5,
              marginBottom: 4,
            }}>
              REMINDER TIMING
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#AAAAAA',
              lineHeight: 18,
            }}>
              Send payment reminders {settings.reminderDaysBefore} days before due date
            </Text>
          </View>
        </View>

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 15,
          gap: 10,
        }}>
          {[1, 2, 3, 5, 7].map((days) => (
            <TouchableOpacity
              key={days}
              onPress={() => updateSettings({ reminderDaysBefore: days })}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: settings.reminderDaysBefore === days
                  ? '#8B5CF6'
                  : 'rgba(255,255,255,0.1)',
                alignItems: 'center',
              }}
            >
              <Text style={{
                color: settings.reminderDaysBefore === days ? '#FFFFFF' : '#AAAAAA',
                fontSize: 14,
                fontWeight: '600',
              }}>
                {days}D
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    </View>
  );

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

          <Text style={{
            fontSize: 28,
            fontWeight: '800',
            color: '#FFFFFF',
            letterSpacing: 2,
          }}>
            NOTIFICATION SETTINGS
          </Text>
        </View>

        {/* Settings List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
        >
          <SettingItem
            title="Payment Reminders"
            subtitle="Get notified about upcoming and overdue payments"
            value={settings.paymentReminders}
            onValueChange={(value) => updateSettings({ paymentReminders: value })}
            icon="card"
          />

          <SettingItem
            title="Payment Updates"
            subtitle="Notifications for payment approvals, rejections, and verification needs"
            value={settings.paymentUpdates}
            onValueChange={(value) => updateSettings({ paymentUpdates: value })}
            icon="checkmark-circle"
          />

          <SettingItem
            title="Messages"
            subtitle="Get notified when you receive new messages"
            value={settings.messages}
            onValueChange={(value) => updateSettings({ messages: value })}
            icon="chatbubbles"
          />

          <SettingItem
            title="End Rental Notifications"
            subtitle="Notifications about rental termination requests and warnings"
            value={settings.endRentalNotifications}
            onValueChange={(value) => updateSettings({ endRentalNotifications: value })}
            icon="exit"
          />

          <SettingItem
            title="Tenant Updates"
            subtitle="Get notified when new tenants join your properties"
            value={settings.tenantUpdates}
            onValueChange={(value) => updateSettings({ tenantUpdates: value })}
            icon="person-add"
          />

          <SettingItem
            title="Payment Date Changes"
            subtitle="Notifications about payment date change requests and responses"
            value={settings.paymentDateChangeRequests}
            onValueChange={(value) => updateSettings({ paymentDateChangeRequests: value })}
            icon="calendar"
          />

          <ReminderDaysItem />

          {/* Reset to Defaults */}
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'RESET SETTINGS',
                'Are you sure you want to reset all notification settings to default?',
                [
                  { text: 'CANCEL', style: 'cancel' },
                  {
                    text: 'RESET',
                    style: 'destructive',
                    onPress: () => updateSettings({
                      paymentReminders: true,
                      paymentUpdates: true,
                      messages: true,
                      endRentalNotifications: true,
                      tenantUpdates: true,
                      paymentDateChangeRequests: true,
                      reminderDaysBefore: 3,
                    }),
                  },
                ]
              );
            }}
            disabled={loading}
            style={{
              borderRadius: 15,
              overflow: 'hidden',
              marginTop: 20,
            }}
          >
            <LinearGradient
              colors={['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.1)']}
              style={{
                padding: 18,
                borderWidth: 1,
                borderColor: 'rgba(239, 68, 68, 0.3)',
                alignItems: 'center',
              }}
            >
              <Text style={{
                color: '#EF4444',
                fontSize: 16,
                fontWeight: '700',
                letterSpacing: 1,
              }}>
                RESET TO DEFAULTS
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};