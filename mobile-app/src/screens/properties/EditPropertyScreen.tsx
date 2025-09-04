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
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { API_BASE_URL } from '../../services/api';
import LocationDropdown from '../../components/LocationDropdown';
import DUBAI_LOCATIONS from '../../data/dubaiLocations';

const { width: screenWidth } = Dimensions.get('window');

export default function EditPropertyScreen({ route, navigation }: any) {
  const { property } = route.params;
  const { token } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  // Extract location from existing address
  const extractLocationFromAddress = (address: string) => {
    if (!address) return { location: '', remainingAddress: '' };
    
    const foundLocation = DUBAI_LOCATIONS.find(loc => 
      address.toLowerCase().includes(loc.toLowerCase())
    );
    
    if (foundLocation) {
      const remainingAddress = address.replace(foundLocation, '').replace(/^,\s*|,\s*$/, '').trim();
      return { location: foundLocation, remainingAddress };
    }
    
    return { location: '', remainingAddress: address };
  };

  const { location, remainingAddress } = extractLocationFromAddress(property.address || '');

  const [formData, setFormData] = useState({
    title: property.title || '',
    description: property.description || '',
    monthlyRent: property.monthlyRent?.toString() || '',
    bedrooms: property.bedrooms?.toString() || '',
    bathrooms: property.bathrooms?.toString() || '',
    area: property.area?.toString() || '',
    location: location,
    address: remainingAddress,
  });

  const handleUpdateProperty = async () => {
    if (!formData.title || !formData.monthlyRent || !formData.bedrooms || !formData.bathrooms || !formData.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/properties/${property.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          monthlyRent: parseInt(formData.monthlyRent),
          bedrooms: parseInt(formData.bedrooms),
          bathrooms: parseInt(formData.bathrooms),
          area: formData.area ? parseInt(formData.area) : null,
          address: formData.location + (formData.address ? ', ' + formData.address : ''),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          'Property updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to update property');
      }
    } catch (error) {
      console.error('Update property error:', error);
      Alert.alert('Error', 'Failed to update property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0F0F23', '#1A1A2E', '#16213E']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>EDIT PROPERTY</Text>
          <View style={styles.placeholder} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Form Card */}
            <LinearGradient
              colors={['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.1)']}
              style={styles.formCard}
            >
              {/* Title */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>PROPERTY TITLE *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder="Enter property title"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                />
              </View>

              {/* Description */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>DESCRIPTION</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Property description"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Monthly Rent */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>MONTHLY RENT (AED) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.monthlyRent}
                  onChangeText={(text) => setFormData({ ...formData, monthlyRent: text })}
                  placeholder="0"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  keyboardType="numeric"
                />
              </View>

              {/* Bedrooms & Bathrooms Row */}
              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>BEDROOMS *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.bedrooms}
                    onChangeText={(text) => setFormData({ ...formData, bedrooms: text })}
                    placeholder="0"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>BATHROOMS *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.bathrooms}
                    onChangeText={(text) => setFormData({ ...formData, bathrooms: text })}
                    placeholder="0"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Area */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>AREA (SQFT)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.area}
                  onChangeText={(text) => setFormData({ ...formData, area: text })}
                  placeholder="Optional"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  keyboardType="numeric"
                />
              </View>

              {/* Location */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>LOCATION *</Text>
                <LocationDropdown
                  selectedLocation={formData.location}
                  onLocationSelect={(location) => setFormData(prev => ({ ...prev, location }))}
                  placeholder="SELECT DUBAI LOCATION"
                />
              </View>

              {/* Additional Address */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>BUILDING/STREET ADDRESS</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  placeholder="Building name, street, additional details"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  multiline
                  numberOfLines={2}
                />
              </View>
            </LinearGradient>

            {/* Update Button */}
            <TouchableOpacity
              style={[styles.updateButton, loading && styles.disabledButton]}
              onPress={handleUpdateProperty}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#666', '#999'] : ['#6366F1', '#8B5CF6']}
                style={styles.buttonGradient}
              >
                <MaterialIcons
                  name="save"
                  size={24}
                  color="#FFFFFF"
                  style={styles.buttonIcon}
                />
                <Text style={styles.buttonText}>
                  {loading ? 'UPDATING...' : 'UPDATE PROPERTY'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  updateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
});