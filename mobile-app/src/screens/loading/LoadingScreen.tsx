import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface LoadingScreenProps {
  onFinish: () => void;
}

export default function LoadingScreen({ onFinish }: LoadingScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    // Logo animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Glow pulse effect
    const glowPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    // Progress bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start();

    glowPulse.start();

    return () => {
      clearTimeout(timer);
      glowPulse.stop();
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />
      <LinearGradient
        colors={['#0F0F23', '#1A1A2E', '#16213E']}
        style={styles.container}
      >
        {/* Decorative glow effects */}
        <View style={[styles.glowOrb, styles.glowOrb1]} />
        <View style={[styles.glowOrb, styles.glowOrb2]} />
        <View style={[styles.glowOrb, styles.glowOrb3]} />

        {/* Main content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Futuristic Logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: glowAnim,
              },
            ]}
          >
            <LinearGradient
              colors={['#6366F1', '#8B5CF6', '#EC4899']}
              style={styles.logoBackground}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialIcons name="home" size={64} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.logoGlow} />
          </Animated.View>

          <View style={styles.titleContainer}>
            <Text style={styles.logoTextMain}>DURENT</Text>
            <Text style={styles.logoTextAccent}>DUBAI</Text>
          </View>

          <Text style={styles.subtitle}>FUTURISTIC RENTAL PLATFORM</Text>

          {/* Futuristic Progress bar */}
          <View style={styles.progressContainer}>
            <LinearGradient
              colors={['#1E293B', '#334155']}
              style={styles.progressBar}
            >
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressWidth,
                  },
                ]}
              />
            </LinearGradient>
          </View>

          <Text style={styles.loadingText}>INITIALIZING SYSTEM...</Text>
        </Animated.View>

        {/* Bottom tech pattern */}
        <View style={styles.bottomPattern}>
          <View style={styles.techLine} />
          <View style={styles.techDot} />
          <View style={styles.techLine} />
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 200,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  glowOrb1: {
    width: 400,
    height: 400,
    top: -150,
    right: -150,
  },
  glowOrb2: {
    width: 300,
    height: 300,
    bottom: -100,
    left: -100,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  glowOrb3: {
    width: 200,
    height: 200,
    top: '30%',
    left: -50,
    backgroundColor: 'rgba(236, 72, 153, 0.06)',
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 70,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    zIndex: -1,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoTextMain: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
    textAlign: 'center',
  },
  logoTextAccent: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366F1',
    letterSpacing: 6,
    marginTop: -8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 48,
    letterSpacing: 2,
    fontWeight: '500',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressBar: {
    width: 240,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 1,
  },
  bottomPattern: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  techLine: {
    width: 40,
    height: 1,
    backgroundColor: '#6366F1',
  },
  techDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EC4899',
  },
});