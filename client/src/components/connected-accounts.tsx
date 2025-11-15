import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConnectedAccountsProps {
  userId: string;
}

export function ConnectedAccounts({ userId }: ConnectedAccountsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['api', 'auth', 'accounts', userId],
    queryFn: async () => {
      const response = await fetch(`/api/auth/accounts?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch accounts');
      return response.json();
    },
    enabled: !!userId
  });

  const revokeTokenMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await fetch(`/api/auth/accounts/${provider}?userId=${userId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to revoke token');
      return response.json();
    },
    onSuccess: (data, provider) => {
      toast({
        title: 'Token Revoked',
        description: `Successfully disconnected ${provider}`,
      });
      queryClient.invalidateQueries({ queryKey: ['api', 'auth', 'accounts', userId] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to revoke token',
        variant: 'destructive'
      });
    }
  });

  const getStatusIcon = (expiresAt?: Date) => {
    if (!expiresAt) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    
    const now = new Date();
    const expires = new Date(expiresAt);
    
    if (expires < now) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    } else if (expires.getTime() - now.getTime() < 86400000) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = (expiresAt?: Date) => {
    if (!expiresAt) return 'Active';
    
    const now = new Date();
    const expires = new Date(expiresAt);
    
    if (expires < now) return 'Expired';
    if (expires.getTime() - now.getTime() < 86400000) return 'Expiring Soon';
    return 'Active';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>Loading OAuth connections...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Accounts</CardTitle>
        <CardDescription>Manage your OAuth integrations and API tokens</CardDescription>
      </CardHeader>
      <CardContent>
        {accounts && accounts.length > 0 ? (
          <div className="space-y-3">
            {accounts.map((account: any) => (
              <div
                key={account.provider}
                className="flex items-center justify-between p-3 border rounded-lg bg-card"
                data-testid={`account-${account.provider}`}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(account.expiresAt)}
                  <div>
                    <p className="font-medium text-sm capitalize">{account.provider}</p>
                    <p className="text-xs text-muted-foreground">
                      {getStatusText(account.expiresAt)}
                      {account.expiresAt && (
                        <> • Expires {new Date(account.expiresAt).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revokeTokenMutation.mutate(account.provider)}
                  disabled={revokeTokenMutation.isPending}
                  data-testid={`button-revoke-${account.provider}`}
                >
                  Disconnect
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2">No accounts connected</p>
            <p className="text-xs">Connect services to enable automated workflows</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
