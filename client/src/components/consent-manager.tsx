import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { ConsentRequest, Session } from '@shared/schema';

interface ConsentManagerProps {
  session: Session | null;
}

export function ConsentManager({ session }: ConsentManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch consent requests
  const { data: consentRequests = [], isLoading } = useQuery({
    queryKey: ['api', 'sessions', session?.id, 'consent'],
    enabled: !!session?.id,
  });

  // Grant consent mutation
  const grantConsentMutation = useMutation({
    mutationFn: async ({ requestId, approved }: { requestId: string; approved: boolean }) => {
      const response = await apiRequest('POST', `/api/consent/${requestId}`, { approved });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api', 'sessions', session?.id, 'consent'] });
      queryClient.invalidateQueries({ queryKey: ['api', 'sessions', session?.id] });
      toast({
        title: "Consent Updated",
        description: "Consent request has been processed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update consent: " + error.message,
        variant: "destructive"
      });
    }
  });

  // Revoke scope mutation
  const revokeScopeMutation = useMutation({
    mutationFn: async (scope: string) => {
      const response = await apiRequest('DELETE', `/api/sessions/${session?.id}/consent/${scope}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api', 'sessions', session?.id] });
      toast({
        title: "Scope Revoked",
        description: "The consent scope has been revoked successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to revoke scope: " + error.message,
        variant: "destructive"
      });
    }
  });

  const handleApproveScope = (requestId: string) => {
    grantConsentMutation.mutate({ requestId, approved: true });
  };

  const handleDenyScope = (requestId: string) => {
    grantConsentMutation.mutate({ requestId, approved: false });
  };

  const handleRevokeScope = (scope: string) => {
    revokeScopeMutation.mutate(scope);
  };

  const pendingRequests = consentRequests.filter((req: ConsentRequest) => req.status === 'pending');
  const grantedScopes = session?.grantedScopes || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-foreground">Consent Scopes</CardTitle>
          <span className="text-sm bg-muted text-muted-foreground px-3 py-1 rounded-full">
            <span data-testid="granted-scopes-count">{grantedScopes.length}</span> Active
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Granted Scopes */}
          {grantedScopes.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Active Scopes</h4>
              {grantedScopes.map((scope) => (
                <div key={scope} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-foreground" data-testid={`scope-${scope}`}>
                      {scope}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevokeScope(scope)}
                    disabled={revokeScopeMutation.isPending}
                    className="text-destructive hover:text-destructive/80"
                    data-testid={`button-revoke-${scope}`}
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Pending Requests</h4>
              {pendingRequests.map((request: ConsentRequest) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium text-foreground" data-testid={`pending-scope-${request.scope}`}>
                      {request.scope}
                    </span>
                    <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                      Pending
                    </span>
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleApproveScope(request.id)}
                      disabled={grantConsentMutation.isPending}
                      className="text-green-400 hover:text-green-300"
                      data-testid={`button-grant-${request.scope}`}
                    >
                      Grant
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDenyScope(request.id)}
                      disabled={grantConsentMutation.isPending}
                      className="text-destructive hover:text-destructive/80"
                      data-testid={`button-deny-${request.scope}`}
                    >
                      Deny
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {grantedScopes.length === 0 && pendingRequests.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <i className="fas fa-shield-alt text-4xl text-muted-foreground mb-4"></i>
              <p className="text-muted-foreground">
                No consent scopes are currently active.
                <br />
                Scopes will appear here when requested by the agent.
              </p>
            </div>
          )}

          {/* Manage All Button */}
          {(grantedScopes.length > 0 || pendingRequests.length > 0) && (
            <Button
              variant="outline"
              className="w-full mt-4"
              data-testid="button-manage-all-scopes"
            >
              Manage All Scopes
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
