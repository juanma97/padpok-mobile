import React, { useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, FONTS, SIZES, SPACING } from '../constants/theme';

interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  style?: ViewStyle;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, value, onChange, style }) => {
  const animatedValue = useRef(new Animated.Value(options.indexOf(value))).current;

  React.useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: options.indexOf(value),
      useNativeDriver: false,
      speed: 18,
      bounciness: 8,
    }).start();
  }, [value, options, animatedValue]);

  const segmentWidth = 100 / options.length;

  return (
    <View style={[styles.container, style]}>  
      <View style={styles.background}>
        <Animated.View
          style={[
            styles.activeSegment,
            {
              width: `${segmentWidth}%`,
              left: animatedValue.interpolate({
                inputRange: [0, options.length - 1],
                outputRange: ['0%', `${100 - segmentWidth}%`],
              }),
            },
          ]}
        />
        {options.map((option, idx) => {
          const isActive = value === option;
          return (
            <Pressable
              key={option}
              style={styles.pressable}
              onPress={() => onChange(option)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <Animated.Text
                style={[
                  styles.text,
                  isActive && styles.textActive,
                ]}
              >
                {option}
              </Animated.Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: SPACING.xs,
    paddingHorizontal: 2,
  },
  background: {
    flexDirection: 'row',
    backgroundColor: COLORS.light,
    borderRadius: 16,
    overflow: 'visible',
    position: 'relative',
    minHeight: 44,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  activeSegment: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    margin: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 8,
  },
  pressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    minHeight: 44,
    borderRadius: 14,
  },
  text: {
    color: COLORS.gray,
    fontFamily: FONTS.medium,
    fontSize: SIZES.md,
    letterSpacing: 0.2,
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  textActive: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: SIZES.md,
  },
});

export default SegmentedControl; 