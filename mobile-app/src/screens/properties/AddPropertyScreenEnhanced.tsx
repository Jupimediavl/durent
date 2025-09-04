import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { API_BASE_URL } from '../../services/api';
import LocationDropdown from '../../components/LocationDropdown';

const { width: screenWidth } = Dimensions.get('window');

const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Apartment', icon: 'apartment' },
  { value: 'VILLA', label: 'Villa', icon: 'house' },
  { value: 'STUDIO', label: 'Studio', icon: 'hotel' },
  { value: 'TOWNHOUSE', label: 'Townhouse', icon: 'home' },
  { value: 'PENTHOUSE', label: 'Penthouse', icon: 'roofing' },
];

const FURNISHING_STATUS = [
  { value: 'FURNISHED', label: 'Furnished', icon: 'weekend' },
  { value: 'SEMI_FURNISHED', label: 'Semi-Furnished', icon: 'chair' },
  { value: 'UNFURNISHED', label: 'Unfurnished', icon: 'home-work' },
];

export default function AddPropertyScreenEnhanced({ navigation }: any) {
  const { token } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: 'APARTMENT',
    furnishingStatus: 'UNFURNISHED',
    monthlyRent: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    location: '',
    address: '',
    photos: [] as string[],
  });

  // Image picker function
  const pickImages = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
        base64: true,
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets) {
        const base64Images = result.assets.map((asset) => {
          if (asset.base64) {
            return `data:image/jpeg;base64,${asset.base64}`;
          }
          return '';
        }).filter(img => img !== '');

        setFormData({
          ...formData,
          photos: [...formData.photos, ...base64Images].slice(0, 10),
        });
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  // Take photo function
  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow access to your camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setFormData({
          ...formData,
          photos: [...formData.photos, base64Image].slice(0, 10),
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Remove photo
  const removePhoto = (index: number) => {
    const newPhotos = formData.photos.filter((_, i) => i !== index);
    setFormData({ ...formData, photos: newPhotos });
  };

  const handleAddProperty = async () => {
    if (!formData.title || !formData.monthlyRent || !formData.bedrooms || !formData.bathrooms || !formData.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          propertyType: formData.propertyType,
          furnishingStatus: formData.furnishingStatus,
          monthlyRent: parseInt(formData.monthlyRent),
          bedrooms: parseInt(formData.bedrooms),
          bathrooms: parseInt(formData.bathrooms),
          area: formData.area ? parseInt(formData.area) : null,
          address: formData.location + (formData.address ? ', ' + formData.address : ''),
          photos: formData.photos,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Property added successfully!', [
          { text: 'OK', onPress: () => navigation.popToTop() }
        ]);
      } else {
        Alert.alert('Error', data.error || 'Failed to add property');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
                <Text style={styles.title}>ADD NEW PROPERTY</Text>
                <View style={styles.headerLine} />
              </View>

              {/* Photo Upload Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PROPERTY PHOTOS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                  {formData.photos.map((photo, index) => (
                    <View key={index} style={styles.photoContainer}>
                      <Image source={{ uri: photo }} style={styles.photo} />
                      <TouchableOpacity 
                        style={styles.removePhotoButton}
                        onPress={() => removePhoto(index)}
                      >
                        <MaterialIcons name="close" size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {formData.photos.length < 10 && (
                    <>
                      <TouchableOpacity style={styles.addPhotoButton} onPress={pickImages}>
                        <LinearGradient
                          colors={['#6366F1', '#8B5CF6']}
                          style={styles.addPhotoGradient}
                        >
                          <MaterialIcons name="photo-library" size={32} color="#FFFFFF" />
                          <Text style={styles.addPhotoText}>GALLERY</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.addPhotoButton} onPress={takePhoto}>
                        <LinearGradient
                          colors={['#22C55E', '#16A34A']}
                          style={styles.addPhotoGradient}
                        >
                          <MaterialIcons name="camera-alt" size={32} color="#FFFFFF" />
                          <Text style={styles.addPhotoText}>CAMERA</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </>
                  )}
                </ScrollView>
                <Text style={styles.photoCount}>{formData.photos.length}/10 PHOTOS</Text>
              </View>

              {/* Property Type Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PROPERTY TYPE *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
                  {PROPERTY_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      onPress={() => setFormData({ ...formData, propertyType: type.value })}
                      style={[
                        styles.optionCard,
                        formData.propertyType === type.value && styles.optionCardActive,
                      ]}
                    >
                      <LinearGradient
                        colors={
                          formData.propertyType === type.value 
                            ? ['#6366F1', '#8B5CF6']
                            : ['#1E293B', '#334155']
                        }
                        style={styles.optionGradient}
                      >
                        <MaterialIcons 
                          name={type.icon as any} 
                          size={28} 
                          color="#FFFFFF" 
                        />
                        <Text style={styles.optionText}>{type.label.toUpperCase()}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Furnishing Status Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>FURNISHING STATUS *</Text>
                <View style={styles.optionRow}>
                  {FURNISHING_STATUS.map((status) => (
                    <TouchableOpacity
                      key={status.value}
                      onPress={() => setFormData({ ...formData, furnishingStatus: status.value })}
                      style={[
                        styles.furnishOptionCard,
                        formData.furnishingStatus === status.value && styles.optionCardActive,
                      ]}
                    >
                      <LinearGradient
                        colors={
                          formData.furnishingStatus === status.value 
                            ? ['#22C55E', '#16A34A']
                            : ['#1E293B', '#334155']
                        }
                        style={styles.furnishOptionGradient}
                      >
                        <MaterialIcons 
                          name={status.icon as any} 
                          size={24} 
                          color="#FFFFFF" 
                        />
                        <Text style={styles.furnishOptionText}>{status.label.toUpperCase()}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Form Fields */}
              <View style={styles.card}>
                <LinearGradient
                  colors={['#1E293B', '#334155']}
                  style={styles.cardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.inputWrapper}>
                    <Text style={styles.label}>PROPERTY TITLE *</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        value={formData.title}
                        onChangeText={(text) => setFormData({ ...formData, title: text })}
                        placeholder="e.g., Modern 2BR Apartment in Marina"
                        placeholderTextColor="#64748B"
                      />
                    </View>
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.label}>DESCRIPTION</Text>
                    <View style={[styles.inputContainer, styles.textAreaContainer]}>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.description}
                        onChangeText={(text) => setFormData({ ...formData, description: text })}
                        placeholder="Describe the property features..."
                        placeholderTextColor="#64748B"
                        multiline
                        numberOfLines={4}
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={styles.halfInput}>
                      <Text style={styles.label}>RENT (AED) *</Text>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.input}
                          value={formData.monthlyRent}
                          onChangeText={(text) => setFormData({ ...formData, monthlyRent: text })}
                          placeholder="0"
                          placeholderTextColor="#64748B"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                    <View style={styles.halfInput}>
                      <Text style={styles.label}>AREA (SQFT)</Text>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.input}
                          value={formData.area}
                          onChangeText={(text) => setFormData({ ...formData, area: text })}
                          placeholder="0"
                          placeholderTextColor="#64748B"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={styles.halfInput}>
                      <Text style={styles.label}>BEDROOMS *</Text>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.input}
                          value={formData.bedrooms}
                          onChangeText={(text) => setFormData({ ...formData, bedrooms: text })}
                          placeholder="0"
                          placeholderTextColor="#64748B"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                    <View style={styles.halfInput}>
                      <Text style={styles.label}>BATHROOMS *</Text>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.input}
                          value={formData.bathrooms}
                          onChangeText={(text) => setFormData({ ...formData, bathrooms: text })}
                          placeholder="0"
                          placeholderTextColor="#64748B"
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.label}>LOCATION *</Text>
                    <LocationDropdown
                      selectedLocation={formData.location}
                      onLocationSelect={(location) => setFormData(prev => ({ ...prev, location }))}
                      placeholder="SELECT DUBAI LOCATION"
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.label}>BUILDING/STREET ADDRESS</Text>
                    <View style={[styles.inputContainer, styles.textAreaContainer]}>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        value={formData.address}
                        onChangeText={(text) => setFormData({ ...formData, address: text })}
                        placeholder="Building name, street, additional details"
                        placeholderTextColor="#64748B"
                        multiline
                        numberOfLines={2}
                      />
                    </View>
                  </View>
                </LinearGradient>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={handleAddProperty}
                disabled={loading}
              >
                <LinearGradient
                  colors={loading ? ['#64748B', '#64748B'] : ['#6366F1', '#8B5CF6']}
                  style={styles.submitGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialIcons name="add-business" size={24} color="#FFFFFF" />
                      <Text style={styles.submitText}>ADD PROPERTY</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
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
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 5,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 10,
  },
  headerLine: {
    height: 2,
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    marginTop: 10,
  },
  section: {
    marginHorizontal: 20,
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  photoScroll: {
    marginBottom: 10,
  },
  photoContainer: {
    marginRight: 10,
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
  addPhotoButton: {
    marginRight: 10,
  },
  addPhotoGradient: {
    width: 120,
    height: 120,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 1,
  },
  photoCount: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  optionScroll: {
    flexDirection: 'row',
  },
  optionCard: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionCardActive: {
    transform: [{ scale: 1.05 }],
  },
  optionGradient: {
    paddingVertical: 20,
    paddingHorizontal: 25,
    alignItems: 'center',
    borderRadius: 12,
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  furnishOptionCard: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  furnishOptionGradient: {
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  furnishOptionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
    borderRadius: 20,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  inputContainer: {
    backgroundColor: 'rgba(15, 15, 35, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  input: {
    color: '#FFFFFF',
    fontSize: 16,
    padding: 15,
  },
  textAreaContainer: {
    minHeight: 100,
  },
  textArea: {
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  submitButton: {
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 1.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
});