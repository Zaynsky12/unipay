import { useState, useEffect } from 'react';
import { goldskyClient, GET_MERCHANT_HISTORY } from '../goldsky';

export function useMerchantHistory(merchantId: string | undefined) {
  const [history, setHistory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      if (!merchantId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const data: any = await goldskyClient.request(GET_MERCHANT_HISTORY, {
          merchantId: merchantId.toLowerCase()
        });
        setHistory(data.merchant);
      } catch (err: any) {
        console.error('Goldsky fetch merchant history failed:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  }, [merchantId]);

  return { history, isLoading, error };
}
