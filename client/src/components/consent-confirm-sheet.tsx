import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, CheckCircle2, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ConsentConfirmSheetProps {
  consentRequest: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ConsentConfirmSheet({ consentRequest, isOpen, onClose }: ConsentConfirmSheetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const executeActionMutation = useMutation({
    mutationFn: async (confirm: boolean) => {
      const response = await apiRequest('POST', '/api/agent/execute', {
        consentRequestId: consentRequest.id,
        confirm
      });
      return response.json();
    },
    onSuccess: (data, confirm) => {
      toast({
        title: confirm ? 'Action Executed' : 'Action Denied',
        description: confirm 
          ? 'The operation has been completed successfully' 
          : 'The operation was cancelled',
        variant: confirm ? 'default' : 'destructive'
      });
      queryClient.invalidateQueries({ queryKey: ['api', 'ledger'] });
      queryClient.invalidateQueries({ queryKey: ['api', 'sessions'] });
      onClose();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to process action',
        variant: 'destructive'
      });
      setIsProcessing(false);
    }
  });

  const handleConfirm = () => {
    setIsProcessing(true);
    executeActionMutation.mutate(true);
  };

  const handleDeny = () => {
    setIsProcessing(true);
    executeActionMutation.mutate(false);
  };

  if (!consentRequest) return null;

  const getRiskColor = (level?: string) => {
    switch (level) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <SheetTitle>Consent Required</SheetTitle>
          </div>
          <SheetDescription>
            Review this operation before granting permission
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-4">
          {/* Action Details */}
          <div>
            <p className="text-sm font-medium mb-2">Action</p>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-mono text-sm">{consentRequest.action}</p>
            </div>
          </div>

          {/* Scope */}
          <div>
            <p className="text-sm font-medium mb-2">Required Scope</p>
            <Badge variant="outline" data-testid="badge-scope">
              {consentRequest.scope}
            </Badge>
          </div>

          {/* Dry Run Result */}
          {consentRequest.dryRunResult && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <p className="text-sm font-medium">Dry Run Preview</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Impact:</span>
                    <span>{consentRequest.dryRunResult.estimatedImpact}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reversible:</span>
                    <span>
                      {consentRequest.dryRunResult.reversible ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Level:</span>
                    <span className={getRiskColor(consentRequest.dryRunResult.riskLevel)}>
                      {consentRequest.dryRunResult.riskLevel}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Parameters */}
          {consentRequest.parameters && Object.keys(consentRequest.parameters).length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Parameters</p>
                <div className="p-3 bg-muted rounded-lg">
                  <pre className="text-xs font-mono overflow-auto max-h-32">
                    {JSON.stringify(consentRequest.parameters, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}

          {/* Warning */}
          {consentRequest.dryRunResult?.riskLevel !== 'low' && (
            <div className="flex gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
              <div className="text-xs">
                <p className="font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                  Proceed with caution
                </p>
                <p className="text-yellow-600 dark:text-yellow-500">
                  This operation may have significant impact. Review carefully before confirming.
                </p>
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleDeny}
            disabled={isProcessing}
            data-testid="button-deny-consent"
          >
            Deny
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            data-testid="button-confirm-consent"
          >
            Confirm & Execute
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
