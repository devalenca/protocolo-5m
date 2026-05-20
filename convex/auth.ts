import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

/* =================================================================
   Convex Auth — Provider Password (email + senha)
   ----------------------------------------------------------------
   100% gratuito, sem terceiros. Tudo armazenado no Convex.
   Sem verificação de email / reset por email pra ficar 100% offline.
   ================================================================= */

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});
