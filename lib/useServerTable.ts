"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PageResponse, PageParams } from "./api";
import { SortState } from "@/components/SortHeader";

export type ServerTableState<T = any> = {
  rows: T[];
  total: number;
  page: number;
  loading: boolean;
  firstLoad: boolean;
  keyword: string;
  sort: SortState | null;
  setPage: (p: number) => void;
  setSort: (s: SortState) => void;
  setKeyword: (k: string) => void;
  reload: () => void;
};

/**
 * Hook for server-side paginated, sorted, searchable tables.
 *
 * @param fetcher  Function that takes PageParams and returns PageResponse
 * @param deps     Extra dependencies that trigger a reload (e.g., yearMonth, filter)
 * @param options  { pageSize, defaultSort }
 */
export function useServerTable<T = any>(
  fetcher: (params: PageParams) => Promise<PageResponse<T>>,
  deps: any[] = [],
  options?: { pageSize?: number; defaultSort?: SortState },
): ServerTableState<T> {
  const pageSize = options?.pageSize ?? 20;
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<SortState | null>(options?.defaultSort ?? null);
  const [keyword, setKeywordRaw] = useState("");
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const seqRef = useRef(0);

  const load = useCallback(async () => {
    const seq = ++seqRef.current;
    setLoading(true);
    try {
      const params: PageParams = {
        page,
        size: pageSize,
        keyword: keyword || undefined,
        sortBy: sort?.key,
        sortDir: sort?.dir,
      };
      const res = await fetcher(params);
      if (seq !== seqRef.current) return; // stale
      setRows(res.content);
      setTotal(res.totalElements);
    } catch {
      if (seq !== seqRef.current) return;
      setRows([]);
      setTotal(0);
    } finally {
      if (seq === seqRef.current) {
        setLoading(false);
        setFirstLoad(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort?.key, sort?.dir, keyword, pageSize, ...deps]);

  useEffect(() => { load(); }, [load]);

  // Reset page when sort/keyword/deps change
  const setKeyword = useCallback((k: string) => {
    setKeywordRaw(k);
    setPage(0);
  }, []);

  const setSortAndReset = useCallback((s: SortState) => {
    setSort(s);
    setPage(0);
  }, []);

  return {
    rows, total, page, loading, firstLoad,
    keyword, sort,
    setPage, setSort: setSortAndReset, setKeyword,
    reload: load,
  };
}
