import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Action } from '@shared/schema';

interface ActionEngineProps {
  sessionId: string;
}

interface ToolStatus {
  tool: string;
  icon: string;
  status: 'active' | 'ready' | 'disabled';
  statusColor: string;
}

const availableTools: ToolStatus[] = [
  {
    tool: 'shortcuts.run',
    icon: 'fas fa-mobile-alt',
    status: 'active',
    statusColor: 'bg-green-500/20 text-green-400'
  },
  {
    tool: 'tasker.intent',
    icon: 'fas fa-android',
    status: 'ready',
    statusColor: 'bg-yellow-500/20 text-yellow-400'
  },
  {
    tool: 'webhook.reply',
    icon: 'fas fa-webhook',
    status: 'active',
    statusColor: 'bg-green-500/20 text-green-400'
  }
];

export function ActionEngine({ sessionId }: ActionEngineProps) {
  const [jsonAction, setJsonAction] = useState(`{
  "actions": [
    {
      "tool": "shortcuts.run",
      "args": {
        "shortcut_name": "FinanceCheck",
        "input": "daily_summary"
      }
    }
  ]
}`);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch recent actions
  const { data: actions = [], isLoading } = useQuery({
    queryKey: ['api', 'sessions', sessionId, 'actions'],
    enabled: !!sessionId,
  });

  // Execute action mutation
  const executeActionMutation = useMutation({
    mutationFn: async (actionData: any) => {
      const response = await apiRequest('POST', `/api/sessions/${sessionId}/actions`, actionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api', 'sessions', sessionId, 'actions'] });
      toast({
        title: "Action Executed",
        description: "The action has been executed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Execution Error",
        description: "Failed to execute action: " + error.message,
        variant: "destructive"
      });
    }
  });

  const handleExecuteAction = () => {
    try {
      const parsedAction = JSON.parse(jsonAction);
      
      if (!parsedAction.actions || !Array.isArray(parsedAction.actions)) {
        throw new Error('Invalid action format: "actions" array is required');
      }

      if (parsedAction.actions.length === 0) {
        throw new Error('At least one action is required');
      }

      const action = parsedAction.actions[0]; // Execute first action
      executeActionMutation.mutate(action);
      
    } catch (error) {
      toast({
        title: "JSON Error",
        description: "Invalid JSON format: " + error.message,
        variant: "destructive"
      });
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-foreground">Action Engine</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-blue-400">Ready</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Available Tools */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Available Tools</h4>
            <div className="space-y-2">
              {availableTools.map((tool) => (
                <div key={tool.tool} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-2">
                    <i className={`${tool.icon} text-primary`}></i>
                    <span className="text-sm text-foreground" data-testid={`tool-${tool.tool}`}>
                      {tool.tool}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${tool.statusColor}`}>
                    {tool.status === 'active' ? 'Active' : tool.status === 'ready' ? 'Ready' : 'Disabled'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Actions */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Recent Actions</h4>
            <div className="space-y-2">
              {actions.slice(0, 3).map((action: Action) => (
                <div key={action.id} className="p-3 bg-muted rounded-lg text-sm" data-testid={`action-${action.id}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground">{action.tool}</span>
                    <span className={`text-xs ${getStatusColor(action.status)}`}>
                      {action.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-1">
                    {action.result?.message || 'Action executed'}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(action.executedAt)}
                  </span>
                </div>
              ))}
              
              {actions.length === 0 && !isLoading && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No recent actions
                </div>
              )}
            </div>
          </div>

          {/* JSON Action Builder */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Action Builder</h4>
            <Textarea
              value={jsonAction}
              onChange={(e) => setJsonAction(e.target.value)}
              className="font-mono text-sm min-h-[200px] bg-muted"
              placeholder="Enter JSON action..."
              data-testid="textarea-json-action"
            />
            <Button
              onClick={handleExecuteAction}
              disabled={executeActionMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              data-testid="button-execute-action"
            >
              {executeActionMutation.isPending ? 'Executing...' : 'Execute Action'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
