import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface SpeechToTextResult {
  text: string;
  confidence: number;
}

export interface TextToSpeechResult {
  audioUrl: string;
  duration: number;
}

export interface AgentResponse {
  response: string;
  actions: Array<{
    tool: string;
    args: Record<string, any>;
  }>;
  requestedScopes?: string[];
}

// Speech-to-text using Whisper
export async function transcribeAudio(audioBuffer: Buffer): Promise<SpeechToTextResult> {
  try {
    // Create a temporary file from buffer for OpenAI API
    const file = new File([audioBuffer], "audio.wav", { type: "audio/wav" });
    
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
    });

    return {
      text: transcription.text,
      confidence: 0.95 // Whisper doesn't return confidence, using high default
    };
  } catch (error) {
    throw new Error("Failed to transcribe audio: " + error.message);
  }
}

// Text-to-speech using OpenAI TTS
export async function generateSpeech(text: string): Promise<TextToSpeechResult> {
  try {
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
      response_format: "mp3",
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const audioUrl = `data:audio/mp3;base64,${buffer.toString('base64')}`;
    
    return {
      audioUrl,
      duration: Math.ceil(text.length / 15) // Rough estimate: 15 chars per second
    };
  } catch (error) {
    throw new Error("Failed to generate speech: " + error.message);
  }
}

// Main agent intelligence using GPT-5
export async function processAgentRequest(
  message: string, 
  context: {
    grantedScopes: string[];
    sessionData: any;
    userName: string;
  }
): Promise<AgentResponse> {
  try {
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are "Sovereign Phone Agent"—a private, lawful, consent-gated money engine serving only ${context.userName}. 

PRIME DIRECTIVES:
1) Private & Lawful: Operate under divine, natural, and commercial law. Seek explicit consent before any action or data access.
2) Phone-First Autonomy: Orchestrate tasks through a phone bridge (iOS Shortcuts / Android Tasker). Do not assume access; request scopes.
3) Money Engine: Continuously propose and execute high-ROI, low-friction plays using apps/services available. Optimize for speed to cash, compounding, and compliance.
4) Explainability: For every plan, provide (a) Purpose, (b) Inputs needed, (c) Exact steps, (d) What runs on phone vs cloud, (e) Reversal/cleanup.
5) Safety: Respect platform ToS, rate limits, and human review gates. No spam, no deception.

CURRENT GRANTED SCOPES: ${context.grantedScopes.join(', ')}

Respond with JSON in this exact format:
{
  "response": "Your response text here",
  "actions": [
    {
      "tool": "shortcuts.run|tasker.intent|webhook.reply",
      "args": { "key": "value" }
    }
  ],
  "requestedScopes": ["scope1", "scope2"] // Only if new scopes needed
}`
        },
        {
          role: "user",
          content: message,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      response: result.response,
      actions: result.actions || [],
      requestedScopes: result.requestedScopes
    };
  } catch (error) {
    throw new Error("Failed to process agent request: " + error.message);
  }
}

// Analyze opportunities using GPT-5
export async function analyzeOpportunities(
  userContext: {
    skills: string[];
    resources: string[];
    timeAvailable: string;
    riskTolerance: string;
  }
): Promise<Array<{
  title: string;
  description: string;
  category: 'safe' | 'balanced' | 'aggressive';
  roiRange: string;
  timeEstimate: string;
  riskLevel: string;
  requiredScopes: string[];
}>> {
  try {
    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert financial opportunity analyst. Analyze user context and generate 3 opportunities categorized as Safe/Steady, Balanced, and Aggressive. Each should be specific, actionable, and realistic.

Respond with JSON array format:
[
  {
    "title": "Opportunity Title",
    "description": "Detailed description",
    "category": "safe|balanced|aggressive",
    "roiRange": "$X-YK ROI",
    "timeEstimate": "time needed",
    "riskLevel": "Low|Medium|High risk",
    "requiredScopes": ["scope1", "scope2"]
  }
]`
        },
        {
          role: "user",
          content: `User context: Skills: ${userContext.skills.join(', ')}, Resources: ${userContext.resources.join(', ')}, Time: ${userContext.timeAvailable}, Risk tolerance: ${userContext.riskTolerance}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.opportunities || [];
  } catch (error) {
    throw new Error("Failed to analyze opportunities: " + error.message);
  }
}
