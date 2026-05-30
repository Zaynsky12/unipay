import { useState, useEffect, useCallback } from 'react';
import { goldskyClient, GET_MERCHANT_HISTORY } from '../goldsky';

export function useMerchantHistory(merchantId: string | undefined) {
  const [history, setHistory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!merchantId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data: any = await goldskyClient.request(GET_MERCHANT_HISTORY, {
        merchantId: merchantId.toLowerCase()
      });
      if (data.merchant) {
        data.merchant.subscriptionPayments = data.subscriptionPayments || [];
        setHistory(data.merchant);
      } else {
        setHistory(null);
      }
    } catch (err: any) {
      console.error('Goldsky fetch merchant history failed:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, isLoading, error, refetch: fetchHistory };
}
