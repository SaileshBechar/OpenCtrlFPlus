import { createEffect, Resource, Show } from "solid-js";
import {
  A,
  parseCookie,
  useLocation,
  useNavigate,
  useRouteData,
} from "solid-start";
import {
  createServerAction$,
  createServerData$,
  redirect,
} from "solid-start/server";
import { Stripe as StripeServer } from "stripe";
import { Profile } from "~/components/Providers/ProfileProvider";
import { supabaseServer } from "~/helpers/supabase-server";
import { HiOutlineExternalLink } from "solid-icons/hi";
import { FaSolidSpinner } from "solid-icons/fa";
import config from "~/config";
import ProfileSettings from "~/components/ProfileSettings";
import Footer from "~/components/Footer";
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
          return redirect("/pricing");
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

export default function Settings() {
  const [customerPortal, { Form }] = createServerAction$(async (formData: FormData) => {
    const stripe = new StripeServer(
      import.meta.env.VITE_STRIPE_SECRET_KEY,
      undefined as any
    );
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: formData.get("customer_id") as string,
      return_url: config.CLIENT_BASE_URL + "/settings",
    });
    return redirect(portalSession.url);
  });

  const profile = useRouteData<typeof routeData>() as Resource<Profile>;

  return (
    <Show when={profile()}>
      <main>
        <div class="w-full navbar bg-base-300">
          <div class="navbar-start flex-1 flex items-center">
            <div class="font-bold text-2xl px-2 mx-2">
              <A href="/" class="flex items-center">
                <div class="">CtrlF</div>
                <button class="bg-clip-text text-transparent transition ease-in-out btn-secondary btn-gradient origin-center hover:-rotate-180 hover:translate-y-1 duration-300 ">
                  +
                </button>
              </A>
            </div>
          </div>
          <div class="flex-none lg:hidden">
            <label for="settings-drawer" class="btn btn-square btn-ghost">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                class="inline-block w-6 h-6 stroke-current"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              </svg>
            </label>
          </div>

          <div class="flex-none hidden lg:block"></div>
        </div>

        <div class="drawer drawer-mobile">
          <input id="settings-drawer" type="checkbox" class="drawer-toggle" />
          <div class="drawer-content flex flex-col items-center justify-center">
            <ProfileSettings profile={profile() as Profile} />
          </div>
          <div class="drawer-side">
            <label for="settings-drawer" class="drawer-overlay"></label>
            <ul class="menu p-4 w-80 bg-base-200">
              <li>
                <a class="btn-primary text-primary-content">Edit Profile</a>
              </li>
              <li>
                <Form>
                  <input
                    type="hidden"
                    name="customer_id"
                    value={profile()?.customer_id as string}
                  />
                  <button class="w-full h-full inline-flex gap-2 before:mt-2" classList={{"loading-anim" : customerPortal.pending}}>
                    <HiOutlineExternalLink size={20} class="-ml-2"/>
                    Manage Subscription
                  </button>
                </Form>
              </li>
              <li>
                <a href="mailto:ctrlfplus.ai@gmail.com" class="">
                  Contact Us 👋
                </a>
              </li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </Show>
  );
}
