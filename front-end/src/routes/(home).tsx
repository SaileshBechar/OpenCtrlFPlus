import { HiOutlinePlusCircle } from "solid-icons/hi";
import {
  onMount,
  Resource,
  Show,
  createEffect,
  createResource,
  createSignal,
} from "solid-js";
import {
  parseCookie,
  useLocation,
  useRouteData,
  useSearchParams,
} from "solid-start";
import { createServerData$, redirect } from "solid-start/server";
import NavBar from "~/components/Home/Navbar";
import { Profile, useProfile } from "~/components/Providers/ProfileProvider";
import Search from "~/components/Home/Search";
import { supabaseServer } from "~/helpers/supabase-server";
import toast from "solid-toast";
import { IndexDrawer } from "~/components/Home/IndexDrawer";
import { Chat } from "~/components/Home/Chat";
import config from "~/config";
import { getCookie } from "~/helpers/getCookie";

export function routeData() {
  return createServerData$(async (_, { request }) => {
    if (!request.headers.get("cookie")) {
      throw redirect("/landing");
    }
    const supabase = await supabaseServer();
    const cookies = parseCookie(request.headers.get("cookie") as string);
    const refreshToken = cookies["my-refresh-token"];
    const accessToken = cookies["my-access-token"];
    if (refreshToken && accessToken) {
      const session = await supabase.auth.setSession({
        refresh_token: refreshToken,
        access_token: accessToken,
      });
      const { data } = await supabase
        .from("profiles")
        .select()
        .eq("id", session?.data.user?.id);
      if (data) {
        if (data[0].payment_type === "free") {
          throw redirect("/pricing");
        }
        return data[0];
      } else {
        throw redirect("/landing");
      }
    } else {
      throw redirect("/landing");
    }
  });
}

export default function Home() {
  const sb_profile = useRouteData<typeof routeData>() as Resource<Profile>;
  const [profile, setProfile] = useProfile();
  const [searchParams] = useSearchParams();
  sb_profile(); // Need this to enable route redirection

  const fetchPDFs = async () => {
    return (
      await fetch(`${config.API_BASE_URL}/get_pdf_titles`, {
        headers: [
          ["Accept", "application/json"],
          ["Content-Type", "application/json"],
          ["Authorization", "Bearer " + getCookie("my-access-token")],
          ["Supabase_Refresh", getCookie("my-refresh-token") as string],
        ],
      })
    ).json();
  };
  const [pdfs, setPdfs] = createSignal<{ results: any[] }>();

  onMount(async () => {
    if (searchParams.success) {
      toast("Welcome to CtrlF+", {
        icon: <div class="animate-wiggle text-xl -mt-2">🎉</div>,
      });
    }
    setPdfs(await fetchPDFs());
  });

  createEffect(() => {
    setProfile(sb_profile() as Profile);
  });

  return (
    <Show when={!sb_profile.loading && profile() && profile().name !== ""}>
      <div class="drawer drawer-mobile">
        <input id="index-drawer" type="checkbox" class="drawer-toggle" />
        <div class="drawer-content">
          <NavBar profile={profile()} />
          <main class="h-[calc(100vh-74px)] w-full flex flex-col justify-end text-lg pb-10">
            {/* <Show when={pdfs()?.results}> */}
              <Chat />
            {/* </Show> */}
          </main>
        </div>
        <div class="drawer-side">
          <label for="index-drawer" class="drawer-overlay"></label>
          <IndexDrawer pdfs={pdfs()} />
        </div>
      </div>
    </Show>
  );
}
