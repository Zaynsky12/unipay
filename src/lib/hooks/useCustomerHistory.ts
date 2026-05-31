import { useState, useEffect, useCallback } from 'react';
import { goldskyClient, GET_CUSTOMER_HISTORY } from '../goldsky';

export function useCustomerHistory(customerId: string | undefined) {
  const [history, setHistory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!customerId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data: any = await goldskyClient.request(GET_CUSTOMER_HISTORY, {
        customerId: customerId.toLowerCase()
      });
      
      setHistory({
        transactions: data.transactions || [],
        subscriptionPayments: data.subscriptionPayments || []
      });
      
    } catch (err: any) {
      console.error('Goldsky fetch customer history failed:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, isLoading, error, refetch: fetchHistory };
}
