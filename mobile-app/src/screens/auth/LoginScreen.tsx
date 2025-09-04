import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { authService } from '../../services/authService';
import { setAuth } from '../../store';

const { width: screenWidth } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();

  const handleLogin = async () => {
    try {
      const response = await authService.login(email, password);
      dispatch(setAuth(response));
      
      if (response.user.userType === 'LANDLORD') {
        navigation.replace('LandlordDashboard');
      } else {
        navigation.replace('TenantDashboard');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Login failed');
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
            <View style={styles.content}>
              {/* App Logo/Title */}
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6', '#EC4899']}
                  style={styles.logoBackground}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <MaterialIcons name="home" size={48} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.title}>DURENT DUBAI</Text>
                <Text style={styles.subtitle}>SIGN IN TO YOUR ACCOUNT</Text>
              </View>
              
              {/* Login Form */}
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>EMAIL ADDRESS</Text>
                  <View style={styles.inputContainer}>
                    <LinearGradient
                      colors={['#1E293B', '#334155']}
                      style={styles.inputBackground}
                    >
                      <MaterialIcons name="email" size={20} color="#6366F1" />
                      <TextInput
                        style={styles.input}
                        placeholder="ENTER YOUR EMAIL"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor="#64748B"
                      />
                    </LinearGradient>
                    <View style={styles.inputGlow} />
                  </View>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>PASSWORD</Text>
                  <View style={styles.inputContainer}>
                    <LinearGradient
                      colors={['#1E293B', '#334155']}
                      style={styles.inputBackground}
                    >
                      <MaterialIcons name="lock" size={20} color="#8B5CF6" />
                      <TextInput
                        style={styles.input}
                        placeholder="ENTER YOUR PASSWORD"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholderTextColor="#64748B"
                      />
                    </LinearGradient>
                    <View style={styles.inputGlow} />
                  </View>
                </View>
                
                {/* Sign In Button */}
                <TouchableOpacity style={styles.buttonContainer} onPress={handleLogin}>
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6', '#EC4899']}
                    style={styles.button}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialIcons name="login" size={24} color="#FFFFFF" />
                    <Text style={styles.buttonText}>SIGN IN</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                {/* Register Link */}
                <TouchableOpacity 
                  style={styles.linkContainer}
                  onPress={() => navigation.navigate('Register')}
                >
                  <Text style={styles.linkText}>DON'T HAVE AN ACCOUNT? </Text>
                  <Text style={styles.linkHighlight}>SIGN UP</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
  formContainer: {
    width: '100%',
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
    paddingVertical: 16,
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
  buttonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    color: '#94A3B8',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  linkHighlight: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});