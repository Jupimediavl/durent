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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { API_BASE_URL } from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');

export default function PastTenantsScreen({ route, navigation }: any) {
  const { propertyId, propertyTitle } = route.params;
  const { token } = useSelector((state: RootState) => state.auth);
  const [pastTenants, setPastTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPastTenants();
  }, []);

  const fetchPastTenants = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/past-tenants`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setPastTenants(data.pastTenants || []);
      }
    } catch (error) {
      console.error('Failed to fetch past tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPeriod = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString();
    const end = new Date(endDate).toLocaleDateString();
    return `${start} - ${end}`;
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return months > 0 ? `${months} months` : '< 1 month';
  };

  const getTotalPaid = (payments: any[]) => {
    return payments
      ?.filter(p => p.status === 'PAID')
      ?.reduce((total, p) => total + p.amount, 0) || 0;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0F23', '#1A1A2E', '#16213E']}
        style={styles.backgroundGradient}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Futuristic Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
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
              <View style={styles.titleContainer}>
                <Text style={styles.title}>PAST TENANTS</Text>
                <Text style={styles.subtitle}>{propertyTitle.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.headerLine} />
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loadingText}>LOADING...</Text>
              </View>
            ) : pastTenants.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <LinearGradient
                  colors={['#1E293B', '#334155']}
                  style={styles.emptyState}
                >
                  <View style={styles.emptyIconWrapper}>
                    <MaterialIcons name="people" size={64} color="#6366F1" />
                  </View>
                  <Text style={styles.emptyTitle}>NO PAST TENANTS</Text>
                  <Text style={styles.emptyDescription}>
                    PAST TENANT HISTORY FOR THIS PROPERTY WILL APPEAR HERE
                  </Text>
                </LinearGradient>
              </View>
            ) : (
              <View style={styles.section}>
                {pastTenants.map((rental) => (
                  <View key={rental.id} style={styles.tenantCardContainer}>
                    <LinearGradient
                      colors={['#1E293B', '#334155', '#475569']}
                      style={styles.tenantCard}
                    >
                      <View style={styles.tenantHeader}>
                        <View style={styles.tenantInfo}>
                          <Text style={styles.tenantName}>{rental.tenant.name.toUpperCase()}</Text>
                          <Text style={styles.tenantEmail}>{rental.tenant.email}</Text>
                          {rental.tenant.phone && (
                            <Text style={styles.tenantPhone}>{rental.tenant.phone}</Text>
                          )}
                        </View>
                        <LinearGradient
                          colors={['#22C55E', '#16A34A']}
                          style={styles.durationBadge}
                        >
                          <Text style={styles.durationText}>{calculateDuration(rental.startDate, rental.endDate).toUpperCase()}</Text>
                        </LinearGradient>
                      </View>
                      
                      <Text style={styles.period}>{formatPeriod(rental.startDate, rental.endDate).toUpperCase()}</Text>
                      
                      <View style={styles.tenantDetails}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>MONTHLY RENT:</Text>
                          <Text style={styles.detailValue}>AED {rental.monthlyRent}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>TOTAL PAID:</Text>
                          <Text style={styles.detailValue}>AED {getTotalPaid(rental.payments)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>PAYMENTS:</Text>
                          <Text style={styles.detailValue}>{rental.payments?.length || 0}</Text>
                        </View>
                      </View>

                      <View style={styles.actionRow}>
                        <TouchableOpacity 
                          style={styles.viewButtonContainer}
                          onPress={() => navigation.navigate('Chat', {
                            propertyId: propertyId,
                            otherUser: rental.tenant,
                            propertyTitle: propertyTitle,
                            isHistorical: true
                          })}
                        >
                          <LinearGradient
                            colors={['#EC4899', '#F97316']}
                            style={styles.viewButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                            <Ionicons name="chatbubbles" size={20} color="#FFFFFF" />
                            <Text style={styles.viewButtonText}>VIEW CHATS</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.viewButtonContainer}
                          onPress={() => navigation.navigate('LandlordPayments', {
                            propertyId: propertyId,
                            tenantId: rental.tenant.id,
                            isHistorical: true
                          })}
                        >
                          <LinearGradient
                            colors={['#8B5CF6', '#6366F1']}
                            style={styles.viewButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                            <MaterialIcons name="payment" size={20} color="#FFFFFF" />
                            <Text style={styles.viewButtonText}>VIEW PAYMENTS</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>
                    <View style={styles.tenantCardGlow} />
                  </View>
                ))}
              </View>
            )}
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
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
    letterSpacing: 1,
  },
  headerLine: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 16,
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
  section: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  tenantCardContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  tenantCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  tenantCardGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    zIndex: -1,
  },
  tenantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  tenantEmail: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  tenantPhone: {
    fontSize: 14,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  durationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  period: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  tenantDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
    paddingTop: 20,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
    letterSpacing: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
  },
  viewButtonContainer: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
});