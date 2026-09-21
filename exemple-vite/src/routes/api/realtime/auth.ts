import { createFileRoute } from "@tanstack/react-router";

/**
 * Endpoint de auth do SDK F5HLIVE (protocolo Pusher).
 *
 * Exemplo base de autenticação simples.
 * Neste endpoint você implementaria a validação de sessão e acesso ao banco.
 */
export const Route = createFileRoute("/api/realtime/auth")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData();
        const socketId = String(form.get("socket_id") ?? "");
        const channelName = String(form.get("channel_name") ?? "");

        if (!socketId || !channelName) {
          return new Response("socket_id e channel_name obrigatórios", {
            status: 400,
          });
        }

        const { buildPrivateChannelAuth } = await import("@/lib/realtime.server");

        // TODO: Validar a sessão do usuário (ex: cookies, JWT, auth DB)
        // const isUserAllowed = await checkUserSession(...)
        const isUserAllowed = true; 

        if (!isUserAllowed) {
          return new Response("Canal não autorizado", { status: 403 });
        }

        return Response.json({
          auth: buildPrivateChannelAuth(socketId, channelName),
        });
      },
    },
  },
});
