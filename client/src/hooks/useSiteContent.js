import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../services/apiClient";

function fetchPublicSiteContent() {
  return apiGet("/api/public/site-content");
}

export function useSiteContent() {
  return useQuery({
    queryKey: ["site-content"],
    queryFn: fetchPublicSiteContent,
    staleTime: 30_000,
  });
}
