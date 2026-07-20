import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BRAND, FONTS, SPACE } from '../../constants/brand';

interface EmptyStateProps {
  icon?: string | React.ReactNode;
  title: string;
  subtitle?: string;
}

export function EmptyState({
  icon = '📦',
  title,
  subtitle,
}: EmptyStateProps) {
  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      return icon;
    }
    return <Text style={styles.icon}>{icon}</Text>;
  };

  return (
    <View style={styles.container}>
      {renderIcon()}
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACE.XL,
    minHeight: 200,
  },
  icon: {
    fontSize: 80,
    marginBottom: SPACE.MD,
  },
  title: {
    fontFamily: FONTS.SEMIBOLD,
    fontSize: 18,
    color: BRAND.TEXT,
    textAlign: 'center',
    marginBottom: SPACE.SM,
  },
  subtitle: {
    fontFamily: FONTS.BODY,
    fontSize: 14,
    color: BRAND.TEXT2,
    textAlign: 'center',
    lineHeight: 20,
  },
});
