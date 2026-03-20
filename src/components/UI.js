import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors, Font } from '../theme';

export function Btn({ label, onPress, disabled, loading, ghost, style }) {
  return (
    <TouchableOpacity
      style={[s.btn, ghost ? s.ghost : s.primary, (disabled || loading) && s.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading
        ? <ActivityIndicator size="small" color={ghost ? Colors.accent : '#fff'} />
        : <Text style={[s.label, ghost && s.labelGhost]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

export function Dots() {
  return (
    <View style={s.dots}>
      {[0,1,2].map(i => <View key={i} style={[s.dot, { opacity: 0.3 + i * 0.2 }]} />)}
    </View>
  );
}

export function Pill({ label, active, onPress }) {
  return (
    <TouchableOpacity style={[s.pill, active && s.pillOn]} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.pillDot, { backgroundColor: active ? Colors.accent : Colors.muted }]} />
      <Text style={[s.pillTxt, active && s.pillTxtOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function SectionLabel({ text }) {
  return (
    <View style={s.secRow}>
      <Text style={s.secTxt}>{text}</Text>
      <View style={s.secLine} />
    </View>
  );
}

const s = StyleSheet.create({
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primary: { backgroundColor: Colors.purple },
  ghost: { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border2 },
  disabled: { opacity: 0.4 },
  label: { fontFamily: Font.sansM, fontSize: 18, color: '#fff' },
  labelGhost: { color: Colors.text },

  dots: { flexDirection: 'row', gap: 4, alignItems: 'center', paddingVertical: 4 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.muted },

  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border2, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6, margin: 3 },
  pillOn: { borderColor: Colors.accent, backgroundColor: '#c8b89a08' },
  pillDot: { width: 5, height: 5, borderRadius: 3 },
  pillTxt: { fontFamily: Font.mono, fontSize: 15, color: Colors.muted },
  pillTxtOn: { color: Colors.accent },

  secRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 16 },
  secTxt: { fontFamily: Font.mono, fontSize: 14, color: Colors.muted, textTransform: 'uppercase', letterSpacing: 1.5 },
  secLine: { flex: 1, height: 1, backgroundColor: Colors.border },
});
