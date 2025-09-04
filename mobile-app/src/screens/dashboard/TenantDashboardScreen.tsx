import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
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

export default function TenantDashboardScreen({ navigation }: any) {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  useNotifications(navigation); // Initialize notifications with navigation
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [upcomingPayments, setUpcomingPayments] = useState<any[]>([]);
  const [pendingChangeRequests, setPendingChangeRequests] = useState(0);
  const [cancellingEnd, setCancellingEnd] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refreshData = async () => {
    await Promise.all([
      fetchProperties(false),
      fetchUnreadMessages(),
      fetchUpcomingPayments(),
      fetchPendingChangeRequests()
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
    fetchUpcomingPayments();
    fetchPendingChangeRequests();
    const interval = setInterval(() => {
      fetchProperties(false);
      fetchUnreadMessages();
      fetchUpcomingPayments();
      fetchPendingChangeRequests();
    }, 10000); // Changed to 10s for faster updates
    return () => clearInterval(interval);
  }, []);

  const fetchProperties = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/properties`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setProperties(data.properties || []);
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

  const fetchUpcomingPayments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/upcoming`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setUpcomingPayments(data.payments || []);
      }
    } catch (error) {
      console.error('Failed to fetch upcoming payments:', error);
    }
  };

  const fetchPendingChangeRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment-date-changes/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setPendingChangeRequests(data.requests ? data.requests.length : 0);
      }
    } catch (error) {
      console.error('Failed to fetch pending change requests:', error);
    }
  };

  const handleCancelEnd = async (property: any) => {
    setCancellingEnd(true);
    try {
      const response = await fetch(`${API_BASE_URL}/rentals/${property.rentalId}/cancel-end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setProperties(prev => prev.map(prop => 
          prop.rentalId === property.rentalId 
            ? { ...prop, endRequest: null }
            : prop
        ));
        
        Alert.alert(
          'Request Cancelled', 
          'End rental request has been cancelled.'
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to cancel end request');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setCancellingEnd(false);
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
                  <Text style={styles.userTypeText}>TENANT</Text>
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

            {/* Property Search Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>FIND PROPERTIES</Text>
              <TouchableOpacity 
                style={styles.searchCardContainer}
                onPress={() => navigation.navigate('SearchProperties')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6', '#EC4899']}
                  style={styles.searchCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.searchCardContent}>
                    <View style={styles.searchIconWrapper}>
                      <MaterialIcons name="search" size={32} color="#FFFFFF" />
                    </View>
                    <View style={styles.searchTextContainer}>
                      <Text style={styles.searchCardTitle}>SEARCH AVAILABLE PROPERTIES</Text>
                      <Text style={styles.searchCardSubtitle}>
                        Find your next home in Dubai with advanced filters
                      </Text>
                    </View>
                    <MaterialIcons name="arrow-forward" size={24} color="#FFFFFF" />
                  </View>
                </LinearGradient>
                <View style={styles.searchCardGlow} />
              </TouchableOpacity>
            </View>

            {/* Quick Actions Grid */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('JoinProperty')}
                  disabled={properties.length > 0}
                  activeOpacity={properties.length > 0 ? 0.5 : 0.7}
                >
                  <View style={styles.actionCardContainer}>
                    <LinearGradient
                      colors={properties.length > 0 ? ['#64748B', '#64748B'] : ['#6366F1', '#8B5CF6']}
                      style={[styles.actionCard, properties.length > 0 && styles.disabledCard]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.actionIconWrapper}>
                        <MaterialIcons 
                          name={properties.length > 0 ? "home-filled" : "home"} 
                          size={28} 
                          color={properties.length > 0 ? "#94A3B8" : "#FFFFFF"} 
                        />
                      </View>
                      <Text style={[styles.actionTitle, properties.length > 0 && styles.disabledText]}>
                        {properties.length > 0 ? "JOINED" : "JOIN"}
                      </Text>
                      <Text style={[styles.actionSubtitle, properties.length > 0 && styles.disabledText]}>
                        PROPERTY
                      </Text>
                    </LinearGradient>
                    <View style={styles.cardGlow} />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => navigation.navigate('Payments')}>
                  <View style={styles.actionCardContainer}>
                    <LinearGradient
                      colors={['#8B5CF6', '#EC4899']}
                      style={styles.actionCard}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.actionIconWrapper}>
                        <MaterialIcons name="payment" size={28} color="#FFFFFF" />
                      </View>
                      <Text style={styles.actionTitle}>PAY</Text>
                      <Text style={styles.actionSubtitle}>RENT</Text>
                    </LinearGradient>
                    <View style={styles.cardGlow} />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => navigation.navigate('Conversations')}>
                  <View style={styles.actionCardContainer}>
                    <LinearGradient
                      colors={['#EC4899', '#F97316']}
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
                      <Text style={styles.actionTitle}>CHAT</Text>
                      <Text style={styles.actionSubtitle}>MESSAGES</Text>
                    </LinearGradient>
                    <View style={styles.cardGlow} />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => navigation.navigate('Payments')}>
                  <View style={styles.actionCardContainer}>
                    <LinearGradient
                      colors={['#F97316', '#EAB308']}
                      style={styles.actionCard}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.actionIconWrapper}>
                        <MaterialIcons name="history" size={28} color="#FFFFFF" />
                      </View>
                      <Text style={styles.actionTitle}>HISTORY</Text>
                      <Text style={styles.actionSubtitle}>PAYMENTS</Text>
                    </LinearGradient>
                    <View style={styles.cardGlow} />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('PastRentals')}>
                  <View style={styles.actionCardContainer}>
                    <LinearGradient
                      colors={['#EAB308', '#22C55E']}
                      style={styles.actionCard}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.actionIconWrapper}>
                        <MaterialIcons name="apartment" size={28} color="#FFFFFF" />
                      </View>
                      <Text style={styles.actionTitle}>PAST</Text>
                      <Text style={styles.actionSubtitle}>RENTALS</Text>
                    </LinearGradient>
                    <View style={styles.cardGlow} />
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => navigation.navigate('PaymentChangeRequests')}>
                  <View style={styles.actionCardContainer}>
                    <LinearGradient
                      colors={['#22C55E', '#06B6D4']}
                      style={styles.actionCard}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.actionIconWrapper}>
                        <MaterialIcons name="event" size={28} color="#FFFFFF" />
                        {pendingChangeRequests > 0 && (
                          <View style={styles.notificationDot}>
                            <Text style={styles.notificationText}>{pendingChangeRequests}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.actionTitle}>DATE</Text>
                      <Text style={styles.actionSubtitle}>REQUESTS</Text>
                    </LinearGradient>
                    <View style={styles.cardGlow} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Current Rentals */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>MY RENTALS</Text>
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
                    <Text style={styles.emptyIcon}>🏡</Text>
                    <Text style={styles.emptyTitle}>NO PROPERTIES YET</Text>
                    <Text style={styles.emptyDescription}>
                      Join a property using an invite code from your landlord
                    </Text>
                    <TouchableOpacity 
                      style={styles.primaryButton}
                      onPress={() => navigation.navigate('JoinProperty')}
                    >
                      <LinearGradient
                        colors={['#6366F1', '#8B5CF6']}
                        style={styles.buttonGradient}
                      >
                        <Text style={styles.primaryButtonText}>JOIN PROPERTY</Text>
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
                        style={[
                          styles.propertyCard,
                          property.endRequest && styles.endingPropertyCard
                        ]}
                      >
                        <View style={styles.propertyHeader}>
                          <Text style={styles.propertyTitle}>{property.title.toUpperCase()}</Text>
                          {property.endRequest && property.endRequest.status === 'PENDING' && (
                            <View style={styles.endingBadgeContainer}>
                              <LinearGradient
                                colors={['#EF4444', '#DC2626']}
                                style={styles.endingBadge}
                              >
                                <Text style={styles.endingBadgeText}>ENDING</Text>
                              </LinearGradient>
                            </View>
                          )}
                        </View>
                        
                        {property.endRequest && property.endRequest.status === 'PENDING' && (
                          <View style={styles.endRequestInfoContainer}>
                            <LinearGradient
                              colors={property.endRequest.requestedBy.id === user?.id 
                                ? ['#EF4444', '#DC2626', '#B91C1C']
                                : ['#F97316', '#EA580C', '#DC2626']
                              }
                              style={styles.endRequestInfo}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                            >
                              <View style={styles.endRequestIconWrapper}>
                                <MaterialIcons 
                                  name={property.endRequest.requestedBy.id === user?.id ? "exit-to-app" : "notification-important"} 
                                  size={20} 
                                  color="#FFFFFF" 
                                />
                                <Text style={styles.endRequestText}>
                                  {property.endRequest.requestedBy.id === user?.id 
                                    ? 'YOU REQUESTED TO END RENTAL'
                                    : `${property.endRequest.requestedBy.name.toUpperCase()} WANTS TO END RENTAL`}
                                </Text>
                              </View>
                              {property.endRequest.reason && (
                                <Text style={styles.endRequestReason}>
                                  REASON: {property.endRequest.reason.toUpperCase()}
                                </Text>
                              )}
                              <Text style={styles.endRequestDate}>
                                AUTO-ACCEPTS: {new Date(property.endRequest.autoAcceptAt).toLocaleDateString().toUpperCase()}
                              </Text>
                            </LinearGradient>
                            <View style={styles.endRequestInfoGlow} />
                          </View>
                        )}
                        
                        {property.endRequest && property.endRequest.requestedBy.id === user?.id && (
                          <TouchableOpacity 
                            style={[styles.cancelButton, cancellingEnd && styles.cancelButtonDisabled]}
                            onPress={() => handleCancelEnd(property)}
                            disabled={cancellingEnd}
                            activeOpacity={0.7}
                          >
                            <LinearGradient
                              colors={cancellingEnd ? ['#64748B', '#64748B'] : ['#EF4444', '#DC2626']}
                              style={styles.cancelButtonGradient}
                            >
                              <Text style={styles.cancelButtonText}>
                                {cancellingEnd ? 'CANCELLING...' : 'CANCEL REQUEST'}
                              </Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        )}
                        
                        <View style={styles.propertyDetails}>
                          <Text style={styles.propertyInfo}>
                            {property.bedrooms} BR • {property.bathrooms} BA • AED {property.monthlyRent}/MONTH
                          </Text>
                          <Text style={styles.propertyAddress}>{property.address.toUpperCase()}</Text>
                        </View>
                        
                        <View style={styles.rentStatus}>
                          <View style={styles.statusIndicator}>
                            <Text style={styles.rentStatusText}>
                              {property.endRequest ? 'RENTAL ENDING SOON' : `NEXT PAYMENT: AED ${property.monthlyRent}`}
                            </Text>
                          </View>
                        </View>
                      </LinearGradient>
                      <View style={styles.propertyCardGlow} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Upcoming Payments */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>UPCOMING PAYMENTS</Text>
              {upcomingPayments.length === 0 ? (
                <LinearGradient
                  colors={['#1E293B', '#334155']}
                  style={styles.paymentEmptyCard}
                >
                  <Text style={styles.paymentEmptyText}>
                    NO PAYMENTS DUE AT THE MOMENT
                  </Text>
                </LinearGradient>
              ) : (
                upcomingPayments.map((payment) => {
                  const currentDate = new Date();
                  const dueDate = new Date(payment.dueDate);
                  const gracePeriodDays = payment.rental.property.gracePeriodDays || 7;
                  const graceEndDate = new Date(dueDate);
                  graceEndDate.setDate(graceEndDate.getDate() + gracePeriodDays);
                  
                  const isOverdue = currentDate > graceEndDate && payment.status === 'PENDING';
                  const getStatusText = () => {
                    if (payment.status === 'VERIFICATION') return 'VERIFYING';
                    if (isOverdue) return 'OVERDUE';
                    return 'DUE';
                  };
                  
                  const getStatusColors = () => {
                    if (payment.status === 'VERIFICATION') return ['#06B6D4', '#0891B2'];
                    if (isOverdue) return ['#EF4444', '#DC2626'];
                    return ['#EAB308', '#D97706'];
                  };
                  
                  return (
                    <TouchableOpacity 
                      key={payment.id} 
                      style={styles.paymentCardContainer}
                      onPress={() => navigation.navigate('Payments')}
                    >
                      <LinearGradient
                        colors={['#1E293B', '#334155']}
                        style={styles.paymentCard}
                      >
                        <View style={styles.paymentHeader}>
                          <Text style={styles.paymentAmount}>AED {payment.amount}</Text>
                          <LinearGradient
                            colors={getStatusColors()}
                            style={styles.paymentStatusBadge}
                          >
                            <Text style={styles.paymentStatusText}>
                              {getStatusText()}
                            </Text>
                          </LinearGradient>
                        </View>
                        <Text style={styles.paymentProperty}>{payment.rental.property.title.toUpperCase()}</Text>
                        <Text style={styles.paymentDate}>
                          DUE: {new Date(payment.dueDate).toLocaleDateString()}
                        </Text>
                      </LinearGradient>
                      <View style={styles.paymentCardGlow} />
                    </TouchableOpacity>
                  );
                })
              )}
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
  disabledCard: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#94A3B8',
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
  endingPropertyCard: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
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
  endingBadgeContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  endingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  endingBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  endRequestInfoContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  endRequestInfo: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  endRequestInfoGlow: {
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
    marginBottom: 8,
  },
  endRequestReason: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  endRequestDate: {
    fontSize: 11,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  cancelButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  cancelButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
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
  rentStatus: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
    paddingTop: 16,
  },
  statusIndicator: {
    alignSelf: 'flex-start',
  },
  rentStatusText: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  paymentCardContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  paymentCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  paymentCardGlow: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 17,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    zIndex: -1,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  paymentStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  paymentProperty: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  paymentDate: {
    fontSize: 12,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  paymentEmptyCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  paymentEmptyText: {
    fontSize: 14,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  searchCardContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  searchCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchCardGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    zIndex: -1,
  },
  searchCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  searchIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchTextContainer: {
    flex: 1,
  },
  searchCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 4,
  },
  searchCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
});