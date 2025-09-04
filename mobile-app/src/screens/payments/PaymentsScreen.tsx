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
  TextInput,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { API_BASE_URL } from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');

export default function PaymentsScreen({ navigation }: any) {
  const { token, user } = useSelector((state: RootState) => state.auth);
  const [payments, setPayments] = useState<any[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
    fetchUpcomingPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setPayments(data.payments || []);
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
        setUpcomingPayments(data.payments || []);
      }
    } catch (error) {
      console.error('Failed to fetch upcoming payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = (payment: any) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setProofImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const confirmPayment = async () => {
    if (!selectedPayment) return;

    setMarkingPaid(true);
    try {
      const response = await fetch(`${API_BASE_URL}/payments/${selectedPayment.id}/paid`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          method: paymentMethod,
          reference: paymentReference,
          proofImage: proofImage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Payment marked as paid!');
        setShowPaymentModal(false);
        setPaymentMethod('');
        setPaymentReference('');
        setProofImage(null);
        fetchPayments();
        fetchUpcomingPayments();
      } else {
        Alert.alert('Error', data.error || 'Failed to mark payment as paid');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setMarkingPaid(false);
    }
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
        fetchPayments();
        fetchUpcomingPayments();
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

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'PAID': return ['#22C55E', '#16A34A'];
      case 'VERIFICATION': return ['#06B6D4', '#0891B2'];
      case 'OVERDUE': return ['#EF4444', '#DC2626'];
      case 'PENDING': return ['#EAB308', '#D97706'];
      default: return ['#64748B', '#475569'];
    }
  };

  const renderPayment = ({ item }: { item: any }) => {
    const currentDate = new Date();
    const dueDate = new Date(item.dueDate);
    const gracePeriodDays = item.rental.property.gracePeriodDays || 7;
    const graceEndDate = new Date(dueDate);
    graceEndDate.setDate(graceEndDate.getDate() + gracePeriodDays);
    
    const isOverdue = currentDate > graceEndDate && item.status === 'PENDING';
    const actualStatus = isOverdue ? 'OVERDUE' : item.status;

    return (
      <View style={styles.paymentCardContainer}>
        <LinearGradient
          colors={['#1E293B', '#334155']}
          style={styles.paymentCard}
        >
          <View style={styles.paymentHeader}>
            <Text style={styles.propertyTitle}>{item.rental.property.title.toUpperCase()}</Text>
            <LinearGradient
              colors={getStatusColors(actualStatus)}
              style={styles.statusBadge}
            >
              <Text style={styles.statusText}>{actualStatus}</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.paymentInfo}>
            <View style={styles.amountContainer}>
              <MaterialIcons name="attach-money" size={24} color="#22C55E" />
              <Text style={styles.amount}>AED {item.amount}</Text>
            </View>
            <Text style={styles.dueDate}>DUE: {formatDate(item.dueDate).toUpperCase()}</Text>
          </View>

          {item.paidDate && (
            <View style={styles.paidContainer}>
              <MaterialIcons name="check-circle" size={16} color="#22C55E" />
              <Text style={styles.paidDate}>
                PAID ON: {formatDate(item.paidDate).toUpperCase()}
              </Text>
            </View>
          )}

          {item.method && (
            <View style={styles.paymentDetailsContainer}>
              <Text style={styles.paymentDetails}>
                METHOD: {item.method.toUpperCase()} {item.reference && `• REF: ${item.reference}`}
              </Text>
            </View>
          )}

          {item.status === 'VERIFICATION' && (
            <View style={styles.verificationContainer}>
              <MaterialIcons name="hourglass-empty" size={16} color="#06B6D4" />
              <Text style={styles.verificationText}>
                PAYMENT SUBMITTED FOR VERIFICATION BY LANDLORD
              </Text>
            </View>
          )}

          {item.status === 'PENDING' && user?.userType === 'TENANT' && (
            <TouchableOpacity 
              style={styles.payButtonContainer}
              onPress={() => handleMarkAsPaid(item)}
            >
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                style={styles.payButton}
              >
                <MaterialIcons name="payment" size={20} color="#FFFFFF" />
                <Text style={styles.payButtonText}>MARK AS PAID</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {user?.userType === 'LANDLORD' && (
            <TouchableOpacity 
              style={styles.deleteButtonContainer}
              onPress={() => deletePayment(item.id)}
              disabled={deletingPayment === item.id}
            >
              <LinearGradient
                colors={deletingPayment === item.id ? ['#64748B', '#64748B'] : ['#EF4444', '#DC2626']}
                style={styles.deleteButton}
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
          )}
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
              <Text style={styles.title}>PAYMENTS</Text>
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
            <Text style={styles.title}>PAYMENTS</Text>
            <View style={styles.headerLine} />
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Upcoming Payments */}
            {upcomingPayments.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>UPCOMING PAYMENTS</Text>
                {upcomingPayments.map((item) => (
                  <View key={item.id}>
                    {renderPayment({ item })}
                  </View>
                ))}
              </View>
            )}

            {/* Payment History */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PAYMENT HISTORY</Text>
              {payments.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <LinearGradient
                    colors={['#1E293B', '#334155']}
                    style={styles.emptyState}
                  >
                    <MaterialIcons name="account-balance-wallet" size={48} color="#64748B" />
                    <Text style={styles.emptyTitle}>NO PAYMENT HISTORY</Text>
                    <Text style={styles.emptyDescription}>
                      PAYMENT RECORDS WILL APPEAR HERE ONCE GENERATED
                    </Text>
                  </LinearGradient>
                </View>
              ) : (
                payments.map((item) => (
                  <View key={item.id}>
                    {renderPayment({ item })}
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* Payment Confirmation Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowPaymentModal(false);
          setPaymentMethod('');
          setPaymentReference('');
          setProofImage(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['#1E293B', '#334155', '#475569']}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <MaterialIcons name="payment" size={28} color="#22C55E" />
              <Text style={styles.modalTitle}>CONFIRM PAYMENT</Text>
            </View>
            
            <Text style={styles.modalDescription}>
              MARK PAYMENT AS PAID FOR {selectedPayment?.rental.property.title?.toUpperCase()}
            </Text>
            
            <View style={styles.modalInfoContainer}>
              <LinearGradient
                colors={['#0F0F23', '#1A1A2E']}
                style={styles.modalInfo}
              >
                <Text style={styles.modalAmount}>AED {selectedPayment?.amount}</Text>
                <Text style={styles.modalDueDate}>
                  DUE: {selectedPayment && formatDate(selectedPayment.dueDate).toUpperCase()}
                </Text>
              </LinearGradient>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PAYMENT METHOD</Text>
                <LinearGradient
                  colors={['#0F0F23', '#1A1A2E']}
                  style={styles.inputContainer}
                >
                  <TextInput
                    style={styles.input}
                    value={paymentMethod}
                    onChangeText={setPaymentMethod}
                    placeholder="E.G., BANK TRANSFER, CASH, CARD"
                    placeholderTextColor="#64748B"
                  />
                </LinearGradient>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>REFERENCE NUMBER (OPTIONAL)</Text>
                <LinearGradient
                  colors={['#0F0F23', '#1A1A2E']}
                  style={styles.inputContainer}
                >
                  <TextInput
                    style={styles.input}
                    value={paymentReference}
                    onChangeText={setPaymentReference}
                    placeholder="TRANSACTION ID, RECEIPT NUMBER, ETC."
                    placeholderTextColor="#64748B"
                  />
                </LinearGradient>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PAYMENT PROOF (OPTIONAL)</Text>
                <TouchableOpacity
                  style={styles.imagePickerContainer}
                  onPress={pickImage}
                >
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    style={styles.imagePickerButton}
                  >
                    <MaterialIcons name="camera-alt" size={24} color="#FFFFFF" />
                    <Text style={styles.imagePickerText}>
                      {proofImage ? 'CHANGE PHOTO' : 'ADD RECEIPT PHOTO'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                {proofImage && (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: proofImage }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.removeImageContainer}
                      onPress={() => setProofImage(null)}
                    >
                      <LinearGradient
                        colors={['#EF4444', '#DC2626']}
                        style={styles.removeImageButton}
                      >
                        <Text style={styles.removeImageText}>REMOVE</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButtonContainer}
                onPress={() => {
                  setShowPaymentModal(false);
                  setPaymentMethod('');
                  setPaymentReference('');
                  setProofImage(null);
                }}
              >
                <LinearGradient
                  colors={['#64748B', '#475569']}
                  style={styles.modalCancelButton}
                >
                  <Text style={styles.modalCancelButtonText}>CANCEL</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalConfirmButtonContainer}
                onPress={confirmPayment}
                disabled={markingPaid}
              >
                <LinearGradient
                  colors={markingPaid ? ['#64748B', '#64748B'] : ['#22C55E', '#16A34A']}
                  style={styles.modalConfirmButton}
                >
                  <Text style={styles.modalConfirmButtonText}>
                    {markingPaid ? 'PROCESSING...' : 'CONFIRM PAYMENT'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
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
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  paymentInfo: {
    marginBottom: 16,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  amount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  dueDate: {
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  paidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  paidDate: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  paymentDetailsContainer: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  paymentDetails: {
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  verificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  verificationText: {
    fontSize: 12,
    color: '#06B6D4',
    marginLeft: 8,
    letterSpacing: 0.5,
    flex: 1,
  },
  payButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  deleteButtonContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyStateContainer: {
    position: 'relative',
  },
  emptyState: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 24,
    padding: 32,
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginLeft: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  modalInfoContainer: {
    marginBottom: 24,
  },
  modalInfo: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  modalAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  modalDueDate: {
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  modalScrollView: {
    maxHeight: 300,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 12,
  },
  inputContainer: {
    borderRadius: 12,
    padding: 2,
  },
  input: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#FFFFFF',
  },
  imagePickerContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  imagePickerText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  imagePreview: {
    marginTop: 16,
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
  },
  removeImageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  removeImageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  modalCancelButtonContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalCancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  modalConfirmButtonContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalConfirmButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});