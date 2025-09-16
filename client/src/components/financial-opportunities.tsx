import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Opportunity } from '@shared/schema';

interface FinancialOpportunitiesProps {
  sessionId: string;
}

const getCategoryStyles = (category: string) => {
  switch (category) {
    case 'safe':
      return {
        containerClass: 'bg-green-500/10 border border-green-500/20',
        indicatorClass: 'bg-green-500',
        badgeClass: 'bg-green-500/20 text-green-300',
        labelClass: 'text-green-400'
      };
    case 'balanced':
      return {
        containerClass: 'bg-yellow-500/10 border border-yellow-500/20',
        indicatorClass: 'bg-yellow-500',
        badgeClass: 'bg-yellow-500/20 text-yellow-300',
        labelClass: 'text-yellow-400'
      };
    case 'aggressive':
      return {
        containerClass: 'bg-red-500/10 border border-red-500/20',
        indicatorClass: 'bg-red-500',
        badgeClass: 'bg-red-500/20 text-red-300',
        labelClass: 'text-red-400'
      };
    default:
      return {
        containerClass: 'bg-muted',
        indicatorClass: 'bg-muted-foreground',
        badgeClass: 'bg-muted text-muted-foreground',
        labelClass: 'text-muted-foreground'
      };
  }
};

export function FinancialOpportunities({ sessionId }: FinancialOpportunitiesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch opportunities
  const { data: opportunities = [], isLoading, refetch } = useQuery({
    queryKey: ['api', 'opportunities'],
  });

  // Execute opportunity mutation
  const executeOpportunityMutation = useMutation({
    mutationFn: async (opportunityId: string) => {
      const response = await apiRequest('POST', `/api/sessions/${sessionId}/opportunities/${opportunityId}/execute`);
      return response.json();
    },
    onSuccess: (data, opportunityId) => {
      const opportunity = opportunities.find((opp: Opportunity) => opp.id === opportunityId);
      toast({
        title: "Opportunity Executed",
        description: `${opportunity?.title} has been initiated successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['api', 'sessions', sessionId, 'actions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Execution Error",
        description: "Failed to execute opportunity: " + error.message,
        variant: "destructive"
      });
    }
  });

  const handleExecuteOpportunity = (opportunityId: string) => {
    executeOpportunityMutation.mutate(opportunityId);
  };

  const handleRefreshOpportunities = () => {
    refetch();
    toast({
      title: "Opportunities Refreshed",
      description: "Financial opportunities have been updated.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-foreground">Opportunities</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshOpportunities}
            disabled={isLoading}
            data-testid="button-refresh-opportunities"
          >
            <i className="fas fa-refresh mr-1"></i>Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {opportunities.map((opportunity: Opportunity) => {
            const styles = getCategoryStyles(opportunity.category);
            
            return (
              <div
                key={opportunity.id}
                className={`p-4 rounded-lg roi-indicator ${styles.containerClass}`}
                data-testid={`opportunity-${opportunity.id}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${styles.indicatorClass}`}></div>
                    <span className={`text-sm font-semibold uppercase ${styles.labelClass}`}>
                      {opportunity.category === 'safe' ? 'SAFE/STEADY' : opportunity.category.toUpperCase()}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${styles.badgeClass}`}>
                    {opportunity.roiRange}
                  </span>
                </div>
                
                <h4 className="font-medium text-foreground mb-1" data-testid={`opportunity-title-${opportunity.id}`}>
                  {opportunity.title}
                </h4>
                
                <p className="text-sm text-muted-foreground mb-3" data-testid={`opportunity-description-${opportunity.id}`}>
                  {opportunity.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span data-testid={`opportunity-time-${opportunity.id}`}>
                      ⏱️ {opportunity.timeEstimate}
                    </span>
                    <span data-testid={`opportunity-risk-${opportunity.id}`}>
                      📊 {opportunity.riskLevel}
                    </span>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExecuteOpportunity(opportunity.id)}
                    disabled={executeOpportunityMutation.isPending}
                    className="text-primary hover:text-primary/80 font-medium"
                    data-testid={`button-execute-${opportunity.id}`}
                  >
                    Execute
                  </Button>
                </div>
                
                {/* Required Scopes */}
                {opportunity.requiredScopes && opportunity.requiredScopes.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">Required scopes:</span>
                      <div className="flex flex-wrap gap-1">
                        {opportunity.requiredScopes.map((scope) => (
                          <span
                            key={scope}
                            className="text-xs bg-background/50 text-muted-foreground px-2 py-0.5 rounded"
                            data-testid={`opportunity-scope-${opportunity.id}-${scope}`}
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty State */}
          {opportunities.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <i className="fas fa-dollar-sign text-4xl text-muted-foreground mb-4"></i>
              <p className="text-muted-foreground">
                No opportunities available at the moment.
                <br />
                Check back later or refresh to see new opportunities.
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading opportunities...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
