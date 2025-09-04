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
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { API_BASE_URL } from '../../services/api';
import LocationDropdown from '../../components/LocationDropdown';

const { width: screenWidth } = Dimensions.get('window');

interface Property {
  id: string;
  title: string;
  address: string;
  monthlyRent: number;
  bedrooms: number;
  bathrooms: number;
  area?: number;
  propertyType: string;
  furnishingStatus: string;
  photos: string[];
  owner: {
    name: string;
    phone?: string;
  };
  availability: 'AVAILABLE' | 'ENDING_SOON';
  endDate?: string;
}

export default function SearchPropertiesScreen({ navigation }: any) {
  const { token, user } = useSelector((state: RootState) => state.auth);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    location: '',
    minBedrooms: '',
    maxBedrooms: '',
    minPrice: '',
    maxPrice: '',
  });
  
  const [filtersVisible, setFiltersVisible] = useState(false);

  useEffect(() => {
    searchProperties();
  }, []);

  const searchProperties = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.location) queryParams.append('location', filters.location);
      if (filters.minBedrooms) queryParams.append('minBedrooms', filters.minBedrooms);
      if (filters.maxBedrooms) queryParams.append('maxBedrooms', filters.maxBedrooms);
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);

      const response = await fetch(`${API_BASE_URL}/properties/available?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      if (response.ok) {
        setProperties(data.properties || []);
      } else {
        Alert.alert('Error', data.error || 'Failed to search properties');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await searchProperties();
    setRefreshing(false);
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      minBedrooms: '',
      maxBedrooms: '',
      minPrice: '',
      maxPrice: '',
    });
  };

  const applyFilters = () => {
    setFiltersVisible(false);
    searchProperties();
  };

  const getAvailabilityText = (property: Property) => {
    if (property.availability === 'ENDING_SOON') {
      return `Available from ${new Date(property.endDate!).toLocaleDateString()}`;
    }
    return 'Available now';
  };

  const getAvailabilityColor = (property: Property) => {
    return property.availability === 'ENDING_SOON' ? '#F59E0B' : '#10B981';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0F23', '#1A1A2E', '#16213E']}
        style={styles.backgroundGradient}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>SEARCH PROPERTIES</Text>
            <TouchableOpacity onPress={() => setFiltersVisible(!filtersVisible)}>
              <MaterialIcons 
                name="tune" 
                size={24} 
                color={filtersVisible ? "#6366F1" : "#FFFFFF"} 
              />
            </TouchableOpacity>
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FFFFFF"
                colors={['#6366F1', '#8B5CF6']}
              />
            }
          >
            {/* Filters Panel */}
            {filtersVisible && (
              <View style={styles.filtersContainer}>
                <LinearGradient
                  colors={['#1E293B', '#334155']}
                  style={styles.filtersPanel}
                >
                  <Text style={styles.filtersTitle}>SEARCH FILTERS</Text>
                  
                  {/* Location Filter */}
                  <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>LOCATION</Text>
                    <LocationDropdown
                      selectedLocation={filters.location}
                      onLocationSelect={(location) => setFilters(prev => ({ ...prev, location }))}
                      placeholder="SELECT LOCATION"
                    />
                  </View>

                  {/* Bedrooms Filter */}
                  <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>BEDROOMS</Text>
                    <View style={styles.rangeInputs}>
                      <View style={styles.rangeInput}>
                        <LinearGradient
                          colors={['#1E293B', '#334155']}
                          style={styles.inputBackground}
                        >
                          <TextInput
                            style={styles.input}
                            placeholder="Min"
                            placeholderTextColor="#64748B"
                            value={filters.minBedrooms}
                            onChangeText={(text) => setFilters(prev => ({ ...prev, minBedrooms: text }))}
                            keyboardType="numeric"
                          />
                        </LinearGradient>
                      </View>
                      <Text style={styles.rangeSeparator}>-</Text>
                      <View style={styles.rangeInput}>
                        <LinearGradient
                          colors={['#1E293B', '#334155']}
                          style={styles.inputBackground}
                        >
                          <TextInput
                            style={styles.input}
                            placeholder="Max"
                            placeholderTextColor="#64748B"
                            value={filters.maxBedrooms}
                            onChangeText={(text) => setFilters(prev => ({ ...prev, maxBedrooms: text }))}
                            keyboardType="numeric"
                          />
                        </LinearGradient>
                      </View>
                    </View>
                  </View>

                  {/* Price Filter */}
                  <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>MONTHLY RENT (AED)</Text>
                    <View style={styles.rangeInputs}>
                      <View style={styles.rangeInput}>
                        <LinearGradient
                          colors={['#1E293B', '#334155']}
                          style={styles.inputBackground}
                        >
                          <TextInput
                            style={styles.input}
                            placeholder="Min"
                            placeholderTextColor="#64748B"
                            value={filters.minPrice}
                            onChangeText={(text) => setFilters(prev => ({ ...prev, minPrice: text }))}
                            keyboardType="numeric"
                          />
                        </LinearGradient>
                      </View>
                      <Text style={styles.rangeSeparator}>-</Text>
                      <View style={styles.rangeInput}>
                        <LinearGradient
                          colors={['#1E293B', '#334155']}
                          style={styles.inputBackground}
                        >
                          <TextInput
                            style={styles.input}
                            placeholder="Max"
                            placeholderTextColor="#64748B"
                            value={filters.maxPrice}
                            onChangeText={(text) => setFilters(prev => ({ ...prev, maxPrice: text }))}
                            keyboardType="numeric"
                          />
                        </LinearGradient>
                      </View>
                    </View>
                  </View>

                  {/* Filter Actions */}
                  <View style={styles.filterActions}>
                    <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                      <Text style={styles.clearButtonText}>CLEAR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                      <LinearGradient
                        colors={['#6366F1', '#8B5CF6']}
                        style={styles.applyButtonGradient}
                      >
                        <Text style={styles.applyButtonText}>SEARCH</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* Results */}
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>
                AVAILABLE PROPERTIES ({properties.length})
              </Text>
              
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#6366F1" />
                  <Text style={styles.loadingText}>SEARCHING...</Text>
                </View>
              ) : properties.length === 0 ? (
                <View style={styles.emptyState}>
                  <LinearGradient
                    colors={['#1E293B', '#334155']}
                    style={styles.emptyCard}
                  >
                    <MaterialIcons name="search-off" size={48} color="#64748B" />
                    <Text style={styles.emptyTitle}>NO PROPERTIES FOUND</Text>
                    <Text style={styles.emptyDescription}>
                      Try adjusting your search filters or check back later for new listings.
                    </Text>
                  </LinearGradient>
                </View>
              ) : (
                properties.map((property) => (
                  <TouchableOpacity 
                    key={property.id} 
                    style={styles.propertyCard}
                    onPress={() => navigation.navigate('PropertyDetails', { property, fromMarketplace: true })}
                  >
                    <LinearGradient
                      colors={['#1E293B', '#334155', '#475569']}
                      style={styles.propertyCardGradient}
                    >
                      {/* Availability Badge */}
                      <View style={[styles.availabilityBadge, { backgroundColor: getAvailabilityColor(property) }]}>
                        <Text style={styles.availabilityText}>
                          {property.availability === 'ENDING_SOON' ? 'ENDING SOON' : 'AVAILABLE'}
                        </Text>
                      </View>

                      <Text style={styles.propertyTitle}>{property.title}</Text>
                      <Text style={styles.propertyAddress}>{property.address}</Text>
                      
                      <View style={styles.propertyDetails}>
                        <Text style={styles.propertyInfo}>
                          {property.bedrooms} BR • {property.bathrooms} BA
                          {property.area && ` • ${property.area} SQFT`}
                        </Text>
                        <Text style={styles.propertyType}>
                          {property.propertyType} • {property.furnishingStatus}
                        </Text>
                      </View>

                      <View style={styles.propertyFooter}>
                        <Text style={styles.propertyPrice}>AED {property.monthlyRent.toLocaleString()}/MONTH</Text>
                        <Text style={styles.availabilityDate}>{getAvailabilityText(property)}</Text>
                      </View>

                      <Text style={styles.ownerInfo}>
                        Owner: {property.owner.name}
                        {property.owner.phone && ` • ${property.owner.phone}`}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))
              )}
            </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  filtersContainer: {
    padding: 24,
  },
  filtersPanel: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 20,
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  rangeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rangeInput: {
    flex: 1,
  },
  rangeSeparator: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '600',
  },
  inputBackground: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#FFFFFF',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#64748B',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  applyButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  resultsContainer: {
    paddingHorizontal: 24,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyCard: {
    padding: 40,
    borderRadius: 20,
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
  },
  propertyCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  propertyCardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    position: 'relative',
  },
  availabilityBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.5,
    paddingRight: 80,
  },
  propertyAddress: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  propertyDetails: {
    marginBottom: 16,
  },
  propertyInfo: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  propertyType: {
    fontSize: 13,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  propertyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22C55E',
    letterSpacing: 0.5,
  },
  availabilityDate: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  ownerInfo: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
    letterSpacing: 0.5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
    paddingTop: 12,
  },
});