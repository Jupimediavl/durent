import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { useNotifications } from './src/hooks/useNotifications';
import LoadingScreen from './src/screens/loading/LoadingScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import TenantDashboardScreen from './src/screens/dashboard/TenantDashboardScreen';
import LandlordDashboardScreen from './src/screens/dashboard/LandlordDashboardScreen';
import AddPropertyScreenEnhanced from './src/screens/properties/AddPropertyScreenEnhanced';
import PropertyDetailsScreen from './src/screens/properties/PropertyDetailsScreen';
import EditPropertyScreen from './src/screens/properties/EditPropertyScreen';
import SearchPropertiesScreen from './src/screens/properties/SearchPropertiesScreen';
import JoinPropertyScreen from './src/screens/properties/JoinPropertyScreen';
import ConversationsScreen from './src/screens/chat/ConversationsScreen';
import ChatScreen from './src/screens/chat/ChatScreen';
import PaymentsScreen from './src/screens/payments/PaymentsScreen';
import LandlordPaymentsScreen from './src/screens/payments/LandlordPaymentsScreen';
import PaymentVerificationScreen from './src/screens/payments/PaymentVerificationScreen';
import PaymentChangeRequestsScreen from './src/screens/payments/PaymentChangeRequestsScreen';
import EditPaymentSettingsScreen from './src/screens/properties/EditPaymentSettingsScreen';
import PastRentalsScreen from './src/screens/history/PastRentalsScreen';
import PastTenantsScreen from './src/screens/properties/PastTenantsScreen';
import { NotificationsScreen } from './src/screens/notifications/NotificationsScreen';
import { NotificationSettingsScreen } from './src/screens/notifications/NotificationSettingsScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  // Don't initialize notifications here - will be done in individual screens

  if (isLoading) {
    return <LoadingScreen onFinish={() => setIsLoading(false)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="TenantDashboard" component={TenantDashboardScreen} />
        <Stack.Screen name="LandlordDashboard" component={LandlordDashboardScreen} />
        <Stack.Screen name="AddProperty" component={AddPropertyScreenEnhanced} />
        <Stack.Screen name="PropertyDetails" component={PropertyDetailsScreen} />
        <Stack.Screen name="EditProperty" component={EditPropertyScreen} />
        <Stack.Screen name="SearchProperties" component={SearchPropertiesScreen} />
        <Stack.Screen name="JoinProperty" component={JoinPropertyScreen} />
        <Stack.Screen name="Conversations" component={ConversationsScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Payments" component={PaymentsScreen} />
        <Stack.Screen name="LandlordPayments" component={LandlordPaymentsScreen} />
        <Stack.Screen name="PaymentVerification" component={PaymentVerificationScreen} />
        <Stack.Screen name="PaymentChangeRequests" component={PaymentChangeRequestsScreen} />
        <Stack.Screen name="EditPaymentSettings" component={EditPaymentSettingsScreen} />
        <Stack.Screen name="PastRentals" component={PastRentalsScreen} />
        <Stack.Screen name="PastTenants" component={PastTenantsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
}