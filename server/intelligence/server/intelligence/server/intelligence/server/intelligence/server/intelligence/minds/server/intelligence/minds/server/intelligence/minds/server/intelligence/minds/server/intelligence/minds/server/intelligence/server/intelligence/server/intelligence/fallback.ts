export interface FallbackResponse {
  message: string;
  suggestion: string;
  fallbackMode: 'STATIC' | 'RULES_BASED' | 'HYBRID';
  timestamp: string;
}

export function generateFallback(intent: string, reasons: string[]): FallbackResponse {
  const timestamp = new Date().toISOString();
  
  if (reasons.some(r => r.includes('Rate limit') || r.includes('quota'))) {
    return {
      message: 'OpenAI API rate limit exceeded',
      suggestion: 'The intelligent system is temporarily unavailable. Please retry in a few moments.',
      fallbackMode: 'RULES_BASED',
      timestamp
    };
  }

  return {
    message: `Unable to process ${intent} request`,
    suggestion: 'The system encountered an issue. Please check the ledger for details.',
    fallbackMode: 'STATIC',
    timestamp
  };
}