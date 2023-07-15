import { createSignal, onMount, Show } from "solid-js";
import { A, redirect, useNavigate, useRouteData } from "solid-start";
import { createServerData$ } from "solid-start/server";
import { supabaseServer } from "../helpers/supabase-server";
import { parseCookie } from "solid-start";
import { useSupabase } from "~/components/Providers/SupabaseProvider";
import { FaBrandsGoogle } from "solid-icons/fa";
import config from "~/config";
export function routeData() {
  return createServerData$(async (_, { request }) => {
    if (!request.headers.get("cookie")) {
      return;
    }
    const supabase = await supabaseServer();
    const cookies = parseCookie(request.headers.get("cookie") as string);
    const refreshToken = cookies["my-refresh-token"];
    const accessToken = cookies["my-access-token"];
    if (refreshToken && accessToken) {
      await supabase.auth.setSession({
        refresh_token: refreshToken,
        access_token: accessToken,
      });

      if ((await supabase.auth.getUser(accessToken)).data.user) {
        console.log("User found");
        throw redirect("/");
      }
    } else {
      console.error("Cookie not found!");
    }
  });
}

export default function Login() {
  const [loading, setLoading] = createSignal(false);
  const supabase = useSupabase();
  const data = useRouteData<typeof routeData>();
  data(); // Needs to be called to enable redirects

  async function handleGoogleLogin() {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: config.CLIENT_BASE_URL + "/redirect",
      },
    });
    if (data) {
      console.log("Google sign in", data, error);
    }
  }

  return (
    <main class="text-center mx-auto p-4 flex flex-col items-center bg-base-100 h-screen w-[50%]">
      <div class="h-[30vh] mt-[10vh] flex items-center font-bold text-6xl justify-center">
        <div class="">CtrlF</div>
        <button class="bg-clip-text text-transparent transition ease-in-out btn-gradient origin-center hover:-rotate-180 hover:translate-y-4 duration-300 ">
          +
        </button>
      </div>
      <div class="divider"></div>
        <button
          class="btn btn-primary gap-2 mt-8 btn-xs sm:btn-sm md:btn-md"
          classList={{loading: loading()}}
          onClick={handleGoogleLogin}
        >
          <FaBrandsGoogle size={20} />
          Sign in with Google
        </button>
      <A class="mt-14" href="/landing">
        Dont' have an account yet? <u>Request access</u>.
      </A>
    </main>
  );
}
