import { createHash, createHmac } from 'node:crypto';

const realtimeServerConfig = {
  appId: process.env.PUSHER_APP_ID || 'SEU_APP_ID',
  key: process.env.VITE_PUSHER_KEY || 'SUA_API_KEY',
  secret: process.env.PUSHER_SECRET || 'SUA_SECRET_KEY',
  host: process.env.PUSHER_HOST || 'api-custom.f5hlive.com.br',
  scheme: (process.env.PUSHER_SCHEME || (process.env.NODE_ENV === 'production' ? 'https' : 'http')).toLowerCase(),
  port: Number(process.env.PUSHER_PORT || ((process.env.PUSHER_SCHEME || (process.env.NODE_ENV === 'production' ? 'https' : 'http')).toLowerCase() === 'https' ? 443 : 80)),
};

function buildBaseUrl() {
  const defaultPort = realtimeServerConfig.scheme === 'https' ? 443 : 80;
  const portSegment = realtimeServerConfig.port === defaultPort ? '' : `:${realtimeServerConfig.port}`;
  return `${realtimeServerConfig.scheme}://${realtimeServerConfig.host}${portSegment}`;
}

function buildSortedQuery(params: Record<string, string>) {
  return Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

export function buildPrivateChannelAuth(socketId: string, channelName: string) {
  const signature = createHmac('sha256', realtimeServerConfig.secret)
    .update(`${socketId}:${channelName}`)
    .digest('hex');

  return `${realtimeServerConfig.key}:${signature}`;
}

export function buildPresenceChannelAuth(socketId: string, channelName: string, presenceData: { user_id: string, user_info: any }) {
  const presenceDataJson = JSON.stringify(presenceData);
  const signature = createHmac('sha256', realtimeServerConfig.secret)
    .update(`${socketId}:${channelName}:${presenceDataJson}`)
    .digest('hex');

  return {
    auth: `${realtimeServerConfig.key}:${signature}`,
    channel_data: presenceDataJson
  };
}

export async function triggerRealtimeEvent(options: {
  channels: string[];
  name: string;
  data: Record<string, unknown>;
  socketId?: string;
}) {
  const path = `/apps/${realtimeServerConfig.appId}/events`;
  const payload = {
    name: options.name,
    channels: options.channels,
    data: JSON.stringify(options.data),
    ...(options.socketId ? { socket_id: options.socketId } : {}),
  };
  const body = JSON.stringify(payload);
  const params = {
    auth_key: realtimeServerConfig.key,
    auth_timestamp: String(Math.floor(Date.now() / 1000)),
    auth_version: '1.0',
    body_md5: createHash('md5').update(body).digest('hex'),
  };
  const query = buildSortedQuery(params);
  const signature = createHmac('sha256', realtimeServerConfig.secret)
    .update(`POST\n${path}\n${query}`)
    .digest('hex');
  const response = await fetch(`${buildBaseUrl()}${path}?${query}&auth_signature=${signature}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Realtime server rejected event: ${response.status} ${errorBody}`);
  }
}
