import { useQueryClient, useMutation } from 'react-query';
import AuthService from '../services/AuthService';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';


// login mutation
export function useLogin() {
    // get the query client
    const queryClient = useQueryClient();
    // create the mutation
    return useMutation({
        mutationFn: (data) => {
            return AuthService.login({ email: data.email, password: data.password })
        },
        onSuccess: (data) => {
            SecureStore.setItemAsync('JWT', data.token.jwt_token)
            SecureStore.setItemAsync('refreshToken', data.token.refresh_token)
            AsyncStorage.setItem('user', JSON.stringify(data.user))
            queryClient.setQueryData(['current-user'], data.user);
        },
    })
};