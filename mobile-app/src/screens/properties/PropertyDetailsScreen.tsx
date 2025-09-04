import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
  Share,
  Dimensions,
  Image,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import { API_BASE_URL } from '../../services/api';

const { width: screenWidth } = Dimensions.get('window');

export default function PropertyDetailsScreen({ route, navigation }: any) {
  const { property: initialProperty, fromMarketplace } = route.params;
  const [property, setProperty] = useState(initialProperty);
  const { token, user } = useSelector((state: RootState) => state.auth);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingPayment, setGeneratingPayment] = useState(false);
  const [showEndRentalModal, setShowEndRentalModal] = useState(false);
  const [endRentalReason, setEndRentalReason] = useState('');
  const [endingRental, setEndingRental] = useState(false);
  const [acceptingEnd, setAcceptingEnd] = useState(false);
  const [cancellingEnd, setCancellingEnd] = useState(false);
  const [showFullDetailsModal, setShowFullDetailsModal] = useState(false);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  // Refresh property data when screen becomes focused
  useFocusEffect(
    React.useCallback(() => {
      refreshPropertyData();
    }, [])
  );

  const refreshPropertyData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/properties`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        if (user?.userType === 'LANDLORD') {
          const updatedProperty = data.properties.find((p: any) => p.id === property.id);
          if (updatedProperty) {
            setProperty(updatedProperty);
          }
        } else {
          // For tenant, property data comes differently - find by rentalId or property id
          const updatedProperty = data.properties.find((p: any) => 
            p.id === property.id || p.rentalId === property.rentalId
          );
          if (updatedProperty) {
            setProperty(updatedProperty);
          } else {
            // Property not found - probably rental ended, go back to dashboard
            navigation.popToTop();
          }
        }
      }
    } catch (error) {
      console.error('Failed to refresh property data:', error);
    }
  };

  const generateInviteCode = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/invites/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ propertyId: property.id }),
      });

      const data = await response.json();

      if (response.ok) {
        setInviteCode(data.inviteCode);
        setShowInviteModal(true);
      } else {
        Alert.alert('Error', data.error || 'Failed to generate invite code');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const shareInviteCode = async () => {
    try {
      await Share.share({
        message: `Join my property "${property.title}" on duRent Dubai!\n\nInvite Code: ${inviteCode}\n\nDownload duRent app and use this code to connect.`,
        title: 'duRent Property Invite',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const copyInviteCode = async () => {
    try {
      await Clipboard.setStringAsync(inviteCode);
      Alert.alert('Copied!', 'Invite code copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy code');
    }
  };

  const generatePayment = async () => {
    if (generatingPayment) return; // Prevent double calls
    
    setGeneratingPayment(true);
    try {
      const response = await fetch(`${API_BASE_URL}/properties/${property.id}/generate-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', `Payment generated for ${data.dueDate}!`);
      } else {
        Alert.alert('Error', data.error || 'Failed to generate payment');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setGeneratingPayment(false);
    }
  };

  const getNextPaymentDate = () => {
    if (!property.paymentDueDay) return null;
    
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const year = nextMonth.getFullYear();
    const month = nextMonth.getMonth();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const effectiveDay = Math.min(property.paymentDueDay, lastDayOfMonth);
    
    return new Date(year, month, effectiveDay).toLocaleDateString();
  };

  const handleEndRental = async () => {
    const rentalId = user?.userType === 'LANDLORD' ? activeTenants[0]?.id : property.rentalId;
    
    if (!rentalId) {
      return;
    }
    
    setEndingRental(true);
    try {
      const response = await fetch(`${API_BASE_URL}/rentals/${rentalId}/end-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: endRentalReason }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowEndRentalModal(false);
        setEndRentalReason('');
        
        // Update property state to show the new end request with requestedBy
        const endRequestWithUser = {
          ...data.endRequest,
          requestedBy: {
            id: user?.id,
            name: user?.name
          }
        };
        
        if (user?.userType === 'LANDLORD') {
          // For landlord, update the activeTenants endRequest
          setProperty(prev => ({
            ...prev,
            rentals: prev.rentals?.map((rental: any) => 
              rental.id === rentalId 
                ? { ...rental, endRequest: endRequestWithUser, status: 'ENDING' }
                : rental
            ) || []
          }));
        } else {
          // For tenant, set property endRequest
          setProperty(prev => ({
            ...prev,
            endRequest: endRequestWithUser
          }));
        }
        
        let message = 'End rental request has been sent. It will be automatically accepted after 7 days if no response.';
        if (data.warning) {
          message = `${data.warning}\n\n${message}`;
        }
        
        Alert.alert(
          'Request Sent', 
          message
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to send end rental request');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setEndingRental(false);
    }
  };

  const handleAcceptEnd = async () => {
    if (!property.rentalId) return;
    
    setAcceptingEnd(true);
    try {
      const response = await fetch(`${API_BASE_URL}/rentals/${property.rentalId}/accept-end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Rental Ended', 
          'The rental has been ended successfully.',
          [{ text: 'OK', onPress: () => navigation.popToTop() }]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to accept end request');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setAcceptingEnd(false);
    }
  };

  const handleCancelEnd = async () => {
    
    const rentalId = property.rentalId || activeTenants[0]?.id;
    if (!rentalId) {
      console.log('No rentalId found, returning');
      return;
    }
    
    setCancellingEnd(true);
    try {
      const response = await fetch(`${API_BASE_URL}/rentals/${rentalId}/cancel-end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Clear the end request from current property state and refresh data
        if (user?.userType === 'LANDLORD') {
          // For landlord, update the activeTenants endRequest  
          setProperty(prev => ({
            ...prev,
            rentals: prev.rentals?.map((rental: any) => 
              rental.id === rentalId 
                ? { ...rental, endRequest: null, status: 'ACTIVE' }
                : rental
            ) || []
          }));
        } else {
          // For tenant, clear property endRequest
          setProperty(prev => ({
            ...prev,
            endRequest: null
          }));
        }
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

  const handleSetAvailability = (availabilityStatus: string) => {
    if (activeTenants.length > 0 && availabilityStatus === 'AVAILABLE') {
      // Property has active tenant - show warning
      Alert.alert(
        'Active Tenant Found',
        'This property currently has an active tenant. You can still set it as available, but potential tenants will know it has current occupancy.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => updatePropertyAvailability(true, availabilityStatus, null) }
        ]
      );
    } else {
      // No active tenant or setting as AVAILABLE_SOON - proceed
      updatePropertyAvailability(true, availabilityStatus, null);
    }
  };

  const updatePropertyAvailability = async (isPublic: boolean, availabilityStatus: string, availableFrom: string | null = null) => {
    setUpdatingAvailability(true);
    try {
      const body: any = {
        isPublic,
        availabilityStatus,
      };

      if (availableFrom) {
        body.availableFrom = availableFrom;
      }

      const response = await fetch(`${API_BASE_URL}/properties/${property.id}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setProperty(data.property);
        Alert.alert('Success', 'Property availability updated successfully');
      } else {
        Alert.alert('Error', data.error || 'Failed to update property availability');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const activeTenants = property.rentals?.filter((r: any) => r.status === 'ACTIVE' || r.status === 'ENDING') || [];
  
  // For landlord: get endRequest from rental, for tenant: use property.endRequest
  const endRequestFromData = user?.userType === 'LANDLORD' 
    ? activeTenants[0]?.endRequest 
    : property.endRequest;
    
  // Only show PENDING end requests
  const currentEndRequest = endRequestFromData?.status === 'PENDING' ? endRequestFromData : null;
  
  

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
            {/* Futuristic Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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
              <View style={styles.headerLine} />
            </View>

            {/* Photo Gallery with Property Info Overlay */}
            <View style={styles.section}>
              {property.photos && property.photos.length > 0 ? (
                <View style={styles.photoGalleryContainer}>
                  {/* Main Photo with Property Info Overlay */}
                  <View style={styles.mainPhotoContainer}>
                    <Image 
                      source={{ uri: property.photos[selectedPhotoIndex] }} 
                      style={styles.mainPhoto}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.7)']}
                      style={styles.photoOverlay}
                    >
                      <View style={styles.propertyInfoOverlay}>
                        <Text style={styles.overlayTitle}>{property.title.toUpperCase()}</Text>
                        <View style={styles.overlayLocationContainer}>
                          <MaterialIcons name="location-on" size={16} color="#FFFFFF" />
                          <Text style={styles.overlayAddress}>{property.address}</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                  
                  {/* Thumbnail Gallery */}
                  {property.photos.length > 1 && (
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.thumbnailScrollView}
                      contentContainerStyle={styles.thumbnailContainer}
                    >
                      {property.photos.map((photo: string, index: number) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => setSelectedPhotoIndex(index)}
                          style={[
                            styles.thumbnailWrapper,
                            selectedPhotoIndex === index && styles.selectedThumbnail
                          ]}
                        >
                          <Image 
                            source={{ uri: photo }} 
                            style={styles.thumbnailPhoto}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              ) : (
                <View style={styles.noPhotosContainer}>
                  <LinearGradient
                    colors={['#1E293B', '#334155']}
                    style={styles.noPhotosCard}
                  >
                    <MaterialIcons name="photo-camera" size={48} color="#64748B" />
                    <Text style={styles.noPhotosText}>NO PHOTOS AVAILABLE</Text>
                    <Text style={styles.noPhotosSubtext}>Property photos not provided</Text>
                  </LinearGradient>
                </View>
              )}
            </View>

            {/* End Request Alert - Only for active rentals, not marketplace */}
            {!fromMarketplace && currentEndRequest && (
              <View style={styles.section}>
                <View style={styles.endRequestAlert}>
                  <LinearGradient
                    colors={['#1E293B', '#334155']}
                    style={styles.endRequestCard}
                  >
                    <View style={styles.endRequestHeader}>
                      <MaterialIcons name="warning" size={24} color="#EAB308" />
                      <Text style={styles.endRequestTitle}>END RENTAL REQUEST</Text>
                    </View>
                    
                    <Text style={styles.endRequestMessage}>
                      {currentEndRequest.requestedBy?.id === user?.id 
                        ? `YOU HAVE REQUESTED TO END THE COMMUNICATION WITH ${user?.userType === 'LANDLORD' ? activeTenants[0]?.tenant?.name?.toUpperCase() || 'TENANT' : property.owner?.name?.toUpperCase() || 'LANDLORD'} FOR THIS PROPERTY.`
                        : `${currentEndRequest.requestedBy?.name?.toUpperCase() || 'SOMEONE'} WANTS TO END THIS RENTAL.`}
                    </Text>
                    
                    {currentEndRequest.reason && (
                      <View style={styles.reasonContainer}>
                        <Text style={styles.reasonLabel}>REASON:</Text>
                        <Text style={styles.endRequestReason}>{currentEndRequest.reason.toUpperCase()}</Text>
                      </View>
                    )}
                    
                    <Text style={styles.endRequestDeadline}>
                      AUTO-ACCEPTS: {new Date(currentEndRequest.autoAcceptAt).toLocaleDateString().toUpperCase()}
                    </Text>
                    
                    <View style={styles.endRequestButtons}>
                      {currentEndRequest.requestedBy?.id === user?.id ? (
                        <TouchableOpacity 
                          style={styles.cancelEndButtonContainer}
                          onPress={handleCancelEnd}
                          disabled={cancellingEnd}
                          activeOpacity={0.7}
                        >
                          <LinearGradient
                            colors={cancellingEnd ? ['#64748B', '#64748B'] : ['#EF4444', '#DC2626']}
                            style={styles.cancelEndButton}
                          >
                            <Text style={styles.cancelEndButtonText}>
                              {cancellingEnd ? 'CANCELLING...' : 'CANCEL REQUEST'}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity 
                          style={styles.acceptButtonContainer}
                          onPress={handleAcceptEnd}
                          disabled={acceptingEnd}
                        >
                          <LinearGradient
                            colors={acceptingEnd ? ['#64748B', '#64748B'] : ['#22C55E', '#16A34A']}
                            style={styles.acceptButton}
                          >
                            <Text style={styles.acceptButtonText}>
                              {acceptingEnd ? 'ACCEPTING...' : 'ACCEPT NOW'}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                    </View>
                  </LinearGradient>
                  <View style={styles.endRequestGlow} />
                </View>
              </View>
            )}

            {/* Tenant View - Quick Info only */}
            {user?.userType === 'TENANT' && (
              <View style={styles.section}>
                {/* Quick Info Card */}
                <View style={styles.quickInfoContainer}>
                  <LinearGradient
                    colors={['#1E293B', '#334155']}
                    style={styles.quickInfoCard}
                  >
                    <View style={styles.quickInfoGrid}>
                      <View style={styles.quickInfoItem}>
                        <MaterialIcons name="attach-money" size={20} color="#6366F1" />
                        <Text style={styles.quickInfoValue}>AED {property.monthlyRent}</Text>
                        <Text style={styles.quickInfoLabel}>MONTHLY RENT</Text>
                      </View>
                      <View style={styles.quickInfoItem}>
                        <MaterialIcons name="bed" size={20} color="#8B5CF6" />
                        <Text style={styles.quickInfoValue}>{property.bedrooms}</Text>
                        <Text style={styles.quickInfoLabel}>BEDROOMS</Text>
                      </View>
                      <View style={styles.quickInfoItem}>
                        <MaterialIcons name="bathtub" size={20} color="#EC4899" />
                        <Text style={styles.quickInfoValue}>{property.bathrooms}</Text>
                        <Text style={styles.quickInfoLabel}>BATHROOMS</Text>
                      </View>
                      <View style={styles.quickInfoItem}>
                        <MaterialIcons name="home" size={20} color="#10B981" />
                        <Text style={styles.quickInfoValue}>{property.propertyType?.toUpperCase() || 'APARTMENT'}</Text>
                        <Text style={styles.quickInfoLabel}>TYPE</Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.viewDetailsButtonContainer}
                      onPress={() => setShowFullDetailsModal(true)}
                    >
                      <LinearGradient
                        colors={['#6366F1', '#8B5CF6']}
                        style={styles.viewDetailsButton}
                      >
                        <MaterialIcons name="info" size={20} color="#FFFFFF" />
                        <Text style={styles.viewDetailsButtonText}>VIEW ALL PROPERTY DETAILS</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              </View>
            )}
            
            {/* Landlord View - Original Layout */}
            {user?.userType === 'LANDLORD' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PROPERTY INFORMATION</Text>
              <View style={styles.propertyCardContainer}>
                <LinearGradient
                  colors={['#1E293B', '#334155', '#475569']}
                  style={styles.propertyCard}
                >
                  <Text style={styles.propertyTitle}>{property.title.toUpperCase()}</Text>
                  
                  <View style={styles.infoGrid}>
                    <View style={styles.infoRow}>
                      <View style={styles.infoItem}>
                        <MaterialIcons name="attach-money" size={20} color="#6366F1" />
                        <Text style={styles.infoLabel}>MONTHLY RENT</Text>
                        <Text style={styles.infoValue}>AED {property.monthlyRent}</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <MaterialIcons name="bed" size={20} color="#8B5CF6" />
                        <Text style={styles.infoLabel}>BEDROOMS</Text>
                        <Text style={styles.infoValue}>{property.bedrooms}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <View style={styles.infoItem}>
                        <MaterialIcons name="bathtub" size={20} color="#EC4899" />
                        <Text style={styles.infoLabel}>BATHROOMS</Text>
                        <Text style={styles.infoValue}>{property.bathrooms}</Text>
                      </View>
                      {property.area && (
                        <View style={styles.infoItem}>
                          <MaterialIcons name="aspect-ratio" size={20} color="#F97316" />
                          <Text style={styles.infoLabel}>AREA</Text>
                          <Text style={styles.infoValue}>{property.area} SQ FT</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.infoRow}>
                      <View style={styles.infoItem}>
                        <MaterialIcons name="home" size={20} color="#10B981" />
                        <Text style={styles.infoLabel}>TYPE</Text>
                        <Text style={styles.infoValue}>{property.propertyType?.toUpperCase() || 'APARTMENT'}</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <MaterialIcons name="weekend" size={20} color="#A855F7" />
                        <Text style={styles.infoLabel}>FURNISHING</Text>
                        <Text style={styles.infoValue}>{property.furnishingStatus?.replace('_', ' ')?.toUpperCase() || 'UNFURNISHED'}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.addressContainer}>
                    <MaterialIcons name="location-on" size={20} color="#EAB308" />
                    <Text style={styles.addressText}>{property.address.toUpperCase()}</Text>
                  </View>
                  
                  <View style={styles.paymentInfo}>
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>PAYMENT DUE DAY:</Text>
                      <Text style={styles.paymentValue}>
                        {property.paymentDueDay ? `${property.paymentDueDay} OF EACH MONTH` : 'NOT SET'}
                      </Text>
                    </View>
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>GRACE PERIOD:</Text>
                      <Text style={styles.paymentValue}>{property.gracePeriodDays || 7} DAYS</Text>
                    </View>
                  </View>
                  
                  {property.description && (
                    <View style={styles.descriptionContainer}>
                      <Text style={styles.descriptionLabel}>DESCRIPTION:</Text>
                      <Text style={styles.description}>{property.description.toUpperCase()}</Text>
                    </View>
                  )}
                </LinearGradient>
                <View style={styles.propertyCardGlow} />
              </View>
            </View>
            )}

            {/* Actions - Hide for marketplace viewing */}
            {!fromMarketplace && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
              
              {user?.userType === 'LANDLORD' ? (
                <View style={styles.actionsGrid}>
                  <TouchableOpacity 
                    onPress={generateInviteCode}
                    disabled={loading || activeTenants.length > 0}
                  >
                    <View style={styles.actionCardContainer}>
                      <LinearGradient
                        colors={activeTenants.length > 0 ? ['#64748B', '#64748B'] : ['#6366F1', '#8B5CF6']}
                        style={styles.actionCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.actionIconWrapper}>
                          <MaterialIcons 
                            name={activeTenants.length > 0 ? "lock" : "send"} 
                            size={28} 
                            color="#FFFFFF" 
                          />
                        </View>
                        <Text style={styles.actionTitle}>INVITE</Text>
                        <Text style={styles.actionSubtitle}>CODE</Text>
                      </LinearGradient>
                      <View style={styles.cardGlow} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => navigation.navigate('EditProperty', { property })}
                  >
                    <View style={styles.actionCardContainer}>
                      <LinearGradient
                        colors={['#8B5CF6', '#EC4899']}
                        style={styles.actionCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.actionIconWrapper}>
                          <MaterialIcons name="edit" size={28} color="#FFFFFF" />
                        </View>
                        <Text style={styles.actionTitle}>EDIT</Text>
                        <Text style={styles.actionSubtitle}>PROPERTY</Text>
                      </LinearGradient>
                      <View style={styles.cardGlow} />
                    </View>
                  </TouchableOpacity>

                  {activeTenants.length > 0 && !currentEndRequest && (
                    <TouchableOpacity onPress={() => setShowEndRentalModal(true)}>
                      <View style={styles.actionCardContainer}>
                        <LinearGradient
                          colors={['#EF4444', '#DC2626']}
                          style={styles.actionCard}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <View style={styles.actionIconWrapper}>
                            <MaterialIcons name="close" size={28} color="#FFFFFF" />
                          </View>
                          <Text style={styles.actionTitle}>END</Text>
                          <Text style={styles.actionSubtitle}>RENTAL</Text>
                        </LinearGradient>
                        <View style={styles.cardGlow} />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.actionsGrid}>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('Chat', {
                      propertyId: property.id,
                      otherUser: property.owner,
                      propertyTitle: property.title
                    })}
                  >
                    <View style={styles.actionCardContainer}>
                      <LinearGradient
                        colors={['#6366F1', '#8B5CF6']}
                        style={styles.actionCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.actionIconWrapper}>
                          <Ionicons name="chatbubbles" size={28} color="#FFFFFF" />
                        </View>
                        <Text style={styles.actionTitle}>CONTACT</Text>
                        <Text style={styles.actionSubtitle}>LANDLORD</Text>
                      </LinearGradient>
                      <View style={styles.cardGlow} />
                    </View>
                  </TouchableOpacity>

                  {!currentEndRequest && (
                    <TouchableOpacity onPress={() => setShowEndRentalModal(true)}>
                      <View style={styles.actionCardContainer}>
                        <LinearGradient
                          colors={['#EF4444', '#DC2626']}
                          style={styles.actionCard}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <View style={styles.actionIconWrapper}>
                            <MaterialIcons name="close" size={28} color="#FFFFFF" />
                          </View>
                          <Text style={styles.actionTitle}>END</Text>
                          <Text style={styles.actionSubtitle}>RENTAL</Text>
                        </LinearGradient>
                        <View style={styles.cardGlow} />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
            )}

            {/* Payments Section - Hide for marketplace */}
            {!fromMarketplace && user?.userType === 'LANDLORD' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PAYMENT MANAGEMENT</Text>
                
                <View style={styles.actionsGrid}>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('EditPaymentSettings', { property })}
                  >
                    <View style={styles.actionCardContainer}>
                      <LinearGradient
                        colors={['#22C55E', '#16A34A']}
                        style={styles.actionCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.actionIconWrapper}>
                          <MaterialIcons name="settings" size={28} color="#FFFFFF" />
                        </View>
                        <Text style={styles.actionTitle}>PAYMENT</Text>
                        <Text style={styles.actionSubtitle}>SETTINGS</Text>
                      </LinearGradient>
                      <View style={styles.cardGlow} />
                    </View>
                  </TouchableOpacity>

                  {activeTenants.length > 0 && (
                    property.paymentDueDay ? (
                      <TouchableOpacity 
                        onPress={generatePayment}
                        disabled={generatingPayment}
                      >
                        <View style={styles.actionCardContainer}>
                          <LinearGradient
                            colors={generatingPayment ? ['#64748B', '#64748B'] : ['#06B6D4', '#0891B2']}
                            style={styles.actionCard}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                            <View style={styles.actionIconWrapper}>
                              <MaterialIcons name="account-balance-wallet" size={28} color="#FFFFFF" />
                            </View>
                            <Text style={styles.actionTitle}>
                              {generatingPayment ? 'GENERATING' : 'GENERATE'}
                            </Text>
                            <Text style={styles.actionSubtitle}>PAYMENT</Text>
                          </LinearGradient>
                          <View style={styles.cardGlow} />
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.actionCardContainer}>
                        <LinearGradient
                          colors={['#EAB308', '#D97706']}
                          style={styles.actionCard}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <View style={styles.actionIconWrapper}>
                            <MaterialIcons name="warning" size={28} color="#FFFFFF" />
                          </View>
                          <Text style={styles.actionTitle}>SETTINGS</Text>
                          <Text style={styles.actionSubtitle}>REQUIRED</Text>
                        </LinearGradient>
                        <View style={styles.cardGlow} />
                      </View>
                    )
                  )}

                  <TouchableOpacity 
                    onPress={() => navigation.navigate('PaymentVerification', { propertyId: property.id })}
                  >
                    <View style={styles.actionCardContainer}>
                      <LinearGradient
                        colors={['#F97316', '#EA580C']}
                        style={styles.actionCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.actionIconWrapper}>
                          <MaterialIcons name="verified" size={28} color="#FFFFFF" />
                        </View>
                        <Text style={styles.actionTitle}>VERIFY</Text>
                        <Text style={styles.actionSubtitle}>PAYMENTS</Text>
                      </LinearGradient>
                      <View style={styles.cardGlow} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => navigation.navigate('LandlordPayments', { propertyId: property.id })}
                  >
                    <View style={styles.actionCardContainer}>
                      <LinearGradient
                        colors={['#8B5CF6', '#7C3AED']}
                        style={styles.actionCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.actionIconWrapper}>
                          <MaterialIcons name="bar-chart" size={28} color="#FFFFFF" />
                        </View>
                        <Text style={styles.actionTitle}>PAYMENT</Text>
                        <Text style={styles.actionSubtitle}>HISTORY</Text>
                      </LinearGradient>
                      <View style={styles.cardGlow} />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Marketplace Visibility - Landlord only, hide for marketplace */}
            {!fromMarketplace && user?.userType === 'LANDLORD' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>MARKETPLACE VISIBILITY</Text>
                
                <View style={styles.availabilityStatusContainer}>
                  <LinearGradient
                    colors={property.isPublic ? ['#22C55E', '#16A34A'] : ['#64748B', '#475569']}
                    style={styles.statusCard}
                  >
                    <Text style={styles.statusLabel}>Current Status:</Text>
                    <Text style={styles.statusValue}>
                      {!property.isPublic ? 'NOT AVAILABLE' :
                       property.availabilityStatus === 'AVAILABLE' ? 'AVAILABLE' : 
                       property.availabilityStatus === 'AVAILABLE_SOON' ? 'AVAILABLE SOON' :
                       'NOT AVAILABLE'}
                    </Text>
                    {activeTenants.length > 0 && (
                      <Text style={styles.tenantWarning}>
                        • Has Active Tenant
                      </Text>
                    )}
                  </LinearGradient>
                </View>
                
                <View style={styles.actionsGrid}>
                  <TouchableOpacity 
                    onPress={() => handleSetAvailability('AVAILABLE')}
                    disabled={updatingAvailability}
                  >
                    <View style={styles.actionCardContainer}>
                      <LinearGradient
                        colors={property.isPublic && property.availabilityStatus === 'AVAILABLE' ? ['#10B981', '#059669'] : ['#22C55E', '#16A34A']}
                        style={styles.actionCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.actionIconWrapper}>
                          <MaterialIcons name="check-circle" size={28} color="#FFFFFF" />
                        </View>
                        <Text style={styles.actionTitle}>SET</Text>
                        <Text style={styles.actionSubtitle}>AVAILABLE</Text>
                      </LinearGradient>
                      <View style={styles.cardGlow} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => handleSetAvailability('AVAILABLE_SOON')}
                    disabled={updatingAvailability}
                  >
                    <View style={styles.actionCardContainer}>
                      <LinearGradient
                        colors={property.isPublic && property.availabilityStatus === 'AVAILABLE_SOON' ? ['#F59E0B', '#D97706'] : ['#EAB308', '#D97706']}
                        style={styles.actionCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.actionIconWrapper}>
                          <MaterialIcons name="schedule" size={28} color="#FFFFFF" />
                        </View>
                        <Text style={styles.actionTitle}>AVAILABLE</Text>
                        <Text style={styles.actionSubtitle}>SOON</Text>
                      </LinearGradient>
                      <View style={styles.cardGlow} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => updatePropertyAvailability(false, null, null)}
                    disabled={updatingAvailability}
                  >
                    <View style={styles.actionCardContainer}>
                      <LinearGradient
                        colors={!property.isPublic ? ['#6B7280', '#4B5563'] : ['#EF4444', '#DC2626']}
                        style={styles.actionCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.actionIconWrapper}>
                          <MaterialIcons name="visibility-off" size={28} color="#FFFFFF" />
                        </View>
                        <Text style={styles.actionTitle}>SET NOT</Text>
                        <Text style={styles.actionSubtitle}>AVAILABLE</Text>
                      </LinearGradient>
                      <View style={styles.cardGlow} />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Tenants - Landlord only, hide for marketplace */}
            {!fromMarketplace && user?.userType === 'LANDLORD' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ACTIVE TENANTS ({activeTenants.length})</Text>
              {activeTenants.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <LinearGradient
                    colors={['#1E293B', '#334155']}
                    style={styles.emptyState}
                  >
                    <MaterialIcons name="person-off" size={48} color="#64748B" />
                    <Text style={styles.emptyText}>NO TENANTS YET</Text>
                    <Text style={styles.emptySubtext}>GENERATE AN INVITE CODE TO ADD TENANTS</Text>
                  </LinearGradient>
                </View>
              ) : (
                activeTenants.map((rental: any) => (
                  <View key={rental.id} style={styles.tenantCardContainer}>
                    <LinearGradient
                      colors={['#1E293B', '#334155']}
                      style={styles.tenantCard}
                    >
                      <View style={styles.tenantInfo}>
                        <Text style={styles.tenantName}>{rental.tenant.name.toUpperCase()}</Text>
                        <Text style={styles.tenantEmail}>{rental.tenant.email}</Text>
                        {rental.tenant.phone && (
                          <Text style={styles.tenantPhone}>{rental.tenant.phone}</Text>
                        )}
                      </View>
                      <TouchableOpacity 
                        style={styles.contactButtonContainer}
                        onPress={() => navigation.navigate('Chat', {
                          propertyId: property.id,
                          otherUser: rental.tenant,
                          propertyTitle: property.title
                        })}
                      >
                        <LinearGradient
                          colors={['#6366F1', '#8B5CF6']}
                          style={styles.contactButton}
                        >
                          <Ionicons name="chatbubble" size={16} color="#FFFFFF" />
                          <Text style={styles.contactButtonText}>CONTACT</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </LinearGradient>
                    <View style={styles.tenantCardGlow} />
                  </View>
                ))
              )}
            </View>
            )}

            {/* Past Tenants (Landlord only) - hide for marketplace */}
            {!fromMarketplace && user?.userType === 'LANDLORD' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>TENANT HISTORY</Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('PastTenants', {
                    propertyId: property.id,
                    propertyTitle: property.title
                  })}
                >
                  <View style={styles.historyCardContainer}>
                    <LinearGradient
                      colors={['#1E293B', '#334155']}
                      style={styles.historyCard}
                    >
                      <View style={styles.historyContent}>
                        <MaterialIcons name="people" size={32} color="#6366F1" />
                        <View style={styles.historyText}>
                          <Text style={styles.historyTitle}>VIEW PAST TENANTS</Text>
                          <Text style={styles.historyDescription}>HISTORICAL TENANT RECORDS</Text>
                        </View>
                        <MaterialIcons name="arrow-forward" size={24} color="#94A3B8" />
                      </View>
                    </LinearGradient>
                    <View style={styles.historyCardGlow} />
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* End Rental Modal */}
      <Modal
        visible={showEndRentalModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEndRentalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['#1E293B', '#334155', '#475569']}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <MaterialIcons name="close" size={28} color="#EF4444" />
              <Text style={styles.modalTitle}>END RENTAL AGREEMENT</Text>
            </View>
            
            <Text style={styles.modalDescription}>
              THIS WILL SEND A REQUEST TO END THE RENTAL. THE OTHER PARTY HAS 7 DAYS TO RESPOND, OTHERWISE IT WILL BE AUTOMATICALLY ACCEPTED.
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>REASON (OPTIONAL)</Text>
              <LinearGradient
                colors={['#0F0F23', '#1A1A2E']}
                style={styles.inputContainer}
              >
                <TextInput
                  style={styles.input}
                  value={endRentalReason}
                  onChangeText={setEndRentalReason}
                  placeholder="Why do you want to end the rental?"
                  placeholderTextColor="#64748B"
                  multiline
                  numberOfLines={3}
                />
              </LinearGradient>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButtonContainer}
                onPress={() => {
                  setShowEndRentalModal(false);
                  setEndRentalReason('');
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
                style={styles.modalEndButtonContainer}
                onPress={handleEndRental}
                disabled={endingRental}
              >
                <LinearGradient
                  colors={endingRental ? ['#64748B', '#64748B'] : ['#EF4444', '#DC2626']}
                  style={styles.modalEndButton}
                >
                  <Text style={styles.modalEndButtonText}>
                    {endingRental ? 'SENDING...' : 'SEND REQUEST'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      {/* Invite Code Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['#1E293B', '#334155', '#475569']}
            style={styles.inviteModalContent}
          >
            <View style={styles.inviteModalHeader}>
              <MaterialIcons name="check-circle" size={32} color="#22C55E" />
              <Text style={styles.inviteModalTitle}>INVITE CODE GENERATED!</Text>
            </View>
            
            <Text style={styles.inviteModalDescription}>
              SHARE THIS CODE WITH YOUR TENANT TO CONNECT THEM TO THIS PROPERTY
            </Text>
            
            <View style={styles.codeContainer}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6', '#EC4899']}
                style={styles.codeBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.inviteCode}>{inviteCode}</Text>
              </LinearGradient>
            </View>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.actionButtonContainer} onPress={copyInviteCode}>
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  style={styles.actionButton}
                >
                  <MaterialIcons name="content-copy" size={18} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>COPY</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButtonContainer} onPress={shareInviteCode}>
                <LinearGradient
                  colors={['#22C55E', '#16A34A']}
                  style={styles.actionButton}
                >
                  <MaterialIcons name="share" size={18} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>SHARE</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.closeButtonContainer}
              onPress={() => setShowInviteModal(false)}
            >
              <LinearGradient
                colors={['#64748B', '#475569']}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>CLOSE</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      {/* Full Property Details Modal */}
      <Modal
        visible={showFullDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFullDetailsModal(false)}
      >
        <View style={styles.fullDetailsModalOverlay}>
          <LinearGradient
            colors={['#0F0F23', '#1A1A2E', '#16213E']}
            style={styles.fullDetailsModalContent}
          >
            <SafeAreaView style={styles.modalSafeArea}>
              {/* Header */}
              <View style={styles.fullDetailsHeader}>
                <TouchableOpacity onPress={() => setShowFullDetailsModal(false)} style={styles.modalCloseButton}>
                  <MaterialIcons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.fullDetailsTitle}>PROPERTY DETAILS</Text>
                <View style={{ width: 24 }} />
              </View>
              
              <ScrollView style={styles.fullDetailsScroll} showsVerticalScrollIndicator={false}>
                {/* Property Title */}
                <View style={styles.fullDetailsSection}>
                  <Text style={styles.fullPropertyTitle}>{property.title.toUpperCase()}</Text>
                  <View style={styles.fullAddressContainer}>
                    <MaterialIcons name="location-on" size={18} color="#EAB308" />
                    <Text style={styles.fullAddressText}>{property.address}</Text>
                  </View>
                </View>
                
                {/* Photo Gallery */}
                {property.photos && property.photos.length > 0 && (
                  <View style={styles.fullDetailsSection}>
                    <Text style={styles.fullDetailsSectionTitle}>PHOTOS</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {property.photos.map((photo: string, index: number) => (
                        <View key={index} style={styles.fullPhotoContainer}>
                          <Image source={{ uri: photo }} style={styles.fullPhoto} />
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
                
                {/* Basic Information */}
                <View style={styles.fullDetailsSection}>
                  <Text style={styles.fullDetailsSectionTitle}>BASIC INFORMATION</Text>
                  <View style={styles.fullDetailsGrid}>
                    <View style={styles.fullDetailsRow}>
                      <View style={styles.fullDetailItem}>
                        <MaterialIcons name="attach-money" size={24} color="#6366F1" />
                        <Text style={styles.fullDetailLabel}>MONTHLY RENT</Text>
                        <Text style={styles.fullDetailValue}>AED {property.monthlyRent}</Text>
                      </View>
                      <View style={styles.fullDetailItem}>
                        <MaterialIcons name="bed" size={24} color="#8B5CF6" />
                        <Text style={styles.fullDetailLabel}>BEDROOMS</Text>
                        <Text style={styles.fullDetailValue}>{property.bedrooms}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.fullDetailsRow}>
                      <View style={styles.fullDetailItem}>
                        <MaterialIcons name="bathtub" size={24} color="#EC4899" />
                        <Text style={styles.fullDetailLabel}>BATHROOMS</Text>
                        <Text style={styles.fullDetailValue}>{property.bathrooms}</Text>
                      </View>
                      {property.area && (
                        <View style={styles.fullDetailItem}>
                          <MaterialIcons name="aspect-ratio" size={24} color="#F97316" />
                          <Text style={styles.fullDetailLabel}>AREA</Text>
                          <Text style={styles.fullDetailValue}>{property.area} SQ FT</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.fullDetailsRow}>
                      <View style={styles.fullDetailItem}>
                        <MaterialIcons name="home" size={24} color="#10B981" />
                        <Text style={styles.fullDetailLabel}>TYPE</Text>
                        <Text style={styles.fullDetailValue}>{property.propertyType?.toUpperCase() || 'APARTMENT'}</Text>
                      </View>
                      <View style={styles.fullDetailItem}>
                        <MaterialIcons name="weekend" size={24} color="#A855F7" />
                        <Text style={styles.fullDetailLabel}>FURNISHING</Text>
                        <Text style={styles.fullDetailValue}>{property.furnishingStatus?.replace('_', ' ')?.toUpperCase() || 'UNFURNISHED'}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                
                {/* Payment Information */}
                <View style={styles.fullDetailsSection}>
                  <Text style={styles.fullDetailsSectionTitle}>PAYMENT INFORMATION</Text>
                  <View style={styles.paymentInfoContainer}>
                    <View style={styles.paymentInfoRow}>
                      <Text style={styles.paymentInfoLabel}>PAYMENT DUE DAY:</Text>
                      <Text style={styles.paymentInfoValue}>
                        {property.paymentDueDay ? `${property.paymentDueDay} OF EACH MONTH` : 'NOT SET'}
                      </Text>
                    </View>
                    <View style={styles.paymentInfoRow}>
                      <Text style={styles.paymentInfoLabel}>GRACE PERIOD:</Text>
                      <Text style={styles.paymentInfoValue}>{property.gracePeriodDays || 7} DAYS</Text>
                    </View>
                  </View>
                </View>
                
                {/* Description */}
                {property.description && (
                  <View style={styles.fullDetailsSection}>
                    <Text style={styles.fullDetailsSectionTitle}>DESCRIPTION</Text>
                    <View style={styles.fullDescriptionContainer}>
                      <Text style={styles.fullDescription}>{property.description}</Text>
                    </View>
                  </View>
                )}
                
                {/* Landlord Information - Hide for marketplace */}
                {!fromMarketplace && property.owner && (
                  <View style={styles.fullDetailsSection}>
                    <Text style={styles.fullDetailsSectionTitle}>LANDLORD CONTACT</Text>
                    <View style={styles.landlordInfoContainer}>
                      <View style={styles.landlordInfo}>
                        <MaterialIcons name="person" size={24} color="#6366F1" />
                        <Text style={styles.landlordName}>{property.owner.name.toUpperCase()}</Text>
                      </View>
                      <View style={styles.landlordInfo}>
                        <MaterialIcons name="email" size={20} color="#8B5CF6" />
                        <Text style={styles.landlordContact}>{property.owner.email}</Text>
                      </View>
                      {property.owner.phone && (
                        <View style={styles.landlordInfo}>
                          <MaterialIcons name="phone" size={20} color="#EC4899" />
                          <Text style={styles.landlordContact}>{property.owner.phone}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </ScrollView>
            </SafeAreaView>
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
    marginBottom: 24,
    textAlign: 'center',
  },
  infoGrid: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  infoLabel: {
    fontSize: 10,
    color: '#94A3B8',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  addressText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 12,
    flex: 1,
    letterSpacing: 0.5,
  },
  paymentInfo: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 1,
  },
  paymentValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  descriptionContainer: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  descriptionLabel: {
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    letterSpacing: 0.5,
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
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 1,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  tenantCardContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  tenantCard: {
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  tenantCardGlow: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 17,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    zIndex: -1,
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  tenantEmail: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 2,
  },
  tenantPhone: {
    fontSize: 14,
    color: '#94A3B8',
  },
  contactButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  historyCardContainer: {
    position: 'relative',
  },
  historyCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  historyCardGlow: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 17,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    zIndex: -1,
  },
  historyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyText: {
    flex: 1,
    marginLeft: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  historyDescription: {
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  endRequestAlert: {
    position: 'relative',
  },
  endRequestCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.5)',
  },
  endRequestGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    zIndex: -1,
  },
  endRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  endRequestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EAB308',
    letterSpacing: 1,
    marginLeft: 12,
  },
  endRequestMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.5,
    lineHeight: 20,
  },
  reasonContainer: {
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  reasonLabel: {
    fontSize: 10,
    color: '#EAB308',
    letterSpacing: 1,
    marginBottom: 4,
  },
  endRequestReason: {
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  endRequestDeadline: {
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  endRequestButtons: {
    alignItems: 'center',
  },
  cancelEndButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  cancelEndButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelEndButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  acceptButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  acceptButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
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
  inputGroup: {
    marginBottom: 24,
    width: '100%',
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
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
  modalEndButtonContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalEndButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalEndButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  inviteModalContent: {
    borderRadius: 24,
    padding: 32,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  inviteModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  inviteModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginTop: 12,
  },
  inviteModalDescription: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  codeContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
  },
  codeBackground: {
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  inviteCode: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 16,
    gap: 12,
  },
  actionButtonContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  closeButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  closeButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  photoGallery: {
    marginBottom: 24,
  },
  photoContainer: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: 120,
    height: 90,
    borderRadius: 12,
  },
  // Tenant Hero Photo Styles
  heroPhotoContainer: {
    position: 'relative',
    height: 250,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroTitleContainer: {
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroLocationText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
    opacity: 0.9,
  },
  // Gallery Thumbnails
  gallerySection: {
    marginBottom: 20,
  },
  galleryScroll: {
    paddingLeft: 4,
  },
  galleryThumbnail: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: 80,
    height: 60,
    borderRadius: 12,
  },
  // Quick Info Card
  quickInfoContainer: {
    position: 'relative',
  },
  quickInfoCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  quickInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickInfoItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickInfoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  quickInfoLabel: {
    fontSize: 10,
    color: '#94A3B8',
    letterSpacing: 1,
  },
  viewDetailsButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  viewDetailsButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  // Full Details Modal Styles
  fullDetailsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  fullDetailsModalContent: {
    flex: 1,
  },
  modalSafeArea: {
    flex: 1,
  },
  fullDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  modalCloseButton: {
    padding: 4,
  },
  fullDetailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  fullDetailsScroll: {
    flex: 1,
    paddingHorizontal: 24,
  },
  fullDetailsSection: {
    marginBottom: 32,
  },
  fullPropertyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 12,
  },
  fullAddressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fullAddressText: {
    fontSize: 16,
    color: '#94A3B8',
    marginLeft: 8,
  },
  fullDetailsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 16,
    opacity: 0.9,
  },
  fullPhotoContainer: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  fullPhoto: {
    width: 150,
    height: 100,
    borderRadius: 12,
  },
  fullDetailsGrid: {
    gap: 16,
  },
  fullDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  fullDetailItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  fullDetailLabel: {
    fontSize: 10,
    color: '#94A3B8',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 4,
  },
  fullDetailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  paymentInfoContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  paymentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentInfoLabel: {
    fontSize: 12,
    color: '#94A3B8',
    letterSpacing: 1,
  },
  paymentInfoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  fullDescriptionContainer: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  fullDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    letterSpacing: 0.5,
  },
  landlordInfoContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  landlordInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  landlordName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  landlordContact: {
    fontSize: 14,
    color: '#94A3B8',
    marginLeft: 12,
  },
  // Availability Status Styles
  availabilityStatusContainer: {
    marginBottom: 16,
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  availabilityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  tenantWarning: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FEF3C7',
    letterSpacing: 0.5,
    marginTop: 6,
    opacity: 0.9,
  },
  
  // Photo Gallery Styles
  photoGalleryContainer: {
    marginBottom: 16,
  },
  mainPhotoContainer: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mainPhoto: {
    width: '100%',
    height: '100%',
  },
  thumbnailScrollView: {
    maxHeight: 80,
  },
  thumbnailContainer: {
    paddingHorizontal: 2,
    gap: 8,
  },
  thumbnailWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedThumbnail: {
    borderColor: '#3B82F6',
  },
  thumbnailPhoto: {
    width: 70,
    height: 70,
  },
  noPhotosContainer: {
    marginBottom: 16,
  },
  noPhotosCard: {
    height: 200,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noPhotosText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 12,
    textAlign: 'center',
  },
  noPhotosSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  
  // Photo Overlay Styles
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  propertyInfoOverlay: {
    alignItems: 'flex-start',
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  overlayLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlayAddress: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
    opacity: 0.9,
  },
});