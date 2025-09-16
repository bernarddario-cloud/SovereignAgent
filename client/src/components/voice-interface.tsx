import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVoiceRecognition, useAudioRecording } from '@/hooks/use-voice';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface VoiceInterfaceProps {
  sessionId: string;
  onResponse?: (data: any) => void;
}

export function VoiceInterface({ sessionId, onResponse }: VoiceInterfaceProps) {
  const [speechInput, setSpeechInput] = useState('');
  const [agentResponse, setAgentResponse] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioResponseUrl, setAudioResponseUrl] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { isListening, isSupported, startListening, stopListening } = useVoiceRecognition();
  const { isRecording, startRecording, stopRecording, getAudioBlob, clearRecording } = useAudioRecording();

  const handleVoiceCommand = async () => {
    if (isListening) {
      stopListening();
      
      // If we have recorded audio, process it
      if (isRecording) {
        stopRecording();
        
        try {
          setIsProcessing(true);
          const audioBlob = await getAudioBlob();
          
          if (audioBlob) {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'voice.webm');
            
            const response = await apiRequest('POST', `/api/sessions/${sessionId}/voice`, formData);
            const result = await response.json();
            
            setSpeechInput(result.transcription);
            setAgentResponse(result.response);
            setAudioResponseUrl(result.audioResponse);
            setConfidence(0.94); // Mock confidence for now
            
            onResponse?.(result);
            
            toast({
              title: "Voice Command Processed",
              description: "Your voice command has been processed successfully.",
            });
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to process voice command: " + error.message,
            variant: "destructive"
          });
        } finally {
          setIsProcessing(false);
          clearRecording();
        }
      }
    } else {
      // Start both speech recognition and recording
      setSpeechInput('');
      setAgentResponse('');
      setAudioResponseUrl(null);
      
      startRecording();
      
      startListening(
        (result) => {
          if (result.isFinal) {
            setSpeechInput(result.transcript);
            setConfidence(result.confidence);
          } else {
            setSpeechInput(result.transcript + '...');
          }
        },
        (error) => {
          toast({
            title: "Speech Recognition Error",
            description: error.error,
            variant: "destructive"
          });
        }
      );
    }
  };

  const handleClearInput = () => {
    setSpeechInput('');
    setAgentResponse('');
    setAudioResponseUrl(null);
    setConfidence(0);
  };

  const handlePlayResponse = () => {
    if (audioResponseUrl) {
      const audio = new Audio(audioResponseUrl);
      audio.play().catch(error => {
        toast({
          title: "Playback Error",
          description: "Failed to play audio response",
          variant: "destructive"
        });
      });
    }
  };

  // Clean up audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioResponseUrl) {
        URL.revokeObjectURL(audioResponseUrl);
      }
    };
  }, [audioResponseUrl]);

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">Voice Interface</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <i className="fas fa-microphone-slash text-4xl text-muted-foreground mb-4"></i>
            <p className="text-muted-foreground">
              Voice recognition is not supported in this browser.
              <br />
              Please use a modern browser with microphone support.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-foreground">Voice Interface</CardTitle>
          <div className="flex items-center space-x-2">
            {(isListening || isRecording) && (
              <>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400">Listening</span>
              </>
            )}
            {isProcessing && (
              <>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-400">Processing</span>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Speech Input */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-microphone text-primary"></i>
              <h4 className="font-medium text-foreground">Speech Input</h4>
            </div>
            <div className="bg-muted rounded-lg p-4 min-h-[100px] border border-input">
              <p className="text-sm text-foreground whitespace-pre-wrap" data-testid="speech-input">
                {speechInput || (
                  <span className="text-muted-foreground italic">
                    {isListening ? "Listening..." : "Click the microphone to start"}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Confidence: <span className="text-green-400">{Math.round(confidence * 100)}%</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearInput}
                data-testid="button-clear-input"
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Agent Response */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-volume-up text-accent"></i>
              <h4 className="font-medium text-foreground">Agent Response</h4>
            </div>
            <div className="bg-muted rounded-lg p-4 min-h-[100px] border border-input">
              <p className="text-sm text-foreground whitespace-pre-wrap" data-testid="agent-response">
                {agentResponse || (
                  <span className="text-muted-foreground italic">
                    Agent response will appear here...
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlayResponse}
                disabled={!audioResponseUrl}
                data-testid="button-play-response"
              >
                <i className="fas fa-play mr-2"></i>Play Audio
              </Button>
              <span className="text-muted-foreground">
                Duration: {agentResponse ? `${Math.ceil(agentResponse.length / 15)}s` : '0s'}
              </span>
            </div>
          </div>
        </div>

        {/* Voice Control Button */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleVoiceCommand}
            disabled={isProcessing}
            size="lg"
            className={`px-8 py-4 ${
              isListening || isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
            data-testid="button-voice-command"
          >
            <i className={`fas ${
              isListening || isRecording ? 'fa-stop' : 'fa-microphone'
            } mr-2`}></i>
            {isProcessing 
              ? 'Processing...'
              : isListening || isRecording 
                ? 'Stop Recording' 
                : 'Voice Command'
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
