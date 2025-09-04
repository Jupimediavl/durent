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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { API_BASE_URL } from '../../services/api';
import LocationDropdown from '../../components/LocationDropdown';

const { width: screenWidth } = Dimensions.get('window');

export default function AddPropertyScreen({ navigation }: any) {
  const { token } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    monthlyRent: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    location: '',
    address: '',
  });

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
          monthlyRent: parseInt(formData.monthlyRent),
          bedrooms: parseInt(formData.bedrooms),
          bathrooms: parseInt(formData.bathrooms),
          area: formData.area ? parseInt(formData.area) : null,
          address: formData.location + (formData.address ? ', ' + formData.address : ''),
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

              <View style={styles.form}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>BASIC INFORMATION</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>PROPERTY TITLE *</Text>
                    <View style={styles.inputContainer}>
                      <LinearGradient
                        colors={['#1E293B', '#334155']}
                        style={styles.inputBackground}
                      >
                        <MaterialIcons name="home" size={20} color="#6366F1" />
                        <TextInput
                          style={styles.input}
                          value={formData.title}
                          onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                          placeholder="E.G., MODERN 2BR APARTMENT IN DUBAI MARINA"
                          placeholderTextColor="#64748B"
                        />
                      </LinearGradient>
                      <View style={styles.inputGlow} />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>DESCRIPTION</Text>
                    <View style={styles.inputContainer}>
                      <LinearGradient
                        colors={['#1E293B', '#334155']}
                        style={styles.textAreaBackground}
                      >
                        <MaterialIcons name="description" size={20} color="#8B5CF6" />
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          value={formData.description}
                          onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                          placeholder="DESCRIBE THE PROPERTY FEATURES, AMENITIES, ETC."
                          placeholderTextColor="#64748B"
                          multiline
                          numberOfLines={4}
                        />
                      </LinearGradient>
                      <View style={styles.inputGlow} />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>MONTHLY RENT (AED) *</Text>
                    <View style={styles.inputContainer}>
                      <LinearGradient
                        colors={['#1E293B', '#334155']}
                        style={styles.inputBackground}
                      >
                        <MaterialIcons name="attach-money" size={20} color="#22C55E" />
                        <TextInput
                          style={styles.input}
                          value={formData.monthlyRent}
                          onChangeText={(text) => setFormData(prev => ({ ...prev, monthlyRent: text }))}
                          placeholder="E.G., 5000"
                          placeholderTextColor="#64748B"
                          keyboardType="numeric"
                        />
                      </LinearGradient>
                      <View style={styles.inputGlow} />
                    </View>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>PROPERTY DETAILS</Text>
                  
                  <View style={styles.row}>
                    <View style={[styles.inputGroup, styles.halfWidth]}>
                      <Text style={styles.label}>BEDROOMS *</Text>
                      <View style={styles.inputContainer}>
                        <LinearGradient
                          colors={['#1E293B', '#334155']}
                          style={styles.inputBackground}
                        >
                          <MaterialIcons name="bed" size={20} color="#EC4899" />
                          <TextInput
                            style={styles.input}
                            value={formData.bedrooms}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, bedrooms: text }))}
                            placeholder="E.G., 2"
                            placeholderTextColor="#64748B"
                            keyboardType="numeric"
                          />
                        </LinearGradient>
                        <View style={styles.inputGlow} />
                      </View>
                    </View>

                    <View style={[styles.inputGroup, styles.halfWidth]}>
                      <Text style={styles.label}>BATHROOMS *</Text>
                      <View style={styles.inputContainer}>
                        <LinearGradient
                          colors={['#1E293B', '#334155']}
                          style={styles.inputBackground}
                        >
                          <MaterialIcons name="bathtub" size={20} color="#F97316" />
                          <TextInput
                            style={styles.input}
                            value={formData.bathrooms}
                            onChangeText={(text) => setFormData(prev => ({ ...prev, bathrooms: text }))}
                            placeholder="E.G., 2"
                            placeholderTextColor="#64748B"
                            keyboardType="numeric"
                          />
                        </LinearGradient>
                        <View style={styles.inputGlow} />
                      </View>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>AREA (SQ FT)</Text>
                    <View style={styles.inputContainer}>
                      <LinearGradient
                        colors={['#1E293B', '#334155']}
                        style={styles.inputBackground}
                      >
                        <MaterialIcons name="aspect-ratio" size={20} color="#EAB308" />
                        <TextInput
                          style={styles.input}
                          value={formData.area}
                          onChangeText={(text) => setFormData(prev => ({ ...prev, area: text }))}
                          placeholder="E.G., 1200"
                          placeholderTextColor="#64748B"
                          keyboardType="numeric"
                        />
                      </LinearGradient>
                      <View style={styles.inputGlow} />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>LOCATION *</Text>
                    <LocationDropdown
                      selectedLocation={formData.location}
                      onLocationSelect={(location) => setFormData(prev => ({ ...prev, location }))}
                      placeholder="SELECT DUBAI LOCATION"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>BUILDING/STREET ADDRESS</Text>
                    <View style={styles.inputContainer}>
                      <LinearGradient
                        colors={['#1E293B', '#334155']}
                        style={styles.textAreaBackground}
                      >
                        <MaterialIcons name="business" size={20} color="#06B6D4" />
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          value={formData.address}
                          onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                          placeholder="BUILDING NAME, STREET, ADDITIONAL DETAILS"
                          placeholderTextColor="#64748B"
                          multiline
                          numberOfLines={2}
                        />
                      </LinearGradient>
                      <View style={styles.inputGlow} />
                    </View>
                  </View>
                </View>

                <View style={styles.section}>
                  <TouchableOpacity 
                    style={styles.submitButtonContainer}
                    onPress={handleAddProperty}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={loading ? ['#64748B', '#64748B'] : ['#22C55E', '#16A34A']}
                      style={styles.submitButton}
                    >
                      <MaterialIcons 
                        name={loading ? "hourglass-empty" : "add-home"} 
                        size={24} 
                        color="#FFFFFF" 
                      />
                      <Text style={styles.submitButtonText}>
                        {loading ? 'ADDING PROPERTY...' : 'ADD PROPERTY'}
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
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 12,
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  submitButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
});