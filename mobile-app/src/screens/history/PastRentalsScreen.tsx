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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { API_BASE_URL } from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');

export default function PastRentalsScreen({ navigation }: any) {
  const { token } = useSelector((state: RootState) => state.auth);
  const [pastRentals, setPastRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPastRentals();
  }, []);

  const fetchPastRentals = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/my/past-rentals`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setPastRentals(data.pastRentals || []);
      }
    } catch (error) {
      console.error('Failed to fetch past rentals:', error);
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
              <Text style={styles.title}>PAST RENTALS</Text>
              <View style={styles.headerLine} />
            </View>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingText}>LOADING PAST RENTALS...</Text>
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
            <Text style={styles.title}>PAST RENTALS</Text>
            <View style={styles.headerLine} />
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {pastRentals.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <LinearGradient
                  colors={['#1E293B', '#334155']}
                  style={styles.emptyState}
                >
                  <MaterialIcons name="history" size={48} color="#64748B" />
                  <Text style={styles.emptyTitle}>NO PAST RENTALS</Text>
                  <Text style={styles.emptyDescription}>
                    YOUR RENTAL HISTORY WILL APPEAR HERE WHEN YOU COMPLETE TENANCIES
                  </Text>
                </LinearGradient>
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>RENTAL HISTORY</Text>
                {pastRentals.map((rental, index) => (
                  <View key={rental.id} style={styles.rentalCardContainer}>
                    <LinearGradient
                      colors={index % 4 === 0 ? ['#6366F1', '#8B5CF6'] : 
                              index % 4 === 1 ? ['#EC4899', '#F97316'] :
                              index % 4 === 2 ? ['#22C55E', '#10B981'] :
                              ['#8B5CF6', '#EC4899']}
                      style={styles.rentalCard}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.rentalHeader}>
                        <View style={styles.titleContainer}>
                          <Text style={styles.propertyTitle}>{rental.property.title.toUpperCase()}</Text>
                          <LinearGradient
                            colors={['#22C55E', '#16A34A']}
                            style={styles.durationBadge}
                          >
                            <Text style={styles.duration}>{calculateDuration(rental.startDate, rental.endDate).toUpperCase()}</Text>
                          </LinearGradient>
                        </View>
                      </View>
                      
                      <View style={styles.addressContainer}>
                        <MaterialIcons name="location-on" size={16} color="#FFFFFF" />
                        <Text style={styles.propertyAddress}>{rental.property.address.toUpperCase()}</Text>
                      </View>
                      
                      <View style={styles.periodContainer}>
                        <MaterialIcons name="calendar-today" size={16} color="#FFFFFF" />
                        <Text style={styles.period}>{formatPeriod(rental.startDate, rental.endDate).toUpperCase()}</Text>
                      </View>
                      
                      <View style={styles.rentalDetails}>
                        <View style={styles.detailRow}>
                          <View style={styles.detailItem}>
                            <MaterialIcons name="attach-money" size={20} color="#22C55E" />
                            <Text style={styles.detailLabel}>MONTHLY RENT:</Text>
                          </View>
                          <Text style={styles.detailValue}>AED {rental.monthlyRent}</Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                          <View style={styles.detailItem}>
                            <MaterialIcons name="person" size={20} color="#06B6D4" />
                            <Text style={styles.detailLabel}>LANDLORD:</Text>
                          </View>
                          <Text style={styles.detailValue}>{rental.landlord.name.toUpperCase()}</Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                          <View style={styles.detailItem}>
                            <MaterialIcons name="payment" size={20} color="#8B5CF6" />
                            <Text style={styles.detailLabel}>TOTAL PAYMENTS:</Text>
                          </View>
                          <Text style={styles.detailValue}>{rental.payments?.length || 0}</Text>
                        </View>
                      </View>

                      <View style={styles.actionRow}>
                        <TouchableOpacity 
                          style={styles.viewButtonContainer}
                          onPress={() => navigation.navigate('Chat', {
                            propertyId: rental.property.id,
                            otherUser: rental.landlord,
                            propertyTitle: rental.property.title,
                            isHistorical: true
                          })}
                        >
                          <LinearGradient
                            colors={['#0F0F23', '#1A1A2E']}
                            style={styles.viewButton}
                          >
                            <MaterialIcons name="chat" size={16} color="#FFFFFF" />
                            <Text style={styles.viewButtonText}>VIEW CHATS</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.viewButtonContainer}
                          onPress={() => navigation.navigate('Payments', {
                            propertyId: rental.property.id,
                            isHistorical: true
                          })}
                        >
                          <LinearGradient
                            colors={['#0F0F23', '#1A1A2E']}
                            style={styles.viewButton}
                          >
                            <MaterialIcons name="account-balance-wallet" size={16} color="#FFFFFF" />
                            <Text style={styles.viewButtonText}>VIEW PAYMENTS</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>
                    <View style={styles.rentalCardGlow} />
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
  rentalCardContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  rentalCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rentalCardGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    zIndex: -1,
  },
  rentalHeader: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    letterSpacing: 0.5,
    marginRight: 12,
  },
  durationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  duration: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  propertyAddress: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
    letterSpacing: 0.5,
  },
  periodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  period: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  rentalDetails: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  viewButtonContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
});