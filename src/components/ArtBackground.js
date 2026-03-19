import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Імпортуйте всі зображення (можна автоматизувати)
const artworks = [
  require('../../assets/artworks/1.jpg'),
  require('../../assets/artworks/3.jpg'),
  require('../../assets/artworks/5.jpg'),
  require('../../assets/artworks/4.jpg'),
  // ... додайте решту
];

export default function ArtBackground({ children, imageIndex = null, overlayOpacity = 0.8 }) {
  const image = imageIndex !== null ? artworks[imageIndex % artworks.length] 
              : artworks[Math.floor(Math.random() * artworks.length)];

  return (
    <ImageBackground source={image} style={styles.background} resizeMode="cover">
      <LinearGradient
        colors={['rgba(10,15,15,0.8)', 'rgba(10,15,15,0.9)']}
        style={styles.overlay}
      >
        {children}
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    padding: 0, // відступи будуть у дочірніх компонентах
  },
});