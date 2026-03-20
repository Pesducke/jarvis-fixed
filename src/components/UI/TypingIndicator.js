import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Colors, Font } from '../../theme';

export default function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    animate(dot1, 0).start();
    animate(dot2, 200).start();
    animate(dot3, 400).start();
  }, []);

  const dotStyle = (opacity) => ({
    opacity,
    fontSize: 28,
    color: Colors.accent,
    marginHorizontal: 2,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>JARVIS набирає</Text>
      <View style={styles.dots}>
        <Animated.Text style={dotStyle(dot1)}>.</Animated.Text>
        <Animated.Text style={dotStyle(dot2)}>.</Animated.Text>
        <Animated.Text style={dotStyle(dot3)}>.</Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  text: {
    fontFamily: Font.mono,
    fontSize: 20,
    color: Colors.muted,
    marginRight: 4,
  },
  dots: {
    flexDirection: 'row',
  },
});