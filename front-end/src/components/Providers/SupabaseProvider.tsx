import { SupabaseClient } from "@supabase/supabase-js";
import {
  createSignal,
  createContext,
  useContext,
  createEffect,
  onCleanup,
} from "solid-js";
import { supabaseBrowser } from "~/helpers/supabase-browser";

const SupbaseContext = createContext<SupabaseClient<any, "public", any>>();

interface Props {
  children: any;
}
export function SupabaseProvider(props: Props) {
  const [supabase] =
    createSignal<SupabaseClient<any, "public", any>>(supabaseBrowser);

  createEffect(() => {
    const {
      data: { subscription },
    } = supabase().auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || event === "USER_DELETED") {
        // delete cookies on sign out
        const expires = new Date(0).toUTCString();
        document.cookie = `my-access-token=; path=/; expires=${expires}; SameSite=Lax; secure`;
        document.cookie = `my-refresh-token=; path=/; expires=${expires}; SameSite=Lax; secure`;
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        const maxAge = 100 * 365 * 24 * 60 * 60; // 100 years, never expires
        document.cookie = `my-access-token=${session?.access_token}; path=/; max-age=${maxAge}; SameSite=Lax; secure`;
        document.cookie = `my-refresh-token=${session?.refresh_token}; path=/; max-age=${maxAge}; SameSite=Lax; secure`;
      }
    });
    onCleanup(() => subscription.unsubscribe());
  });

  return (
    <SupbaseContext.Provider value={supabase()}>
      {props.children}
    </SupbaseContext.Provider>
  );
}

export function useSupabase() {
  return useContext(SupbaseContext) as SupabaseClient<any, "public", any>;
}
