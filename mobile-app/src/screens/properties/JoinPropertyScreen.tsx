import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { API_BASE_URL } from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');

interface PropertyDetails {
  id: string;
  title: string;
  address: string;
  description?: string;
  paymentDueDay?: number;
  gracePeriod?: number;
  hasPaymentSettings: boolean;
  rental: {
    id: string;
    monthlyRent: number;
  };
}

export default function JoinPropertyScreen({ navigation }: any) {
  const { token } = useSelector((state: RootState) => state.auth);
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleValidateInviteCode = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/invites/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode: inviteCode.toUpperCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        const property = data.rental.property;
        setPropertyDetails({
          id: property.id,
          title: property.title,
          address: property.address,
          description: property.description,
          paymentDueDay: property.paymentDueDay,
          gracePeriod: property.gracePeriod,
          hasPaymentSettings: !!(property.paymentDueDay && property.gracePeriod),
          rental: {
            id: data.rental.id,
            monthlyRent: data.rental.monthlyRent,
          }
        });
        setShowDetails(true);
      } else {
        Alert.alert('Error', data.error || 'Invalid or expired invite code');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/invites/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode: inviteCode.toUpperCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success!', 
          `You have successfully joined "${data.rental.property.title}"`,
          [
            { text: 'OK', onPress: () => navigation.navigate('TenantDashboard') }
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to accept invite');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCode = () => {
    setShowDetails(false);
    setPropertyDetails(null);
    setInviteCode('');
  };

  if (showDetails && propertyDetails) {
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
            >
              <View style={styles.content}>
                {/* Futuristic Header */}
                <View style={styles.header}>
                  <TouchableOpacity onPress={handleBackToCode} style={styles.backButton}>
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
                  <Text style={styles.title}>PROPERTY DETAILS</Text>
                  <Text style={styles.subtitle}>
                    REVIEW THE PROPERTY INFORMATION AND PAYMENT TERMS
                  </Text>
                  <View style={styles.headerLine} />
                </View>

                {/* Property Info Card */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>PROPERTY INFORMATION</Text>
                  <View style={styles.propertyCardContainer}>
                    <LinearGradient
                      colors={['#1E293B', '#334155', '#475569']}
                      style={styles.propertyCard}
                    >
                      <Text style={styles.propertyTitle}>{propertyDetails.title.toUpperCase()}</Text>
                      <View style={styles.addressContainer}>
                        <MaterialIcons name="location-on" size={20} color="#EAB308" />
                        <Text style={styles.propertyAddress}>{propertyDetails.address.toUpperCase()}</Text>
                      </View>
                      {propertyDetails.description && (
                        <View style={styles.descriptionContainer}>
                          <Text style={styles.descriptionLabel}>DESCRIPTION:</Text>
                          <Text style={styles.propertyDescription}>{propertyDetails.description.toUpperCase()}</Text>
                        </View>
                      )}
                      <View style={styles.rentInfo}>
                        <MaterialIcons name="attach-money" size={28} color="#22C55E" />
                        <View style={styles.rentContent}>
                          <Text style={styles.rentLabel}>MONTHLY RENT</Text>
                          <Text style={styles.rentAmount}>AED {propertyDetails.rental.monthlyRent.toLocaleString()}</Text>
                        </View>
                      </View>
                    </LinearGradient>
                    <View style={styles.propertyCardGlow} />
                  </View>
                </View>

                {/* Payment Terms Card */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>PAYMENT TERMS</Text>
                  <View style={styles.paymentCardContainer}>
                    <LinearGradient
                      colors={['#1E293B', '#334155']}
                      style={styles.paymentCard}
                    >
                      {propertyDetails.hasPaymentSettings ? (
                        <View>
                          <View style={styles.paymentTermsGrid}>
                            <View style={styles.paymentTermItem}>
                              <MaterialIcons name="event" size={24} color="#6366F1" />
                              <Text style={styles.paymentTermLabel}>PAYMENT DUE DAY</Text>
                              <Text style={styles.paymentTermValue}>
                                {propertyDetails.paymentDueDay}
                                {propertyDetails.paymentDueDay === 1 ? 'ST' : 
                                 propertyDetails.paymentDueDay === 2 ? 'ND' : 
                                 propertyDetails.paymentDueDay === 3 ? 'RD' : 'TH'} OF EACH MONTH
                              </Text>
                            </View>
                            <View style={styles.paymentTermItem}>
                              <MaterialIcons name="schedule" size={24} color="#8B5CF6" />
                              <Text style={styles.paymentTermLabel}>GRACE PERIOD</Text>
                              <Text style={styles.paymentTermValue}>{propertyDetails.gracePeriod} DAYS</Text>
                            </View>
                          </View>
                          <View style={styles.paymentNote}>
                            <MaterialIcons name="info" size={16} color="#EAB308" />
                            <Text style={styles.paymentNoteText}>
                              LATE FEES MAY APPLY AFTER THE GRACE PERIOD EXPIRES.
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.warningContainer}>
                          <MaterialIcons name="warning" size={24} color="#EAB308" />
                          <View style={styles.warningContent}>
                            <Text style={styles.warningTitle}>PAYMENT SETTINGS NOT CONFIGURED</Text>
                            <Text style={styles.warningText}>
                              THE LANDLORD HAS NOT YET SET UP PAYMENT DUE DATES AND GRACE PERIODS. YOU CAN STILL JOIN THE PROPERTY, BUT PAYMENT TERMS WILL NEED TO BE ESTABLISHED LATER.
                            </Text>
                          </View>
                        </View>
                      )}
                    </LinearGradient>
                    <View style={styles.paymentCardGlow} />
                  </View>
                </View>

                {/* Agreement Card */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>RENTAL AGREEMENT</Text>
                  <View style={styles.agreementCardContainer}>
                    <LinearGradient
                      colors={['#1E293B', '#334155']}
                      style={styles.agreementCard}
                    >
                      <Text style={styles.agreementTitle}>BY ACCEPTING THIS INVITE:</Text>
                      
                      <View style={styles.agreementList}>
                        <View style={styles.agreementItem}>
                          <View style={styles.agreementBullet}>
                            <Text style={styles.agreementBulletText}>•</Text>
                          </View>
                          <Text style={styles.agreementText}>
                            YOU AGREE TO PAY THE MONTHLY RENT OF AED {propertyDetails.rental.monthlyRent.toLocaleString()}
                          </Text>
                        </View>
                        
                        {propertyDetails.hasPaymentSettings && (
                          <>
                            <View style={styles.agreementItem}>
                              <View style={styles.agreementBullet}>
                                <Text style={styles.agreementBulletText}>•</Text>
                              </View>
                              <Text style={styles.agreementText}>
                                YOU AGREE TO PAY RENT BY THE {propertyDetails.paymentDueDay}
                                {propertyDetails.paymentDueDay === 1 ? 'ST' : 
                                 propertyDetails.paymentDueDay === 2 ? 'ND' : 
                                 propertyDetails.paymentDueDay === 3 ? 'RD' : 'TH'} OF EACH MONTH
                              </Text>
                            </View>
                            <View style={styles.agreementItem}>
                              <View style={styles.agreementBullet}>
                                <Text style={styles.agreementBulletText}>•</Text>
                              </View>
                              <Text style={styles.agreementText}>
                                YOU UNDERSTAND THERE IS A {propertyDetails.gracePeriod}-DAY GRACE PERIOD
                              </Text>
                            </View>
                          </>
                        )}
                        
                        <View style={styles.agreementItem}>
                          <View style={styles.agreementBullet}>
                            <Text style={styles.agreementBulletText}>•</Text>
                          </View>
                          <Text style={styles.agreementText}>
                            YOU WILL ABIDE BY THE PROPERTY RULES AND LEASE TERMS
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>
                    <View style={styles.agreementCardGlow} />
                  </View>
                </View>

                {/* Accept Button */}
                <View style={styles.section}>
                  <TouchableOpacity 
                    style={styles.acceptButtonContainer}
                    onPress={handleAcceptInvite}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={loading ? ['#64748B', '#64748B'] : ['#22C55E', '#16A34A']}
                      style={styles.acceptButton}
                    >
                      <MaterialIcons 
                        name={loading ? "hourglass-empty" : "check-circle"} 
                        size={24} 
                        color="#FFFFFF" 
                      />
                      <Text style={styles.acceptButtonText}>
                        {loading ? 'ACCEPTING...' : 'ACCEPT INVITE & JOIN PROPERTY'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
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
              <View style={styles.content}>
                {/* Futuristic Header */}
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
                  <Text style={styles.title}>JOIN PROPERTY</Text>
                  <Text style={styles.subtitle}>
                    ENTER THE INVITE CODE PROVIDED BY YOUR LANDLORD
                  </Text>
                  <View style={styles.headerLine} />
                </View>

                {/* Invite Code Input */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>INVITE CODE</Text>
                  <View style={styles.inputContainer}>
                    <LinearGradient
                      colors={['#1E293B', '#334155']}
                      style={styles.inputBackground}
                    >
                      <MaterialIcons name="vpn-key" size={24} color="#6366F1" />
                      <TextInput
                        style={styles.input}
                        value={inviteCode}
                        onChangeText={setInviteCode}
                        placeholder="E.G., ABC123"
                        placeholderTextColor="#64748B"
                        autoCapitalize="characters"
                        autoCorrect={false}
                        maxLength={8}
                      />
                    </LinearGradient>
                    <View style={styles.inputGlow} />
                  </View>
                  <Text style={styles.hint}>
                    THE CODE IS USUALLY 8 CHARACTERS LONG
                  </Text>
                </View>

                {/* Continue Button */}
                <View style={styles.section}>
                  <TouchableOpacity 
                    style={styles.continueButtonContainer}
                    onPress={handleValidateInviteCode}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={loading ? ['#64748B', '#64748B'] : ['#6366F1', '#8B5CF6', '#EC4899']}
                      style={styles.continueButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <MaterialIcons 
                        name={loading ? "hourglass-empty" : "arrow-forward"} 
                        size={24} 
                        color="#FFFFFF" 
                      />
                      <Text style={styles.continueButtonText}>
                        {loading ? 'VALIDATING...' : 'CONTINUE'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Info Card */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>HOW IT WORKS</Text>
                  <View style={styles.infoCardContainer}>
                    <LinearGradient
                      colors={['#1E293B', '#334155']}
                      style={styles.infoCard}
                    >
                      <View style={styles.infoStep}>
                        <LinearGradient
                          colors={['#6366F1', '#8B5CF6']}
                          style={styles.stepNumber}
                        >
                          <Text style={styles.stepNumberText}>1</Text>
                        </LinearGradient>
                        <Text style={styles.stepText}>GET INVITE CODE FROM YOUR LANDLORD</Text>
                      </View>
                      
                      <View style={styles.infoStep}>
                        <LinearGradient
                          colors={['#8B5CF6', '#EC4899']}
                          style={styles.stepNumber}
                        >
                          <Text style={styles.stepNumberText}>2</Text>
                        </LinearGradient>
                        <Text style={styles.stepText}>ENTER THE CODE ABOVE</Text>
                      </View>
                      
                      <View style={styles.infoStep}>
                        <LinearGradient
                          colors={['#EC4899', '#F97316']}
                          style={styles.stepNumber}
                        >
                          <Text style={styles.stepNumberText}>3</Text>
                        </LinearGradient>
                        <Text style={styles.stepText}>REVIEW PROPERTY AND PAYMENT TERMS</Text>
                      </View>
                      
                      <View style={styles.infoStep}>
                        <LinearGradient
                          colors={['#F97316', '#22C55E']}
                          style={styles.stepNumber}
                        >
                          <Text style={styles.stepNumberText}>4</Text>
                        </LinearGradient>
                        <Text style={styles.stepText}>ACCEPT INVITE TO START MANAGING YOUR RENTAL</Text>
                      </View>
                    </LinearGradient>
                    <View style={styles.infoCardGlow} />
                  </View>
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
  content: {
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
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    letterSpacing: 0.5,
    marginBottom: 24,
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
  inputContainer: {
    position: 'relative',
  },
  inputBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  inputGlow: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 17,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    zIndex: -1,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 3,
    color: '#FFFFFF',
    marginLeft: 16,
  },
  hint: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  continueButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  infoCardContainer: {
    position: 'relative',
  },
  infoCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  infoCardGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    zIndex: -1,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  propertyCardContainer: {
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
  propertyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  propertyAddress: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 12,
    flex: 1,
    letterSpacing: 0.5,
  },
  descriptionContainer: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 8,
  },
  propertyDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  rentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  rentContent: {
    marginLeft: 16,
    flex: 1,
  },
  rentLabel: {
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  rentAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  paymentCardContainer: {
    position: 'relative',
  },
  paymentCard: {
    padding: 24,
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
  paymentTermsGrid: {
    marginBottom: 20,
  },
  paymentTermItem: {
    alignItems: 'center',
    marginBottom: 20,
  },
  paymentTermLabel: {
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 4,
  },
  paymentTermValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  paymentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    padding: 12,
    borderRadius: 8,
  },
  paymentNoteText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 8,
    letterSpacing: 0.5,
    flex: 1,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EAB308',
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EAB308',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  warningText: {
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 18,
    letterSpacing: 0.5,
  },
  agreementCardContainer: {
    position: 'relative',
  },
  agreementCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  agreementCardGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    zIndex: -1,
  },
  agreementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 1,
    textAlign: 'center',
  },
  agreementList: {
    marginBottom: 8,
  },
  agreementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  agreementBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  agreementBulletText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '700',
  },
  agreementText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  acceptButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
});