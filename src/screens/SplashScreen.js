import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import quotes from '../../assets/quotes.json';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  // Випадкова цитата при монтуванні
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  
  // Анімація появи тексту
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Анімація появи
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Таймер для переходу на головний екран
    const timer = setTimeout(() => {
      onFinish();
    }, 8000); // 5 секунд

    return () => clearTimeout(timer);
  }, [fadeAnim, slideAnim, onFinish]);

  return (
    <ImageBackground
      source={require('../../assets/images/splash_bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.quoteContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.quoteText}>“{randomQuote.text}”</Text>
          <Text style={styles.authorText}>— {randomQuote.author}</Text>
        </Animated.View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
  },
  overlay: {
    flex: 1,

    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  quoteContainer: {

    maxWidth: width * 0.9,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 20,
    fontFamily: 'serif', // або ваш шрифт
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 12,
  },
  authorText: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#ccc',
    textAlign: 'center',
  },
});

export default SplashScreen;