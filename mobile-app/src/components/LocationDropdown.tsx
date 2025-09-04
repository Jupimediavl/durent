import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import DUBAI_LOCATIONS from '../data/dubaiLocations';

const { height: screenHeight } = Dimensions.get('window');

interface LocationDropdownProps {
  selectedLocation: string;
  onLocationSelect: (location: string) => void;
  placeholder?: string;
}

export default function LocationDropdown({ 
  selectedLocation, 
  onLocationSelect, 
  placeholder = "SELECT LOCATION" 
}: LocationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filteredLocations = DUBAI_LOCATIONS.filter(location =>
    location.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSelectLocation = (location: string) => {
    onLocationSelect(location);
    setIsOpen(false);
    setSearchText('');
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.dropdownContainer}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#1E293B', '#334155']}
          style={styles.dropdownBackground}
        >
          <MaterialIcons name="location-on" size={20} color="#06B6D4" />
          <Text style={[
            styles.dropdownText, 
            !selectedLocation && styles.placeholderText
          ]}>
            {selectedLocation || placeholder}
          </Text>
          <MaterialIcons 
            name="keyboard-arrow-down" 
            size={24} 
            color="#94A3B8" 
          />
        </LinearGradient>
        <View style={styles.dropdownGlow} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#0F0F23', '#1A1A2E']}
              style={styles.modalGradient}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>SELECT LOCATION</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsOpen(false)}
                >
                  <MaterialIcons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Search */}
              <View style={styles.searchContainer}>
                <LinearGradient
                  colors={['#1E293B', '#334155']}
                  style={styles.searchBackground}
                >
                  <MaterialIcons name="search" size={20} color="#94A3B8" />
                  <TextInput
                    style={styles.searchInput}
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder="SEARCH LOCATIONS..."
                    placeholderTextColor="#64748B"
                  />
                  {searchText ? (
                    <TouchableOpacity onPress={() => setSearchText('')}>
                      <MaterialIcons name="clear" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                  ) : null}
                </LinearGradient>
              </View>

              {/* Locations List */}
              <ScrollView 
                style={styles.locationsList}
                showsVerticalScrollIndicator={false}
              >
                {filteredLocations.map((location, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.locationItem}
                    onPress={() => handleSelectLocation(location)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={selectedLocation === location 
                        ? ['#6366F1', '#8B5CF6'] 
                        : ['rgba(30, 41, 59, 0.5)', 'rgba(51, 65, 85, 0.5)']}
                      style={styles.locationItemGradient}
                    >
                      <MaterialIcons 
                        name="location-on" 
                        size={18} 
                        color={selectedLocation === location ? "#FFFFFF" : "#94A3B8"} 
                      />
                      <Text style={[
                        styles.locationItemText,
                        selectedLocation === location && styles.selectedLocationText
                      ]}>
                        {location}
                      </Text>
                      {selectedLocation === location && (
                        <MaterialIcons name="check" size={18} color="#FFFFFF" />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
                {filteredLocations.length === 0 && (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>
                      NO LOCATIONS FOUND
                    </Text>
                  </View>
                )}
              </ScrollView>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dropdownContainer: {
    position: 'relative',
  },
  dropdownBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  dropdownGlow: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 13,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    zIndex: -1,
  },
  dropdownText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 12,
    fontWeight: '500',
  },
  placeholderText: {
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: screenHeight * 0.8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalGradient: {
    flex: 1,
    paddingTop: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  searchBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  locationsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  locationItem: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  locationItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  locationItemText: {
    flex: 1,
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  selectedLocationText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  noResultsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    letterSpacing: 1,
  },
});