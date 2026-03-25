import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import quotes from '../../assets/quotes.json'; // путь к вашему файлу с цитатами

const { width, height } = Dimensions.get('window');

// Импортируем все изображения (явный список, потому что require не поддерживает динамические имена)
const splashImages = [
  require('../../assets/images/splash/1.jpg'),
require('../../assets/images/splash/2.jpg'),
require('../../assets/images/splash/3.jpg'),
require('../../assets/images/splash/4.jpg'),
require('../../assets/images/splash/5.jpg'),
require('../../assets/images/splash/6.jpg'),
require('../../assets/images/splash/7.jpg'),
require('../../assets/images/splash/8.jpg'),
require('../../assets/images/splash/9.jpg'),
require('../../assets/images/splash/10.jpg'),
require('../../assets/images/splash/11.jpg'),
require('../../assets/images/splash/12.jpg'),
require('../../assets/images/splash/13.jpg'),
require('../../assets/images/splash/14.jpg'),
require('../../assets/images/splash/15.jpg'),
require('../../assets/images/splash/16.jpg'),
require('../../assets/images/splash/17.jpg'),
require('../../assets/images/splash/18.jpg'),
require('../../assets/images/splash/19.jpg'),
require('../../assets/images/splash/20.jpg'),
require('../../assets/images/splash/21.jpg'),
require('../../assets/images/splash/22.jpg'),
require('../../assets/images/splash/23.jpg'),
require('../../assets/images/splash/24.jpg'),
require('../../assets/images/splash/25.jpg'),
require('../../assets/images/splash/26.jpg'),
require('../../assets/images/splash/27.jpg'),
require('../../assets/images/splash/28.jpg'),
require('../../assets/images/splash/29.jpg'),
require('../../assets/images/splash/30.jpg'),
require('../../assets/images/splash/31.jpg'),
require('../../assets/images/splash/32.jpg'),
require('../../assets/images/splash/33.jpg'),
require('../../assets/images/splash/34.jpg'),
require('../../assets/images/splash/35.jpg'),
require('../../assets/images/splash/36.jpg'),
];

const SplashScreen = ({ onFinish }) => {
  // Случайный выбор изображения при монтировании
  const randomImage = splashImages[Math.floor(Math.random() * splashImages.length)];
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
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

    const timer = setTimeout(() => {
      onFinish();
    }, 8000);

    return () => clearTimeout(timer);
  }, [fadeAnim, slideAnim, onFinish]);

  return (
    <ImageBackground
      source={randomImage}
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
    fontSize: 26,
    fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
    fontStyle: 'italic',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  authorText: {
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#f0f0f0',
    textAlign: 'center',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default SplashScreen;