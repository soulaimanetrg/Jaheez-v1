export function isMissingColumnError(error: unknown): boolean {
  const message = error instanceof Error
    ? error.message
    : typeof (error as { message?: unknown })?.message === 'string'
      ? String((error as { message: string }).message)
      : '';

  return message.includes('does not exist') || message.includes('Could not find');
}
