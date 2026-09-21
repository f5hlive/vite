export const realtimePublicConfig = {
  key: import.meta.env.VITE_PUSHER_KEY || 'SUA_API_KEY',
  cluster: import.meta.env.VITE_PUSHER_CLUSTER || 'SEU_CLUSTER',
};

export function getRealtimeClientOptions() {
  return {
    cluster: realtimePublicConfig.cluster,
    enabledTransports: ['ws','wss'],
    authEndpoint: '/api/realtime/auth',
  };
}
