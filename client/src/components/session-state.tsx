import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Session } from '@shared/schema';

interface SessionStateProps {
  session: Session | null;
  onSessionEnd?: () => void;
}

export function SessionState({ session, onSessionEnd }: SessionStateProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch session statistics
  const { data: stats } = useQuery({
    queryKey: ['api', 'sessions', session?.id, 'stats'],
    enabled: !!session?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // End session mutation
  const endSessionMutation = useMutation({
    mutationFn: async () => {
      if (!session?.id) throw new Error('No active session');
      const response = await apiRequest('POST', `/api/sessions/${session.id}/end`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api', 'sessions'] });
      toast({
        title: "Session Ended",
        description: "Your session has been terminated successfully.",
      });
      onSessionEnd?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to end session: " + error.message,
        variant: "destructive"
      });
    }
  });

  const handleEndSession = () => {
    endSessionMutation.mutate();
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return 'N/A';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const isToday = dateObj.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Today at ${formatTime(dateObj)}`;
    }
    
    return dateObj.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeAgo = (date: Date | string | null) => {
    if (!date) return 'N/A';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">Session State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <i className="fas fa-exclamation-triangle text-4xl text-muted-foreground mb-4"></i>
            <p className="text-muted-foreground">No active session found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">Session State</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {/* Granted Scopes */}
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2" data-testid="stat-granted-scopes">
              {stats?.grantedScopes ?? session.grantedScopes?.length ?? 0}
            </div>
            <p className="text-sm text-muted-foreground">Granted Scopes</p>
          </div>

          {/* App Inventory */}
          <div className="text-center">
            <div className="text-2xl font-bold text-accent mb-2" data-testid="stat-app-inventory">
              {stats?.appInventory ?? session.appInventory?.length ?? 0}
            </div>
            <p className="text-sm text-muted-foreground">Apps Connected</p>
          </div>

          {/* Executed Tasks */}
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400 mb-2" data-testid="stat-executed-tasks">
              {stats?.executedTasks ?? session.executedTasks?.length ?? 0}
            </div>
            <p className="text-sm text-muted-foreground">Tasks Executed</p>
          </div>

          {/* Session Revenue */}
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400 mb-2" data-testid="stat-session-revenue">
              ${stats?.revenue ?? session.sessionRevenue ?? '0'}
            </div>
            <p className="text-sm text-muted-foreground">Session Revenue</p>
          </div>
        </div>

        <div className="pt-6 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Session Started</p>
              <p className="font-medium text-foreground" data-testid="session-start-time">
                {formatDate(stats?.startTime ?? session.startTime)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Action</p>
              <p className="font-medium text-foreground" data-testid="last-action-time">
                {getTimeAgo(stats?.lastAction ?? session.lastActionTime)}
              </p>
            </div>
            <Button
              onClick={handleEndSession}
              disabled={endSessionMutation.isPending || !session.isActive}
              variant="destructive"
              data-testid="button-end-session"
            >
              {endSessionMutation.isPending ? 'Ending...' : 'End Session'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
