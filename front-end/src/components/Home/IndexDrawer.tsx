import { HiOutlineExternalLink, HiOutlinePlusCircle } from "solid-icons/hi";
import {
  Component,
  For,
  Resource,
  Show,
  Suspense,
  createResource,
  createSignal,
  onMount,
} from "solid-js";
import { createRouteData, useRouteData } from "solid-start";
import config from "~/config";
import { getCookie } from "~/helpers/getCookie";
import { Profile } from "../Providers/ProfileProvider";
import { routeData } from "~/routes/(home)";

export const IndexDrawer: Component<{
  pdfs: { results: any[] } | undefined;
}> = (props) => {
  const profile = useRouteData<typeof routeData>() as Resource<Profile>;
  return (
    <div class="menu p-4 w-80 bg-base-300 text-base-content min-h-screen flex-nowrap">
      <Show
        when={
          profile() &&
          (profile() as Profile).pages_uploaded <
            (profile() as Profile).max_pages
        }
        fallback={
          <div
            class="btn btn-disabled"
            tabindex="-1"
            role="button"
            aria-disabled="true"
          >
            Page Limit Reached
          </div>
        }
      >
        <label
          for="add_pdf_modal"
          class="btn btn-primary flex items-center mb-4"
        >
          <HiOutlinePlusCircle size={22} class="mr-2 text-secondary" />
          Add Paper
        </label>
      </Show>
      <Suspense fallback={<div class="btn loading">Loading Papers</div>}>
        <ul class="font-semibold">
          <For each={props.pdfs?.results}>
            {(result) => (
              <li>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={result.pdf_link}
                  class="flex justify-between"
                >
                  {result.title}
                  <div class="btn btn-secondary hover:btn-primary btn-circle btn-outline flex items-center gap-2 btn-sm">
                    <HiOutlineExternalLink size={18} />
                  </div>
                </a>
              </li>
            )}
          </For>
        </ul>
      </Suspense>
    </div>
  );
};
