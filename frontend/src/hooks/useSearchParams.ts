import { useState, useCallback, useEffect } from "react";

interface SearchParamsState {
  search: string;
  severities: number[];
  appnames: string[];
}

function readParams(): SearchParamsState {
  const params = new URLSearchParams(window.location.search);

  const search = params.get("search") || "";

  const severityParam = params.get("severity");
  const severities = severityParam
    ? severityParam.split(",").map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
    : [];

  const appnameParam = params.get("appname");
  const appnames = appnameParam
    ? appnameParam.split(",").map(s => s.trim()).filter(s => s.length > 0)
    : [];

  return { search, severities, appnames };
}

function writeParams(state: SearchParamsState) {
  const params = new URLSearchParams();

  if (state.search) params.set("search", state.search);
  if (state.severities.length > 0) params.set("severity", state.severities.join(","));
  if (state.appnames.length > 0) params.set("appname", state.appnames.join(","));

  const qs = params.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}

export function useSearchParams() {
  const [state, setState] = useState<SearchParamsState>(readParams);

  const setSearch = useCallback((search: string) => {
    setState(prev => {
      const next = { ...prev, search };
      writeParams(next);
      return next;
    });
  }, []);

  const setSeverities = useCallback((severities: number[]) => {
    setState(prev => {
      const next = { ...prev, severities };
      writeParams(next);
      return next;
    });
  }, []);

  const setAppnames = useCallback((appnames: string[]) => {
    setState(prev => {
      const next = { ...prev, appnames };
      writeParams(next);
      return next;
    });
  }, []);

  // Sync on popstate (browser back/forward)
  useEffect(() => {
    function handlePopState() {
      setState(readParams());
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return {
    search: state.search,
    severities: state.severities,
    appnames: state.appnames,
    setSearch,
    setSeverities,
    setAppnames,
  };
}
