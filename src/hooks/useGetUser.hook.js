import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from '../services/UserService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// user query
export function useGetUser() {
    // run the query
    return useQuery({
        queryKey: ['current-user'],
        queryFn: () => getCurrentUser(),
        //    staleTime: Infinity,
        //    cacheTime: Infinity,
        staleTime: Infinity,
        cacheTime: Infinity
    });
};