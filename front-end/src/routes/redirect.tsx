import { createEffect, createSignal, Show } from "solid-js";
import {
  Navigate,
  useLocation,
} from "solid-start";
import { getCookie } from "../helpers/getCookie";

export default function Redirect() {
  const location = useLocation();
  const [hasCookie, setHasCookie] = createSignal<boolean>(false)

  createEffect(() => {
    // Ensure cookie has loaded before redirect
    if (!location.hash) {
      const interval = setInterval(() => {
        if (getCookie("my-access-token")){
          setHasCookie(true)
          clearInterval(interval)
        }
      }, 100)
    }
  });

  return (
    <Show when={hasCookie()} fallback={<div class="h-screen flex justify-center items-center loading-anim">Loading...</div>}>
      <Navigate href="/" />
    </Show>
  );
}
