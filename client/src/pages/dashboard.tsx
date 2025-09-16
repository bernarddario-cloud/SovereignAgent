import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/use-websocket';

// Components
import { Sidebar } from '@/components/sidebar';
import { VoiceInterface } from '@/components/voice-interface';
import { ConsentManager } from '@/components/consent-manager';
import { FinancialOpportunities } from '@/components/financial-opportunities';
import { ActionEngine } from '@/components/action-engine';
import { SessionState } from '@/components/session-state';

import type { Session } from '@shared/schema';

export default function Dashboard() {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize session
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['api', 'sessions'],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/sessions');
      return response.json();
    }
  });

  // WebSocket connection
  const { isConnected, lastMessage } = useWebSocket(session?.id || null);

  // Emergency stop mutation
  const emergencyStopMutation = useMutation({
    mutationFn: async () => {
      if (!session?.id) throw new Error('No active session');
      const response = await apiRequest('POST', `/api/sessions/${session.id}/end`);
      return response.json();
    },
    onSuccess: () => {
      setIsVoiceActive(false);
      toast({
        title: "Emergency Stop Activated",
        description: "All agent activities have been halted.",
        variant: "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ['api', 'sessions'] });
    }
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'voice_processed':
          toast({
            title: "Voice Command Processed",
            description: "Your voice command has been processed successfully.",
          });
          break;
        case 'consent_updated':
          queryClient.invalidateQueries({ queryKey: ['api', 'sessions', session?.id, 'consent'] });
          queryClient.invalidateQueries({ queryKey: ['api', 'sessions', session?.id] });
          break;
        case 'opportunity_executed':
          toast({
            title: "Opportunity Executed",
            description: "The financial opportunity has been initiated.",
          });
          break;
        case 'action_executed':
          queryClient.invalidateQueries({ queryKey: ['api', 'sessions', session?.id, 'actions'] });
          break;
        case 'session_ended':
          toast({
            title: "Session Ended",
            description: "The session has been terminated.",
            variant: "destructive"
          });
          queryClient.invalidateQueries({ queryKey: ['api', 'sessions'] });
          break;
      }
    }
  }, [lastMessage, queryClient, session?.id, toast]);

  const handleToggleVoice = () => {
    setIsVoiceActive(!isVoiceActive);
  };

  const handleEmergencyStop = () => {
    emergencyStopMutation.mutate();
  };

  const handleVoiceResponse = (data: any) => {
    // Voice response handled, can add additional logic here
    console.log('Voice response received:', data);
  };

  const handleSessionEnd = () => {
    setIsVoiceActive(false);
    // Session ended, can add cleanup logic here
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing Sovereign Phone Agent...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar session={session} isConnected={isConnected} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-card border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Command Center</h2>
              <p className="text-muted-foreground">Voice-enabled private money engine</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Voice Control Button */}
              <Button
                onClick={handleToggleVoice}
                className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
                  isVoiceActive
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
                data-testid="button-voice-toggle"
              >
                <i className={`fas ${isVoiceActive ? 'fa-stop' : 'fa-microphone'}`}></i>
                <span>{isVoiceActive ? 'Stop Voice' : 'Voice Command'}</span>
              </Button>

              {/* Emergency Stop */}
              <Button
                onClick={handleEmergencyStop}
                disabled={emergencyStopMutation.isPending}
                variant="destructive"
                className="flex items-center space-x-2 px-4 py-3 font-medium"
                data-testid="button-emergency-stop"
              >
                <i className="fas fa-stop"></i>
                <span className="sr-only">Emergency Stop</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Voice Interface Card */}
          {session && (
            <VoiceInterface
              sessionId={session.id}
              onResponse={handleVoiceResponse}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Consent Manager */}
            <ConsentManager session={session} />

            {/* Financial Opportunities */}
            {session && (
              <FinancialOpportunities sessionId={session.id} />
            )}
          </div>

          {/* Action Execution Engine */}
          {session && (
            <ActionEngine sessionId={session.id} />
          )}

          {/* Session State Management */}
          <SessionState
            session={session}
            onSessionEnd={handleSessionEnd}
          />
        </div>
      </div>
    </div>
  );
}
