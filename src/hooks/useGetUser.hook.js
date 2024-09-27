import { useQuery } from 'react-query';
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
        cacheTime: Infinity,
        onSuccess: data=>{
            AsyncStorage.setItem('user', JSON.stringify(data))
        }
    });
};