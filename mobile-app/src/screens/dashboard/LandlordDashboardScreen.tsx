import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { logout } from '../../store';
import { API_BASE_URL } from '../../services/api';
import { NotificationBell } from '../../components/NotificationBell';
import { useNotifications } from '../../hooks/useNotifications';

const { width: screenWidth } = Dimensions.get('window');

export default function LandlordDashboardScreen({ navigation }: any) {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  useNotifications(navigation); // Initialize notifications with navigation
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const refreshData = async () => {
    await Promise.all([
      fetchProperties(false),
      fetchUnreadMessages()
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchProperties();
    fetchUnreadMessages();
    const interval = setInterval(() => {
      fetchProperties(false);
      fetchUnreadMessages();
      }, 10000); // Changed to 10s for faster updates
    return () => clearInterval(interval);
  }, []);

  const fetchProperties = async (showLoading = true) => {
    console.log('🔄 Fetching properties from:', `${API_BASE_URL}/properties`);
    console.log('🔑 Using token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
    if (showLoading) setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/properties`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📄 Response data:', data);
      if (response.ok) {
        console.log('✅ Setting properties:', data.properties?.length || 0, 'items');
        setProperties(data.properties || []);
      } else {
        console.log('❌ Request failed:', data);
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchUnreadMessages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        const totalUnread = data.conversations?.reduce((acc: number, conv: any) => acc + conv.unreadCount, 0) || 0;
        setUnreadMessages(totalUnread);
      }
    } catch (error) {
      console.error('Failed to fetch unread messages:', error);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0F23', '#1A1A2E', '#16213E']}
        style={styles.backgroundGradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FFFFFF"
                colors={['#6366F1', '#8B5CF6']}
              />
            }
          >
            {/* Futuristic Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.welcomeContainer}>
                  <Text style={styles.welcomeText}>WELCOME BACK</Text>
                  <Text style={styles.nameText} numberOfLines={1} ellipsizeMode="tail">
                    {user?.name?.toUpperCase()}
                  </Text>
                  <Text style={styles.userTypeText}>LANDLORD</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <NotificationBell />
                  <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <LinearGradient
                      colors={['#6366F1', '#8B5CF6', '#EC4899']}
                      style={styles.logoutGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.logoutText}>LOGOUT</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.headerLine} />
            </View>

            {/* Quick Actions Grid */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity onPress={() => navigation.navigate('AddProperty')}>
                  <View style={styles.actionCardContainer}>
                    <LinearGradient
                      colors={['#6366F1', '#8B5CF6']}
                      style={styles.actionCard}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.actionIconWrapper}>
                        <MaterialIcons name="add-home" size={28} color="#FFFFFF" />
                      </View>
                      <Text style={styles.actionTitle}>ADD</Text>
                      <Text style={styles.actionSubtitle}>PROPERTY</Text>
                    </LinearGradient>
                    <View style={styles.cardGlow} />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => navigation.navigate('Conversations')}>
                  <View style={styles.actionCardContainer}>
                    <LinearGradient
                      colors={['#8B5CF6', '#EC4899']}
                      style={styles.actionCard}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.actionIconWrapper}>
                        <Ionicons name="chatbubbles" size={28} color="#FFFFFF" />
                        {unreadMessages > 0 && (
                          <View style={styles.notificationDot}>
                            <Text style={styles.notificationText}>{unreadMessages}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.actionTitle}>MESSAGES</Text>
                      <Text style={styles.actionSubtitle}>CHAT</Text>
                    </LinearGradient>
                    <View style={styles.cardGlow} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* My Properties */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>MY PROPERTIES</Text>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#6366F1" />
                  <Text style={styles.loadingText}>LOADING...</Text>
                </View>
              ) : properties.length === 0 ? (
                <View style={styles.emptyState}>
                  <LinearGradient
                    colors={['#1E293B', '#334155']}
                    style={styles.emptyCard}
                  >
                    <Text style={styles.emptyIcon}>🏢</Text>
                    <Text style={styles.emptyTitle}>NO PROPERTIES YET</Text>
                    <Text style={styles.emptyDescription}>
                      Start by adding your first rental property
                    </Text>
                    <TouchableOpacity 
                      style={styles.primaryButton}
                      onPress={() => navigation.navigate('AddProperty')}
                    >
                      <LinearGradient
                        colors={['#6366F1', '#8B5CF6']}
                        style={styles.buttonGradient}
                      >
                        <Text style={styles.primaryButtonText}>ADD PROPERTY</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              ) : (
                <View>
                  {properties.map((property) => (
                    <TouchableOpacity 
                      key={property.id} 
                      style={styles.propertyCardContainer}
                      onPress={() => navigation.navigate('PropertyDetails', { property })}
                    >
                      <LinearGradient
                        colors={['#1E293B', '#334155', '#475569']}
                        style={styles.propertyCard}
                      >
                        <View style={styles.propertyHeader}>
                          <Text style={styles.propertyTitle}>{property.title.toUpperCase()}</Text>
                          <View style={styles.tenantBadge}>
                            <Text style={styles.tenantBadgeText}>
                              {property.rentals?.filter((r: any) => r.status === 'ACTIVE' || r.status === 'ENDING').length || 0} TENANTS
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.propertyDetails}>
                          <Text style={styles.propertyInfo}>
                            {property.bedrooms} BR • {property.bathrooms} BA • AED {property.monthlyRent}/MONTH
                          </Text>
                          <Text style={styles.propertyAddress}>{property.address.toUpperCase()}</Text>
                        </View>
                        
                        {/* End Request Notification */}
                        {property.rentals?.some((rental: any) => 
                          rental.endRequest && 
                          rental.endRequest.status === 'PENDING' && 
                          rental.endRequest.requestedBy?.id !== property.ownerId
                        ) && (
                          <View style={styles.endRequestNotificationContainer}>
                            <LinearGradient
                              colors={['#EF4444', '#DC2626', '#B91C1C']}
                              style={styles.endRequestNotification}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                            >
                              <View style={styles.endRequestIconWrapper}>
                                <MaterialIcons name="exit-to-app" size={20} color="#FFFFFF" />
                                <Text style={styles.endRequestText}>
                                  {property.rentals.find((r: any) => r.endRequest?.status === 'PENDING')?.tenant?.name?.toUpperCase() || 'TENANT'} WANTS TO END RENTAL
                                </Text>
                              </View>
                              <Text style={styles.endRequestDate}>
                                AUTO-ACCEPTS: {new Date(property.rentals.find((r: any) => r.endRequest?.status === 'PENDING')?.endRequest?.autoAcceptAt || new Date()).toLocaleDateString().toUpperCase()}
                              </Text>
                            </LinearGradient>
                            <View style={styles.endRequestGlow} />
                          </View>
                        )}
                      </LinearGradient>
                      <View style={styles.propertyCardGlow} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Monthly Overview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>THIS MONTH</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCardContainer}>
                  <LinearGradient
                    colors={['#1E293B', '#334155']}
                    style={styles.statCard}
                  >
                    <Text style={styles.statNumber}>{properties.length}</Text>
                    <Text style={styles.statLabel}>PROPERTIES</Text>
                  </LinearGradient>
                  <View style={styles.statCardGlow} />
                </View>
                
                <View style={styles.statCardContainer}>
                  <LinearGradient
                    colors={['#1E293B', '#334155']}
                    style={styles.statCard}
                  >
                    <Text style={styles.statNumber}>
                      {properties.reduce((acc, p) => acc + (p.rentals?.filter((r: any) => r.status === 'ACTIVE' || r.status === 'ENDING').length || 0), 0)}
                    </Text>
                    <Text style={styles.statLabel}>TENANTS</Text>
                  </LinearGradient>
                  <View style={styles.statCardGlow} />
                </View>
                
                <View style={styles.statCardContainer}>
                  <LinearGradient
                    colors={['#1E293B', '#334155']}
                    style={styles.statCard}
                  >
                    <Text style={styles.statNumber}>
                      AED {properties.reduce((acc, p) => acc + (p.rentals?.filter((r: any) => r.status === 'ACTIVE' || r.status === 'ENDING').length || 0) * p.monthlyRent, 0)}
                    </Text>
                    <Text style={styles.statLabel}>INCOME</Text>
                  </LinearGradient>
                  <View style={styles.statCardGlow} />
                </View>
              </View>
            </View>

            {/* Recent Activity */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
              <LinearGradient
                colors={['#1E293B', '#334155']}
                style={styles.activityCard}
              >
                <Text style={styles.activityText}>
                  NO RECENT ACTIVITY TO SHOW
                </Text>
              </LinearGradient>
            </View>
          </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  nameText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  userTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
    letterSpacing: 1.2,
    opacity: 0.9,
  },
  logoutButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  logoutGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerLine: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 20,
    opacity: 0.9,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCardContainer: {
    width: (screenWidth - 56) / 2,
    marginBottom: 20,
    position: 'relative',
  },
  actionCard: {
    height: 120,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    zIndex: -1,
    transform: [{ scale: 1.05 }],
  },
  actionIconWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
  },
  notificationDot: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 12,
  },
  emptyState: {
    position: 'relative',
  },
  emptyCard: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  propertyCardContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  propertyCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  propertyCardGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    zIndex: -1,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    flex: 1,
  },
  tenantBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  tenantBadgeText: {
    color: '#22C55E',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  propertyDetails: {
    marginBottom: 16,
  },
  propertyInfo: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  propertyAddress: {
    fontSize: 13,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  endRequestNotificationContainer: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  endRequestNotification: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  endRequestGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    zIndex: -1,
  },
  endRequestIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  endRequestText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1,
    flex: 1,
  },
  endRequestDate: {
    fontSize: 11,
    color: '#94A3B8',
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCardContainer: {
    width: (screenWidth - 72) / 3,
    position: 'relative',
  },
  statCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    minHeight: 100,
    justifyContent: 'center',
  },
  statCardGlow: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 17,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    zIndex: -1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    letterSpacing: 1,
  },
  activityCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  activityText: {
    fontSize: 14,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
});