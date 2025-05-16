// utils/network.ts
import NetInfo from '@react-native-community/netinfo';

export const isOnline = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
};
