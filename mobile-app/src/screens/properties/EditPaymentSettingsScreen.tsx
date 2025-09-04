import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { API_BASE_URL } from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');

export default function EditPaymentSettingsScreen({ route, navigation }: any) {
  const { property } = route.params;
  const { token } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [paymentDueDay, setPaymentDueDay] = useState(property.paymentDueDay?.toString() || '');
  const [gracePeriodDays, setGracePeriodDays] = useState(property.gracePeriodDays?.toString() || '7');
  const [changeReason, setChangeReason] = useState('');
  const [hasActiveTenant, setHasActiveTenant] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    checkPropertyStatus();
  }, []);

  const checkPropertyStatus = async () => {
    try {
      // Check if property has active tenant and pending requests
      const response = await fetch(`${API_BASE_URL}/properties`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        const currentProperty = data.properties.find((p: any) => p.id === property.id);
        if (currentProperty) {
          const activeTenants = currentProperty.rentals?.filter((r: any) => r.status === 'ACTIVE' || r.status === 'ENDING') || [];
          setHasActiveTenant(activeTenants.length > 0);
        }
      }

      // Check for pending change requests
      const historyResponse = await fetch(`${API_BASE_URL}/payment-date-changes/property/${property.id}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        const pending = historyData.history?.find((r: any) => r.status === 'PENDING');
        setPendingRequest(pending);
      }
    } catch (error) {
      console.error('Error checking property status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSave = async () => {
    if (!paymentDueDay) {
      Alert.alert('Error', 'Please set the payment due day');
      return;
    }

    const dueDay = parseInt(paymentDueDay);
    const graceDays = parseInt(gracePeriodDays);

    if (dueDay < 1 || dueDay > 31) {
      Alert.alert('Error', 'Payment due day must be between 1 and 31');
      return;
    }

    if (graceDays < 0 || graceDays > 30) {
      Alert.alert('Error', 'Grace period must be between 0 and 30 days');
      return;
    }

    setLoading(true);
    try {
      // If no initial payment date set OR no active tenant, update directly
      if (!property.paymentDueDay || !hasActiveTenant) {
        const response = await fetch(`${API_BASE_URL}/properties/${property.id}/payment-settings`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentDueDay: dueDay,
            gracePeriodDays: graceDays,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          Alert.alert('Success', 'Payment settings updated successfully!', [
            { 
              text: 'OK', 
              onPress: () => {
                navigation.navigate('PropertyDetails', { 
                  property: { ...property, ...data.property } 
                });
              }
            }
          ]);
        } else {
          Alert.alert('Error', data.error || 'Failed to update settings');
        }
      } else {
        // Has active tenant and existing payment date - need to create change request
        if (!changeReason && dueDay !== property.paymentDueDay) {
          Alert.alert('Info', 'Please provide a reason for changing the payment date');
          setLoading(false);
          return;
        }

        // Create change request for payment date
        if (dueDay !== property.paymentDueDay) {
          const response = await fetch(`${API_BASE_URL}/payment-date-changes/propose`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              propertyId: property.id,
              proposedDate: dueDay,
              reason: changeReason,
            }),
          });

          const data = await response.json();

          if (response.ok) {
            // Update grace period directly (doesn't need approval)
            if (graceDays !== property.gracePeriodDays) {
              await fetch(`${API_BASE_URL}/properties/${property.id}/payment-settings`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  gracePeriodDays: graceDays,
                }),
              });
            }

            Alert.alert(
              'Request Sent', 
              'Payment date change request has been sent to tenant for approval. It will take effect next month if approved.',
              [
                { 
                  text: 'OK', 
                  onPress: () => navigation.navigate('PropertyDetails', { 
                    property: { ...property, hasPendingChangeRequest: true } 
                  })
                }
              ]
            );
          } else {
            Alert.alert('Error', data.error || 'Failed to send change request');
          }
        } else {
          // Only grace period changed
          const response = await fetch(`${API_BASE_URL}/properties/${property.id}/payment-settings`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              gracePeriodDays: graceDays,
            }),
          });

          const data = await response.json();

          if (response.ok) {
            Alert.alert('Success', 'Grace period updated successfully!', [
              { 
                text: 'OK', 
                onPress: () => navigation.navigate('PropertyDetails', { 
                  property: { ...property, gracePeriodDays: graceDays } 
                })
              }
            ]);
          } else {
            Alert.alert('Error', data.error || 'Failed to update grace period');
          }
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0F0F23', '#1A1A2E', '#16213E']}
          style={styles.backgroundGradient}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingText}>LOADING PAYMENT SETTINGS...</Text>
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
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardContainer}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
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
                <Text style={styles.title}>PAYMENT SETTINGS</Text>
                <View style={styles.headerLine} />
              </View>

              <View style={styles.form}>
                <View style={styles.section}>
                  <Text style={styles.propertyTitle}>{property.title.toUpperCase()}</Text>
                  
                  {pendingRequest && (
                    <View style={styles.warningContainer}>
                      <LinearGradient
                        colors={['#EAB308', '#F59E0B']}
                        style={styles.warningBox}
                      >
                        <MaterialIcons name="hourglass-empty" size={24} color="#FFFFFF" />
                        <View style={styles.warningContent}>
                          <Text style={styles.warningTitle}>PENDING CHANGE REQUEST</Text>
                          <Text style={styles.warningText}>
                            REQUESTED CHANGE FROM DAY {pendingRequest.currentDate} TO DAY {pendingRequest.proposedDate}. WAITING FOR TENANT APPROVAL.
                          </Text>
                        </View>
                      </LinearGradient>
                    </View>
                  )}

                  {hasActiveTenant && property.paymentDueDay && (
                    <View style={styles.infoContainer}>
                      <LinearGradient
                        colors={['#06B6D4', '#0891B2']}
                        style={styles.infoBox}
                      >
                        <MaterialIcons name="info" size={24} color="#FFFFFF" />
                        <View style={styles.infoContent}>
                          <Text style={styles.infoTitle}>TENANT APPROVAL REQUIRED</Text>
                          <Text style={styles.infoText}>
                            SINCE YOU HAVE AN ACTIVE TENANT, CHANGING THE PAYMENT DATE REQUIRES THEIR APPROVAL. THE CHANGE WILL TAKE EFFECT FROM NEXT MONTH IF APPROVED.
                          </Text>
                        </View>
                      </LinearGradient>
                    </View>
                  )}
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>PAYMENT DUE DAY *</Text>
                    <Text style={styles.description}>
                      DAY OF THE MONTH WHEN RENT PAYMENT IS DUE (1-31)
                    </Text>
                    <View style={styles.inputContainer}>
                      <LinearGradient
                        colors={['#1E293B', '#334155']}
                        style={styles.inputBackground}
                      >
                        <MaterialIcons name="calendar-today" size={20} color="#6366F1" />
                        <TextInput
                          style={styles.input}
                          value={paymentDueDay}
                          onChangeText={setPaymentDueDay}
                          placeholder="E.G., 1, 15, 30"
                          placeholderTextColor="#64748B"
                          keyboardType="numeric"
                          editable={!pendingRequest}
                        />
                      </LinearGradient>
                      <View style={styles.inputGlow} />
                    </View>
                  </View>

                  {hasActiveTenant && property.paymentDueDay && (paymentDueDay !== property.paymentDueDay?.toString()) && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>REASON FOR CHANGE *</Text>
                      <Text style={styles.description}>
                        EXPLAIN WHY YOU NEED TO CHANGE THE PAYMENT DATE
                      </Text>
                      <View style={styles.inputContainer}>
                        <LinearGradient
                          colors={['#1E293B', '#334155']}
                          style={styles.textAreaBackground}
                        >
                          <MaterialIcons name="edit" size={20} color="#8B5CF6" />
                          <TextInput
                            style={[styles.input, styles.textArea]}
                            value={changeReason}
                            onChangeText={setChangeReason}
                            placeholder="E.G., ALIGNING WITH SALARY PAYMENT DATES"
                            placeholderTextColor="#64748B"
                            multiline
                            numberOfLines={3}
                            editable={!pendingRequest}
                          />
                        </LinearGradient>
                        <View style={styles.inputGlow} />
                      </View>
                    </View>
                  )}

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>GRACE PERIOD (DAYS)</Text>
                    <Text style={styles.description}>
                      NUMBER OF DAYS AFTER DUE DATE BEFORE PAYMENT BECOMES OVERDUE
                    </Text>
                    <View style={styles.inputContainer}>
                      <LinearGradient
                        colors={['#1E293B', '#334155']}
                        style={styles.inputBackground}
                      >
                        <MaterialIcons name="access-time" size={20} color="#22C55E" />
                        <TextInput
                          style={styles.input}
                          value={gracePeriodDays}
                          onChangeText={setGracePeriodDays}
                          placeholder="E.G., 7"
                          placeholderTextColor="#64748B"
                          keyboardType="numeric"
                          editable={!pendingRequest}
                        />
                      </LinearGradient>
                      <View style={styles.inputGlow} />
                    </View>
                  </View>

                  <View style={styles.exampleContainer}>
                    <LinearGradient
                      colors={['#1E293B', '#334155']}
                      style={styles.exampleSection}
                    >
                      <MaterialIcons name="info-outline" size={20} color="#06B6D4" />
                      <View style={styles.exampleContent}>
                        <Text style={styles.exampleTitle}>EXAMPLE:</Text>
                        <Text style={styles.exampleText}>
                          {paymentDueDay ? (
                            `• PAYMENT DUE: ${paymentDueDay} OF EACH MONTH\n• GRACE PERIOD UNTIL: ${paymentDueDay && gracePeriodDays ? 
                              parseInt(paymentDueDay) + parseInt(gracePeriodDays) > 31 ? 
                                `${parseInt(paymentDueDay) + parseInt(gracePeriodDays) - 31} OF NEXT MONTH` :
                                `${parseInt(paymentDueDay) + parseInt(gracePeriodDays)} OF SAME MONTH`
                              : 'N/A'}`
                          ) : 'SET PAYMENT DUE DAY TO SEE EXAMPLE'}
                        </Text>
                        {paymentDueDay && parseInt(paymentDueDay) > 28 && (
                          <Text style={styles.exampleWarning}>
                            ⚠️ FOR MONTHS WITH FEWER DAYS (LIKE FEBRUARY), PAYMENT WILL BE DUE ON THE LAST DAY OF THE MONTH
                          </Text>
                        )}
                      </View>
                    </LinearGradient>
                  </View>

                  <TouchableOpacity 
                    style={styles.saveButtonContainer}
                    onPress={handleSave}
                    disabled={loading || pendingRequest}
                  >
                    <LinearGradient
                      colors={(loading || pendingRequest) ? ['#64748B', '#64748B'] : ['#22C55E', '#16A34A']}
                      style={styles.saveButton}
                    >
                      <MaterialIcons 
                        name={loading ? "hourglass-empty" : pendingRequest ? "schedule" : "save"} 
                        size={24} 
                        color="#FFFFFF" 
                      />
                      <Text style={styles.saveButtonText}>
                        {loading ? 'PROCESSING...' : pendingRequest ? 'REQUEST PENDING' : 
                          (hasActiveTenant && property.paymentDueDay && paymentDueDay !== property.paymentDueDay?.toString()) 
                            ? 'SEND CHANGE REQUEST' : 'SAVE SETTINGS'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
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
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
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
  form: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
  },
  propertyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 1,
  },
  warningContainer: {
    marginBottom: 24,
  },
  warningBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 1,
  },
  warningText: {
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  infoContainer: {
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 1,
  },
  infoText: {
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  description: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  inputContainer: {
    position: 'relative',
  },
  inputBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  textAreaBackground: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  inputGlow: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 13,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    zIndex: -1,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  exampleContainer: {
    marginBottom: 32,
  },
  exampleSection: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  exampleContent: {
    flex: 1,
    marginLeft: 12,
  },
  exampleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#06B6D4',
    marginBottom: 8,
    letterSpacing: 1,
  },
  exampleText: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  exampleWarning: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  saveButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
});