export type IntentType = 'parliament' | 'query' | 'command' | 'unknown';

export function classifyIntent(userMessage: string): IntentType {
  const msg = userMessage.toLowerCase();
  
  // Check for parliament-related keywords
  if (msg.includes('parliament') || msg.includes('vote') || msg.includes('decide')) {
    return 'parliament';
  }
  
  // Check for query keywords
  if (msg.includes('?') || msg.includes('what') || msg.includes('how') || msg.includes('when')) {
    return 'query';
  }
  
  // Default to command
  return 'command';
}
