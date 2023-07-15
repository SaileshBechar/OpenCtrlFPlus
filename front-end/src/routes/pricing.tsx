import { SupabaseClient, UserResponse } from "@supabase/supabase-js";
import { createEffect, createSignal, onMount, Resource, Show } from "solid-js";
import { createRouteData, parseCookie, useRouteData } from "solid-start";
import { createServerData$, redirect } from "solid-start/server";
import { supabaseServer } from "~/helpers/supabase-server";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import config from "~/config";
import { getCookie } from "~/helpers/getCookie";
import SubscriptionDisplay from "~/components/Payments/SubscriptionDisplay";
import NavBar from "~/components/Home/Navbar";
import { useSupabase } from "~/components/Providers/SupabaseProvider";
import { Profile, useProfile } from "~/components/Providers/ProfileProvider";

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
        if (data[0].payment_type !== "free") {
          return redirect("/pricing");
        }
        return await supabase.auth.getUser();
      } else {
        console.log("second redirect");
        throw redirect("/landing");
      }
    } else {
      throw redirect("/landing");
    }
  });
}

export default function Pricing() {
  const user = useRouteData<typeof routeData>() as Resource<UserResponse>;
  user(); // Need this to enable route redirection

  return (
    <>
      <main class="flex justify-center items-center w-full sm:px-20 h-screen bg-base-200">
        <SubscriptionDisplay
          userID={user()?.data.user?.id as string}
          email={user()?.data.user?.email as string}
        />
      </main>
    </>
  );
}
