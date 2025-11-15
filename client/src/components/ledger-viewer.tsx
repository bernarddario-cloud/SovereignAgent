import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LedgerViewerProps {
  userId: string;
}

export function LedgerViewer({ userId }: LedgerViewerProps) {
  const { data: ledgerEntries, isLoading } = useQuery({
    queryKey: ['api', 'ledger', userId],
    queryFn: async () => {
      const response = await fetch(`/api/ledger?userId=${userId}&limit=5`);
      if (!response.ok) throw new Error('Failed to fetch ledger');
      return response.json();
    },
    enabled: !!userId
  });

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/ledger/export?userId=${userId}&format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ledger.${format}`;
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'sent':
        return 'bg-blue-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'api':
        return '🔌';
      case 'shortcut':
        return '📱';
      case 'manual':
        return '👤';
      default:
        return '•';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>Loading recent activity...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Audit Trail</CardTitle>
            <CardDescription>Immutable record of all actions (last 5)</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('json')}
              data-testid="button-export-json"
            >
              <Download className="h-4 w-4 mr-1" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              data-testid="button-export-csv"
            >
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {ledgerEntries && ledgerEntries.length > 0 ? (
            <div className="space-y-3">
              {ledgerEntries.map((entry: any) => (
                <div
                  key={entry.id}
                  className="border rounded-lg p-3 bg-card hover:bg-accent transition-colors"
                  data-testid={`ledger-entry-${entry.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getChannelIcon(entry.channel)}</span>
                        <span className="font-medium text-sm">{entry.action}</span>
                        <Badge className={getStatusColor(entry.status)} data-testid={`status-${entry.status}`}>
                          {entry.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        Hash: {entry.hash.substring(0, 16)}...
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No audit trail entries yet</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
