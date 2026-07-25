import React from 'react';
import { AppIcon, AppIconProps } from './AppIcon';

export interface IoniconsProps extends Omit<AppIconProps, 'name'> {
  name: string;
}

export function Ionicons({ name, ...props }: IoniconsProps) {
  return <AppIcon name={name} {...props} />;
}
