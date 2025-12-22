import { useEffect, useRef, useState, useCallback } from "react";

/**
 * useRealtimeList
 *
 * @param {Object} config
 * @param {Function} config.fetcher      () => Promise<array | {results,next}>
 * @param {Function} config.wsURL        () => string
 * @param {Function} config.onWSMessage  (msg, scheduleRefetch) => void
 * @param {string}   config.keyField     unique key field (default "id")
 * @param {number}   config.debounceMs   debounce refetch
 */
export function useRealtimeList({
  fetcher,
  wsURL,
  onWSMessage,
  keyField = "id",
  debounceMs = 200,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextPage, setNextPage] = useState(null);

  const wsRef = useRef(null);
  const reconnectRef = useRef(0);
  const debounceRef = useRef(null);
  const needRefetch = useRef(false);

  const mergeUnique = useCallback((prev, incoming) => {
    const map = new Map(prev.map(i => [i[keyField], i]));
    incoming.forEach(i => map.set(i[keyField], i));
    return Array.from(map.values());
  }, [keyField]);

  const fetchData = useCallback(async (url = null) => {
    try {
      setLoading(true);
      const res = await fetcher(url);

      const data = Array.isArray(res)
        ? res
        : res?.results || [];

      setItems(prev => mergeUnique(prev, data));
      setNextPage(res?.next ?? null);
    } finally {
      setLoading(false);
    }
  }, [fetcher, mergeUnique]);

  const scheduleRefetch = useCallback(() => {
    needRefetch.current = true;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (needRefetch.current) {
        needRefetch.current = false;
        fetchData();
      }
    }, debounceMs);
  }, [fetchData, debounceMs]);

  // WS connect
  const connectWS = useCallback(() => {
    try {
      const ws = new WebSocket(wsURL());
      wsRef.current = ws;

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          onWSMessage?.(msg, scheduleRefetch);
        } catch {}
      };

      ws.onclose = () => {
        const n = reconnectRef.current++;
        const delay = Math.min(1000 * 2 ** n, 15000);
        setTimeout(connectWS, delay);
      };
    } catch {
      setTimeout(connectWS, 2000);
    }
  }, [wsURL, onWSMessage, scheduleRefetch]);

  useEffect(() => {
    fetchData();
    connectWS();

    return () => {
      wsRef.current?.close();
      clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    items,
    loading,
    nextPage,
    loadMore: () => nextPage && fetchData(nextPage),
    setItems,
  };
}
