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
  Modal,
  TextInput,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { API_BASE_URL } from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');

interface ChangeRequest {
  id: string;
  currentDate: number;
  proposedDate: number;
  reason: string;
  expiresAt: string;
  effectiveFrom: string;
  createdAt: string;
  propertyTitle: string;
  proposedBy: {
    id: string;
    name: string;
    email: string;
  };
}

export default function PaymentChangeRequestsScreen({ navigation }: any) {
  const { token } = useSelector((state: RootState) => state.auth);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);
  const [responseNote, setResponseNote] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    fetchChangeRequests();
  }, []);

  const fetchChangeRequests = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payment-date-changes/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setRequests(data.requests || []);
      } else {
        console.error('Failed to fetch change requests:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch change requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchChangeRequests();
  };

  const handleResponseRequest = (request: ChangeRequest) => {
    setSelectedRequest(request);
    setShowResponseModal(true);
  };

  const closeModal = () => {
    setShowResponseModal(false);
    setSelectedRequest(null);
    setResponseNote('');
  };

  const submitResponse = async (approved: boolean) => {
    if (!selectedRequest) return;

    setResponding(true);
    try {
      const response = await fetch(`${API_BASE_URL}/payment-date-changes/${selectedRequest.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          approved,
          responseNote: responseNote.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success', 
          approved 
            ? 'Payment date change request approved successfully!' 
            : 'Payment date change request rejected.'
        );
        closeModal();
        fetchChangeRequests(); // Refresh the list
      } else {
        Alert.alert('Error', data.error || 'Failed to respond to request');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setResponding(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpiringSoon = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry <= 24 && hoursUntilExpiry > 0;
  };

  const renderRequest = (request: ChangeRequest) => (
    <View key={request.id} style={styles.requestCardContainer}>
      <LinearGradient
        colors={['#1E293B', '#334155']}
        style={styles.requestCard}
      >
        {/* Header */}
        <View style={styles.requestHeader}>
          <Text style={styles.propertyTitle}>{request.propertyTitle.toUpperCase()}</Text>
          <View style={styles.statusContainer}>
            {isExpiringSoon(request.expiresAt) && (
              <LinearGradient
                colors={['#EAB308', '#F59E0B']}
                style={styles.urgentBadge}
              >
                <Text style={styles.urgentBadgeText}>URGENT</Text>
              </LinearGradient>
            )}
            <LinearGradient
              colors={['#06B6D4', '#0891B2']}
              style={styles.pendingBadge}
            >
              <Text style={styles.pendingBadgeText}>PENDING</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Request Details */}
        <View style={styles.requestDetails}>
          <View style={styles.dateChangeContainer}>
            <View style={styles.dateItem}>
              <Text style={styles.requestLabel}>CURRENT PAYMENT DATE:</Text>
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.dateBadge}
              >
                <Text style={styles.currentDate}>DAY {request.currentDate}</Text>
              </LinearGradient>
            </View>
            
            <MaterialIcons name="arrow-forward" size={24} color="#94A3B8" />
            
            <View style={styles.dateItem}>
              <Text style={styles.requestLabel}>PROPOSED PAYMENT DATE:</Text>
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                style={styles.dateBadge}
              >
                <Text style={styles.proposedDate}>DAY {request.proposedDate}</Text>
              </LinearGradient>
            </View>
          </View>

          {request.reason && (
            <View style={styles.reasonContainer}>
              <Text style={styles.requestLabel}>REASON:</Text>
              <LinearGradient
                colors={['#0F0F23', '#1A1A2E']}
                style={styles.reasonBox}
              >
                <MaterialIcons name="edit" size={16} color="#8B5CF6" />
                <Text style={styles.reasonText}>{request.reason.toUpperCase()}</Text>
              </LinearGradient>
            </View>
          )}

          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <MaterialIcons name="person" size={16} color="#06B6D4" />
              <Text style={styles.metaLabel}>REQUESTED BY:</Text>
              <Text style={styles.landlordName}>{request.proposedBy.name.toUpperCase()}</Text>
            </View>

            <View style={styles.metaItem}>
              <MaterialIcons name="schedule" size={16} color="#22C55E" />
              <Text style={styles.metaLabel}>EFFECTIVE FROM:</Text>
              <Text style={styles.effectiveDate}>{formatDate(request.effectiveFrom).toUpperCase()}</Text>
            </View>

            <View style={styles.metaItem}>
              <MaterialIcons name="access-time" size={16} color={isExpiringSoon(request.expiresAt) ? "#EF4444" : "#94A3B8"} />
              <Text style={styles.metaLabel}>EXPIRES:</Text>
              <Text style={[
                styles.expiryDate,
                isExpiringSoon(request.expiresAt) && styles.expiryDateUrgent
              ]}>
                {formatDateTime(request.expiresAt).toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.rejectButtonContainer}
            onPress={() => handleResponseRequest(request)}
          >
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.rejectButton}
            >
              <MaterialIcons name="close" size={20} color="#FFFFFF" />
              <Text style={styles.rejectButtonText}>REJECT</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.approveButtonContainer}
            onPress={() => handleResponseRequest(request)}
          >
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              style={styles.approveButton}
            >
              <MaterialIcons name="check" size={20} color="#FFFFFF" />
              <Text style={styles.approveButtonText}>APPROVE</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <View style={styles.requestCardGlow} />
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
              <Text style={styles.title}>PAYMENT DATE REQUESTS</Text>
              <View style={styles.headerLine} />
            </View>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingText}>LOADING REQUESTS...</Text>
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
            <Text style={styles.title}>PAYMENT DATE REQUESTS</Text>
            <View style={styles.headerLine} />
          </View>

          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#6366F1']}
                tintColor="#6366F1"
              />
            }
          >
            {requests.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <LinearGradient
                  colors={['#1E293B', '#334155']}
                  style={styles.emptyState}
                >
                  <MaterialIcons name="schedule" size={48} color="#64748B" />
                  <Text style={styles.emptyTitle}>NO PENDING REQUESTS</Text>
                  <Text style={styles.emptyDescription}>
                    PAYMENT DATE CHANGE REQUESTS FROM YOUR LANDLORD WILL APPEAR HERE
                  </Text>
                </LinearGradient>
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PENDING REQUESTS</Text>
                <View style={styles.requestsList}>
                  {requests.map(renderRequest)}
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* Response Modal */}
      <Modal
        visible={showResponseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['#1E293B', '#334155', '#475569']}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <MaterialIcons name="schedule" size={28} color="#06B6D4" />
              <Text style={styles.modalTitle}>RESPOND TO REQUEST</Text>
            </View>
            
            {selectedRequest && (
              <View style={styles.modalRequestInfo}>
                <Text style={styles.modalPropertyTitle}>{selectedRequest.propertyTitle.toUpperCase()}</Text>
                <View style={styles.modalChangeInfo}>
                  <Text style={styles.modalChangeDescription}>
                    CHANGE PAYMENT DATE FROM DAY <Text style={styles.boldText}>{selectedRequest.currentDate}</Text> TO DAY <Text style={styles.boldText}>{selectedRequest.proposedDate}</Text>
                  </Text>
                </View>
                {selectedRequest.reason && (
                  <View style={styles.modalReasonContainer}>
                    <LinearGradient
                      colors={['#0F0F23', '#1A1A2E']}
                      style={styles.modalReasonBox}
                    >
                      <MaterialIcons name="info" size={16} color="#8B5CF6" />
                      <View style={styles.modalReasonContent}>
                        <Text style={styles.modalReasonLabel}>LANDLORD'S REASON:</Text>
                        <Text style={styles.modalReasonText}>{selectedRequest.reason.toUpperCase()}</Text>
                      </View>
                    </LinearGradient>
                  </View>
                )}
                <Text style={styles.modalEffectiveText}>
                  EFFECTIVE FROM: {formatDate(selectedRequest.effectiveFrom).toUpperCase()}
                </Text>
              </View>
            )}

            {/* Response Note */}
            <View style={styles.responseNoteContainer}>
              <Text style={styles.responseNoteLabel}>RESPONSE NOTE (OPTIONAL):</Text>
              <LinearGradient
                colors={['#0F0F23', '#1A1A2E']}
                style={styles.responseNoteInputContainer}
              >
                <TextInput
                  style={styles.responseNoteInput}
                  value={responseNote}
                  onChangeText={setResponseNote}
                  placeholder="ADD A NOTE ABOUT YOUR DECISION..."
                  placeholderTextColor="#64748B"
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </LinearGradient>
            </View>

            {/* Modal Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButtonContainer}
                onPress={closeModal}
                disabled={responding}
              >
                <LinearGradient
                  colors={['#64748B', '#475569']}
                  style={styles.modalCancelButton}
                >
                  <Text style={styles.modalCancelButtonText}>CANCEL</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalRejectButtonContainer}
                onPress={() => submitResponse(false)}
                disabled={responding}
              >
                <LinearGradient
                  colors={responding ? ['#64748B', '#64748B'] : ['#EF4444', '#DC2626']}
                  style={styles.modalRejectButton}
                >
                  <MaterialIcons 
                    name={responding ? "hourglass-empty" : "close"} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.modalRejectButtonText}>
                    {responding ? 'PROCESSING...' : 'REJECT'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalApproveButtonContainer}
                onPress={() => submitResponse(true)}
                disabled={responding}
              >
                <LinearGradient
                  colors={responding ? ['#64748B', '#64748B'] : ['#22C55E', '#16A34A']}
                  style={styles.modalApproveButton}
                >
                  <MaterialIcons 
                    name={responding ? "hourglass-empty" : "check"} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.modalApproveButtonText}>
                    {responding ? 'PROCESSING...' : 'APPROVE'}
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
  content: {
    flex: 1,
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
  requestsList: {
    gap: 16,
  },
  requestCardContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  requestCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  requestCardGlow: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 17,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    zIndex: -1,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
    letterSpacing: 0.5,
  },
  statusContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  urgentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  pendingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pendingBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  requestDetails: {
    marginBottom: 24,
  },
  dateChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
  },
  requestLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 8,
  },
  dateBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  currentDate: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1,
  },
  proposedDate: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1,
  },
  reasonContainer: {
    marginBottom: 20,
  },
  reasonBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    alignItems: 'flex-start',
  },
  reasonText: {
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 16,
    letterSpacing: 0.5,
    marginLeft: 8,
    flex: 1,
  },
  metaInfo: {
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  landlordName: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  effectiveDate: {
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  expiryDate: {
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  expiryDateUrgent: {
    color: '#EF4444',
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButtonContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  approveButtonContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
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
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginLeft: 12,
  },
  modalRequestInfo: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  modalPropertyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 1,
  },
  modalChangeInfo: {
    marginBottom: 16,
  },
  modalChangeDescription: {
    fontSize: 14,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  boldText: {
    fontWeight: '700',
    color: '#6366F1',
  },
  modalReasonContainer: {
    marginBottom: 16,
  },
  modalReasonBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  modalReasonContent: {
    flex: 1,
    marginLeft: 8,
  },
  modalReasonLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  modalReasonText: {
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  modalEffectiveText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  responseNoteContainer: {
    marginBottom: 32,
  },
  responseNoteLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 12,
  },
  responseNoteInputContainer: {
    borderRadius: 12,
    padding: 2,
  },
  responseNoteInput: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#FFFFFF',
    minHeight: 80,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 8,
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
  modalRejectButtonContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalRejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  modalRejectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  modalApproveButtonContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalApproveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  modalApproveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});