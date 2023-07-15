import { HiSolidQuestionMarkCircle, HiSolidArrowRight } from "solid-icons/hi";
import { createRouteAction, useNavigate } from "solid-start";
import config from "~/config";
import { getCookie } from "~/helpers/getCookie";
import { Profile, useProfile } from "./Providers/ProfileProvider";
import { useSupabase } from "./Providers/SupabaseProvider";
import toast from "solid-toast";
import { createSignal } from "solid-js";

export default function AddPDFModal() {
  const [profile] = useProfile();
  const supabase = useSupabase();
  const [isCustomPages, setIsCustomPages] = createSignal<boolean>(false);

  function replaceArxivUrl(url: string): string {
    if (url.includes('arxiv') && url.includes('.pdf')) {
      return url.replace('/pdf/', '/abs/').replace('.pdf', '');
    }
    return url;
  }

  const scrapeArxivTitle = async (url: string): Promise<string | null> => {
    const arxiv_abstract_url = replaceArxivUrl(url);
    const response = await fetch(`https://export.arxiv.org/api/query?id_list=${arxiv_abstract_url.split('/').pop()}`);
    const text = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'application/xml');
    const entryTitle = xmlDoc.getElementsByTagName('entry')[0]?.getElementsByTagName('title')[0]?.textContent;
    return entryTitle;
  };

  const handleLinkInput = async (e: Event) => {
    const link = (e.target as HTMLInputElement).value;
    const arxivRegex = /https:\/\/arxiv\.org/;
    if (link.match(arxivRegex)) {
      const title = await scrapeArxivTitle(link);
      if (title) {
        (document.querySelector('input[name="title"]') as HTMLInputElement).value = title;
      }
    }
  };

  const isFormValid = (formData: FormData) => {
    if (!formData.get("title") || !formData.get("link")) {
      toast.error("Fields must not be empty!");
      return false;
    }
    const googleDriveRegex =
      /https:\/\/drive\.google\.com\/(?:open|file\/d)\/([a-zA-Z0-9_-]+)(?:\/view)?/;
    const arxivRegex = /https:\/\/arxiv\.org/;
    if (
      !(formData.get("link") as string).match(googleDriveRegex) &&
      !(formData.get("link") as string).match(arxivRegex)
    ) {
      console.log((formData.get("link") as string).match(googleDriveRegex));
      toast.error("Must enter a valid PDF link!");
      return false;
    }
    return true;
  };

  const sanitizePageRanges = (e: any) => {
    if (e.target.valueAsNumber < 0) {
      e.target.value = "1";
    }
  };

  const [_, { Form }] = createRouteAction(async (formData: FormData) => {
    let toastId = "";
    if (isFormValid(formData)) {
      toastId = toast.loading("Uploading PDF", {duration : 1_000 * 60 * 60});
      fetch(config.API_BASE_URL + config.INDEX_PDF_URL, {
        method: "POST",
        headers: [
          ["Accept", "application/json"],
          ["Content-Type", "application/json"],
          ["Authorization", "Bearer " + getCookie("my-access-token")],
          ["Supabase_Refresh", getCookie("my-refresh-token") as string],
        ],
        body: JSON.stringify({
          title: formData.get("title"),
          google_drive_share_link: formData.get("link"),
          startPage: formData.get("startPage"),
          endPage: formData.get("endPage"),
        }),
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error(`Error: ${response.status}`);
        })
        .then(() => {
          let curr_index_status = "";
          toast.dismiss(toastId)
          const interval = setInterval(async () => {
            const { data } = await supabase
              .from("profiles")
              .select()
              .eq("id", profile().id);
            if (data && data[0]) {
              const profile_obj = data[0] as Profile;
              if (profile_obj.index_status === "Upload successful") {
                toast.success(profile_obj.index_status, { id: toastId });
                clearInterval(interval);
                location.reload(); // refreshes page
              } else if (profile_obj.index_status.includes("INDEXING FAILED")) {
                toast.dismiss(toastId);
                toast.error(profile_obj.index_status, { duration: 1_000 * 60 });
                clearInterval(interval);
              } else if (curr_index_status !== profile_obj.index_status) {
                curr_index_status = profile_obj.index_status;
                toast.dismiss(toastId);
                toastId = toast.loading(profile_obj.index_status, {
                  duration: 1_000 * 60 * 60, // 60 minutes
                }); 
              }
            }
          }, 1000);
        })
        .catch((error) => {
          toast.dismiss(toastId);
          toast.error(`Upload failed. ${error}`, { duration: 10000 });
        });
    }
    console.log(formData.get("link"));
  });

  return (
    <>
      <input type="checkbox" id="add_pdf_modal" class="modal-toggle" />
      <div class="modal modal-bottom sm:modal-middle cursor-pointer">
        <div class="modal-box sm:w-4/12 sm:max-w-5xl">
          <label
            for="add_pdf_modal"
            class="btn btn-sm btn-circle btn-secondary btn-ghost absolute right-4 top-4"
          >
            ✕
          </label>
          <Form>
            <h3 class="font-bold text-xl mb-8 sm:text-center">
              Add a paper
            </h3>
            <div class="form-control w-full max-w-lg mb-4">
              <label class="label">
                <span class="label-text">
                  Arxiv Link / Google Drive Share Link
                  <div
                    class="tooltip tooltip-top"
                    data-tip="Right click on file OR click on the 3 dots in upper right corner > Share > Change permission to ANYONE WITH LINK > Copy Link"
                  >
                    <HiSolidQuestionMarkCircle class="ml-2 -mb-1" size={18} />
                  </div>
                </span>
              </label>
              <input
                type="text"
                name="link"
                placeholder="Link"
                class="input input-bordered w-full"
                onInput={handleLinkInput}
              />
            </div>
            <div class="form-control w-full mb-4">
              <label class="label">
                <span class="label-text">Title</span>
              </label>
              <input
                type="text"
                name="title"
                placeholder="Title"
                class="input input-bordered w-full max-w-xs"
              />
            </div>
            <div class="form-control w-fit">
              <label class="label cursor-pointer">
                <span class="label-text">Upload Custom Pages</span>
                <input
                  type="checkbox"
                  checked={isCustomPages()}
                  onChange={() => setIsCustomPages((prev) => !prev)}
                  class="checkbox ml-4"
                />
              </label>
            </div>
            <div class="flex items-center w-full mb-4" classList={{ hidden: !isCustomPages() }}>
              <input
                type="number"
                name="startPage"
                placeholder={"Start"}
                onInput={sanitizePageRanges}
                class="input input-bordered w-24 mt-2"
              />
              <HiSolidArrowRight size={20} class="mx-2 mt-2"/>
              <input
                type="number"
                name="endPage"
                placeholder={"End"}
                onInput={sanitizePageRanges}
                class="input input-bordered w-24 mt-2"
              />
            </div>
            <div class="modal-action mt-8">
              <button>
                <label
                  for="add_pdf_modal"
                  class="btn btn-primary hover:border-base-100"
                >
                  Save
                </label>
              </button>
            </div>
          </Form>
        </div>
      </div>
    </>
  );
}
