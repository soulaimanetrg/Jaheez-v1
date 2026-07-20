import React from 'react';
import { Text, TextProps } from 'react-native';

interface TTextProps extends TextProps {
  ar: string | undefined | null;
}

/**
 * Renders database-provided text exactly as stored.
 * Do not translate store/product/customer data automatically.
 */
export function TText({ ar, ...rest }: TTextProps) {
  return <Text {...rest}>{ar ?? ''}</Text>;
}
