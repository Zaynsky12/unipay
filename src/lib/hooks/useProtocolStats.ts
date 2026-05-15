import { useState, useEffect } from 'react';
import { goldskyClient, GET_PROTOCOL_STATS } from '../goldsky';

export function useProtocolStats() {
  const [stats, setStats] = useState({ totalMerchants: 0, totalVolume: 0, totalTransactions: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const data: any = await goldskyClient.request(GET_PROTOCOL_STATS);
        if (data && data.protocol) {
          const volumeParsed = Number(data.protocol.totalVolume) / 1000000;
          setStats({
            totalMerchants: Number(data.protocol.totalMerchants),
            totalVolume: volumeParsed,
            totalTransactions: Number(data.protocol.totalTransactions)
          });
        }
      } catch (err: any) {
        console.error('Failed to fetch protocol stats:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  return { stats, isLoading, error };
}
