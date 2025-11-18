import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from '../services/UserService';
import { me } from '../services/v2/AuthService';

// user query
export function useGetUser() {
    // run the query
    return useQuery({
        queryKey: ['current-user'],
        // queryFn: () => getCurrentUser(), // Old version
        queryFn: () => me(),
        enabled: false,
        staleTime: Infinity,
        cacheTime: Infinity
    });
};