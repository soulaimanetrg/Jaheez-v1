import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BRAND, FONTS } from '../../constants/brand';
import { PulseIndicator } from './PulseIndicator';
import { Ionicons } from '@/components/ui/Ionicons';

export interface ProgressTimelineProps {
  steps: string[];
  currentStep: number; // 0-indexed
}

export function ProgressTimeline({ steps, currentStep }: ProgressTimelineProps) {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <React.Fragment key={index}>
            {/* Step Element */}
            <View style={styles.stepContainer} accessibilityRole="summary" accessibilityLabel={`Step ${index + 1}: ${step}. ${isCompleted ? 'Completed' : isCurrent ? 'Active' : 'Pending'}`}>
              <View style={styles.indicatorContainer}>
                {isCompleted ? (
                  <View style={styles.completedCircle}>
                    <Ionicons name="checkmark" size={12} color={BRAND.SURFACE} />
                  </View>
                ) : isCurrent ? (
                  <PulseIndicator color={BRAND.RED} size={20} />
                ) : (
                  <View style={styles.inactiveCircle} />
                )}
              </View>
              <Text 
                style={[
                  styles.stepText,
                  { 
                    color: isCurrent || isCompleted ? BRAND.TEXT : BRAND.TEXT3, 
                    fontFamily: isCurrent ? FONTS.SEMIBOLD : FONTS.BODY,
                  }
                ]}
              >
                {step}
              </Text>
            </View>

            {/* Connecting Horizontal Line (except for last item) */}
            {index < steps.length - 1 && (
              <View 
                style={[
                  styles.connector,
                  { backgroundColor: isCompleted ? BRAND.GREEN : BRAND.BORDER }
                ]} 
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
  },
  indicatorContainer: {
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  completedCircle: {
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    backgroundColor: BRAND.GREEN, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  inactiveCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: BRAND.BORDER,
  },
  stepText: {
    textAlign: 'center',
    fontSize: 10,
  },
  connector: {
    height: 2, 
    flex: 1, 
    backgroundColor: BRAND.BORDER,
    marginTop: -16, // NegMargin aligns it with the circles above the text
  },
});

