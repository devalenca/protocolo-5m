import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";

/**
 * Middleware do Convex — gerencia cookies de sessão pra SSR.
 * Roda em todas as rotas exceto assets estáticos.
 */
export default convexAuthNextjsMiddleware();

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
