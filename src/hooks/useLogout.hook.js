import { useQueryClient, useMutation } from 'react-query';
import AuthService from '../services/AuthService';

// login mutation
export function useLogout() {
  // get the query client
  const queryClient = useQueryClient();
  // create the mutation
  return useMutation({
    mutationFn: () => {
      return AuthService.logout()
    },
    onSuccess: () => {
      queryClient.setQueryData(['current-user'], false); 
    },
  })
};