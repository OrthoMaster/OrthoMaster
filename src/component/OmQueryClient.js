import { QueryClient } from "react-query"


export const OmQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retryDelay: 3000,
        retry: 3
      },
    },
  })