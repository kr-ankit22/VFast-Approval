import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  isFormData: boolean = false, // New parameter
): Promise<Response> {
  const headers: HeadersInit = {};
  let body: BodyInit | undefined;

  const token = localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (data) {
    if (isFormData) {
      body = data as FormData; // Cast to FormData
      // Do NOT set Content-Type header for FormData, browser handles it
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(data);
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem("token");
    console.log("queryClient.ts: Token from localStorage for query:", queryKey[0], token);
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      console.log("queryClient.ts: Authorization header for query:", queryKey[0], headers["Authorization"]);
    }

    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    console.log("queryClient.ts: Response status for query:", queryKey[0], res.status);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.warn("queryClient.ts: Unauthorized (401) for query:", queryKey[0], ". Returning null.");
      return null;
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    console.log("queryClient.ts: Data received for query:", queryKey[0], data);
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
