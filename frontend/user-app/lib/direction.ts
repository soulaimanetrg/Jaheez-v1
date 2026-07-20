export function dirRow(isRTL: boolean) {
  return isRTL ? 'row-reverse' as const : 'row' as const;
}

export function dirRowReverse(isRTL: boolean) {
  return isRTL ? 'row' as const : 'row-reverse' as const;
}

export function dirText(isRTL: boolean) {
  return isRTL ? 'right' as const : 'left' as const;
}

export function dirItems(isRTL: boolean) {
  return isRTL ? 'flex-end' as const : 'flex-start' as const;
}

export function leadingChevron(isRTL: boolean) {
  return isRTL ? 'chevron-forward' as const : 'chevron-back' as const;
}

export function backArrow(isRTL: boolean) {
  return isRTL ? 'arrow-forward' as const : 'arrow-back' as const;
}
