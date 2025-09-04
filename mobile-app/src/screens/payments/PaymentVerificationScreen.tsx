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
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { API_BASE_URL } from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');

export default function PaymentVerificationScreen({ route, navigation }: any) {
  const { propertyId } = route.params || {};
  const { token } = useSelector((state: RootState) => state.auth);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentsForVerification();
  }, []);

  const fetchPaymentsForVerification = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/verification`, {
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
      console.error('Failed to fetch payments for verification:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentId: string, approved: boolean) => {
    setVerifying(paymentId);
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ approved }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success', 
          approved ? 'Payment approved!' : 'Payment rejected. Tenant will be notified.'
        );
        fetchPaymentsForVerification();
      } else {
        Alert.alert('Error', data.error || 'Failed to verify payment');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setVerifying(null);
    }
  };

  const showProofImage = (proofImage: string) => {
    setSelectedImage(proofImage);
    setShowImageModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderPayment = ({ item }: { item: any }) => (
    <View style={styles.paymentCardContainer}>
      <LinearGradient
        colors={['#1E293B', '#334155', '#475569']}
        style={styles.paymentCard}
      >
        <View style={styles.paymentHeader}>
          <Text style={styles.propertyTitle}>{item.rental.property.title.toUpperCase()}</Text>
          <LinearGradient
            colors={['#06B6D4', '#0891B2']}
            style={styles.statusBadge}
          >
            <Text style={styles.statusText}>VERIFICATION</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.paymentInfo}>
          <Text style={styles.amount}>AED {item.amount}</Text>
          <Text style={styles.dueDate}>DUE: {formatDate(item.dueDate).toUpperCase()}</Text>
        </View>

        <View style={styles.tenantInfo}>
          <MaterialIcons name="person" size={16} color="#94A3B8" />
          <Text style={styles.tenantLabel}>TENANT:</Text>
          <Text style={styles.tenantName}>{item.rental.tenant.name.toUpperCase()}</Text>
        </View>

        <View style={styles.submittedSection}>
          <MaterialIcons name="schedule" size={16} color="#06B6D4" />
          <Text style={styles.submittedDate}>
            SUBMITTED: {formatDate(item.paidDate).toUpperCase()}
          </Text>
        </View>

        {item.method && (
          <View style={styles.paymentDetailsSection}>
            <MaterialIcons name="payment" size={16} color="#64748B" />
            <Text style={styles.paymentDetails}>
              METHOD: {item.method.toUpperCase()} {item.reference && `• REF: ${item.reference}`}
            </Text>
          </View>
        )}

        {item.proofImage && (
          <TouchableOpacity 
            style={styles.proofButtonContainer}
            onPress={() => showProofImage(item.proofImage)}
          >
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              style={styles.proofButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialIcons name="photo-camera" size={16} color="#FFFFFF" />
              <Text style={styles.proofButtonText}>VIEW RECEIPT</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.rejectButtonContainer}
            onPress={() => verifyPayment(item.id, false)}
            disabled={verifying === item.id}
          >
            <LinearGradient
              colors={verifying === item.id ? ['#64748B', '#64748B'] : ['#EF4444', '#DC2626']}
              style={[styles.actionButton, verifying === item.id && styles.actionButtonDisabled]}
            >
              <MaterialIcons 
                name={verifying === item.id ? "hourglass-empty" : "close"} 
                size={18} 
                color="#FFFFFF" 
              />
              <Text style={styles.actionButtonText}>
                {verifying === item.id ? 'PROCESSING...' : 'REJECT'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.approveButtonContainer}
            onPress={() => verifyPayment(item.id, true)}
            disabled={verifying === item.id}
          >
            <LinearGradient
              colors={verifying === item.id ? ['#64748B', '#64748B'] : ['#22C55E', '#16A34A']}
              style={[styles.actionButton, verifying === item.id && styles.actionButtonDisabled]}
            >
              <MaterialIcons 
                name={verifying === item.id ? "hourglass-empty" : "check"} 
                size={18} 
                color="#FFFFFF" 
              />
              <Text style={styles.actionButtonText}>
                {verifying === item.id ? 'PROCESSING...' : 'APPROVE'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <View style={styles.paymentCardGlow} />
    </View>
  );

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
                <Text style={styles.title}>PAYMENT VERIFICATION</Text>
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
              <Text style={styles.title}>PAYMENT VERIFICATION</Text>
            </View>
            <View style={styles.headerLine} />
          </View>

          <View style={styles.content}>
            {payments.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <LinearGradient
                  colors={['#1E293B', '#334155']}
                  style={styles.emptyState}
                >
                  <View style={styles.emptyIconWrapper}>
                    <MaterialIcons name="verified" size={64} color="#22C55E" />
                  </View>
                  <Text style={styles.emptyTitle}>NO PAYMENTS TO VERIFY</Text>
                  <Text style={styles.emptyDescription}>
                    ALL PAYMENTS HAVE BEEN PROCESSED
                  </Text>
                </LinearGradient>
              </View>
            ) : (
              <FlatList
                data={payments}
                renderItem={renderPayment}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>

          {/* Futuristic Image Modal */}
          <Modal
            visible={showImageModal}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setShowImageModal(false)}
          >
            <View style={styles.imageModalOverlay}>
              <LinearGradient
                colors={['rgba(15, 15, 35, 0.95)', 'rgba(26, 26, 46, 0.95)']}
                style={styles.imageModalContent}
              >
                <TouchableOpacity
                  style={styles.closeButtonContainer}
                  onPress={() => setShowImageModal(false)}
                >
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    style={styles.closeButton}
                  >
                    <MaterialIcons name="close" size={24} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
                {selectedImage && (
                  <Image source={{ uri: selectedImage }} style={styles.fullImage} />
                )}
              </LinearGradient>
            </View>
          </Modal>
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
  content: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
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
    alignItems: 'center',
    marginBottom: 16,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
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
  tenantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  tenantLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  tenantName: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  submittedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  submittedDate: {
    fontSize: 12,
    color: '#06B6D4',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  paymentDetailsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  paymentDetails: {
    fontSize: 12,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  proofButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  proofButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  proofButtonText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  rejectButtonContainer: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  approveButtonContainer: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
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
  imageModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContent: {
    width: '95%',
    height: '95%',
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
    borderRadius: 25,
    overflow: 'hidden',
  },
  closeButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  fullImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});