import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { API_BASE_URL } from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');

export default function LandlordPaymentsScreen({ route, navigation }: any) {
  const { propertyId } = route.params || {};
  const { token } = useSelector((state: RootState) => state.auth);
  const [payments, setPayments] = useState<any[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([
      fetchPayments(),
      fetchUpcomingPayments()
    ]);
    setLoading(false);
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        let paymentsData = data.payments || [];
        // Filter by propertyId if provided
        if (propertyId) {
          paymentsData = paymentsData.filter((p: any) => p.rental.propertyId === propertyId);
        }
        setPayments(paymentsData);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
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
        let paymentsData = data.payments || [];
        // Filter by propertyId if provided
        if (propertyId) {
          paymentsData = paymentsData.filter((p: any) => p.rental.propertyId === propertyId);
        }
        setUpcomingPayments(paymentsData);
      }
    } catch (error) {
      console.error('Failed to fetch upcoming payments:', error);
    }
  };


  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const deletePayment = async (paymentId: string) => {
    setDeletingPayment(paymentId);
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        Alert.alert('Success', 'Payment deleted successfully!');
        fetchData();
      } else {
        const data = await response.json();
        Alert.alert('Error', data.error || 'Failed to delete payment');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setDeletingPayment(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return '#28a745';
      case 'VERIFICATION': return '#17a2b8';
      case 'OVERDUE': return '#dc3545';
      case 'PENDING': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderPayment = ({ item }: { item: any }) => {
    const currentDate = new Date();
    const dueDate = new Date(item.dueDate);
    const gracePeriodDays = item.rental.property.gracePeriodDays || 7;
    const graceEndDate = new Date(dueDate);
    graceEndDate.setDate(graceEndDate.getDate() + gracePeriodDays);
    
    const isOverdue = currentDate > graceEndDate && item.status === 'PENDING';
    const actualStatus = isOverdue ? 'OVERDUE' : item.status;

    const getStatusGradient = () => {
      switch (actualStatus) {
        case 'PAID': return ['#22C55E', '#16A34A'];
        case 'VERIFICATION': return ['#06B6D4', '#0891B2'];
        case 'OVERDUE': return ['#EF4444', '#DC2626'];
        case 'PENDING': return ['#EAB308', '#D97706'];
        default: return ['#64748B', '#475569'];
      }
    };

    return (
      <View style={styles.paymentCardContainer}>
        <LinearGradient
          colors={['#1E293B', '#334155', '#475569']}
          style={styles.paymentCard}
        >
          <View style={styles.paymentHeader}>
            <View style={styles.paymentTitleSection}>
              <Text style={styles.propertyTitle}>{item.rental.property.title.toUpperCase()}</Text>
              <Text style={styles.tenantName}>TENANT: {item.rental.tenant.name.toUpperCase()}</Text>
            </View>
            <LinearGradient
              colors={getStatusGradient()}
              style={styles.statusBadge}
            >
              <Text style={styles.statusText}>{actualStatus}</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.paymentInfo}>
            <Text style={styles.amount}>AED {item.amount}</Text>
            <Text style={styles.dueDate}>DUE: {formatDate(item.dueDate).toUpperCase()}</Text>
          </View>

          {item.paidDate && (
            <View style={styles.paidSection}>
              <MaterialIcons name="check-circle" size={16} color="#22C55E" />
              <Text style={styles.paidDate}>
                PAID ON: {formatDate(item.paidDate).toUpperCase()}
              </Text>
            </View>
          )}

          {item.method && (
            <Text style={styles.paymentDetails}>
              METHOD: {item.method.toUpperCase()} {item.reference && `• REF: ${item.reference}`}
            </Text>
          )}

          {item.status === 'VERIFICATION' && (
            <View style={styles.verificationSection}>
              <MaterialIcons name="hourglass-empty" size={16} color="#06B6D4" />
              <Text style={styles.verificationText}>
                AWAITING YOUR VERIFICATION
              </Text>
            </View>
          )}

          {/* Futuristic delete button for testing */}
          <TouchableOpacity 
            style={styles.deleteButtonContainer}
            onPress={() => deletePayment(item.id)}
            disabled={deletingPayment === item.id}
          >
            <LinearGradient
              colors={deletingPayment === item.id ? ['#64748B', '#64748B'] : ['#EF4444', '#DC2626']}
              style={[styles.deleteButton, deletingPayment === item.id && styles.deleteButtonDisabled]}
            >
              <MaterialIcons 
                name={deletingPayment === item.id ? "hourglass-empty" : "delete"} 
                size={16} 
                color="#FFFFFF" 
              />
              <Text style={styles.deleteButtonText}>
                {deletingPayment === item.id ? 'DELETING...' : 'DELETE (TEST)'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
        <View style={styles.paymentCardGlow} />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0F0F23', '#1A1A2E', '#16213E']}
          style={styles.backgroundGradient}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <TouchableOpacity 
                  onPress={() => navigation.popToTop()} 
                  style={styles.backButton}
                >
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    style={styles.backButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
                <Text style={styles.title}>PAYMENT MANAGEMENT</Text>
              </View>
              <View style={styles.headerLine} />
            </View>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingText}>LOADING PAYMENTS...</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  const totalPending = upcomingPayments.filter(p => p.status === 'PENDING').reduce((acc, p) => acc + p.amount, 0);
  const totalVerification = upcomingPayments.filter(p => p.status === 'VERIFICATION').reduce((acc, p) => acc + p.amount, 0);
  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((acc, p) => acc + p.amount, 0);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0F23', '#1A1A2E', '#16213E']}
        style={styles.backgroundGradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity 
                onPress={() => navigation.popToTop()} 
                style={styles.backButton}
              >
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  style={styles.backButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.title}>PAYMENT MANAGEMENT</Text>
            </View>
            <View style={styles.headerLine} />
          </View>

          <FlatList
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                tintColor="#6366F1"
                colors={['#6366F1']}
              />
            }
            ListHeaderComponent={
              <View>
                {/* Futuristic Stats */}
                <View style={styles.statsContainer}>
                  <View style={styles.statCardContainer}>
                    <LinearGradient
                      colors={['#EAB308', '#D97706']}
                      style={styles.statCard}
                    >
                      <MaterialIcons name="schedule" size={24} color="#FFFFFF" />
                      <Text style={styles.statNumber}>AED {totalPending}</Text>
                      <Text style={styles.statLabel}>PENDING</Text>
                    </LinearGradient>
                  </View>
                  <View style={styles.statCardContainer}>
                    <LinearGradient
                      colors={['#06B6D4', '#0891B2']}
                      style={styles.statCard}
                    >
                      <MaterialIcons name="hourglass-empty" size={24} color="#FFFFFF" />
                      <Text style={styles.statNumber}>AED {totalVerification}</Text>
                      <Text style={styles.statLabel}>VERIFYING</Text>
                    </LinearGradient>
                  </View>
                  <View style={styles.statCardContainer}>
                    <LinearGradient
                      colors={['#22C55E', '#16A34A']}
                      style={styles.statCard}
                    >
                      <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
                      <Text style={styles.statNumber}>AED {totalPaid}</Text>
                      <Text style={styles.statLabel}>COLLECTED</Text>
                    </LinearGradient>
                  </View>
                </View>

                {/* Upcoming Payments */}
                {upcomingPayments.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>UPCOMING PAYMENTS</Text>
                  </View>
                )}
              </View>
            }
            data={[...upcomingPayments, ...payments]}
            renderItem={renderPayment}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            ListEmptyComponent={
              <View style={styles.emptyStateContainer}>
                <LinearGradient
                  colors={['#1E293B', '#334155']}
                  style={styles.emptyState}
                >
                  <View style={styles.emptyIconWrapper}>
                    <MaterialIcons name="account-balance-wallet" size={64} color="#6366F1" />
                  </View>
                  <Text style={styles.emptyTitle}>NO PAYMENTS YET</Text>
                  <Text style={styles.emptyDescription}>
                    GENERATE PAYMENTS FOR EACH PROPERTY INDIVIDUALLY TO START TRACKING RENT COLLECTION
                  </Text>
                </LinearGradient>
              </View>
            }
          />
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 20,
  },
  backButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
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
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 16,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  statCardContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statCard: {
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 1,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 20,
  },
  paymentCardContainer: {
    marginHorizontal: 24,
    marginBottom: 20,
    position: 'relative',
  },
  paymentCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  paymentCardGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    zIndex: -1,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  paymentTitleSection: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  tenantName: {
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  amount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  dueDate: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  paidSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  paidDate: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  paymentDetails: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  emptyStateContainer: {
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  emptyState: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  emptyIconWrapper: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 1,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.5,
  },
  verificationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  verificationText: {
    fontSize: 12,
    color: '#06B6D4',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  deleteButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
});