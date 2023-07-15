import {
  Accessor,
  createResource,
  For,
  ResourceReturn,
  Suspense,
} from "solid-js";
import { HiOutlineExternalLink } from "solid-icons/hi";
import config from "~/config";
import { getCookie } from "~/helpers/getCookie";
import { Filters } from "./Search";

interface Props {
  searchInput: Accessor<string>;
  filters: Accessor<Filters>;
}

type SearchResult = {
  title: string;
  content: string;
  pdf_link: string;
  page_num: string;
  type: string;
  similarity: number;
  page_content ?: string;
};


export default function Results(props: Props) {
  const fetchSearchResults = async (input: string): Promise<any> => {
    if (input)
      return (
        await fetch(`${config.API_BASE_URL}/search`, {
          method: "POST",
          headers: [
            ["Accept", "application/json"],
            ["Content-Type", "application/json"],
            ["Authorization", "Bearer " + getCookie("my-access-token")],
            ["Supabase_Refresh", getCookie("my-refresh-token") as string],
          ],
          body: JSON.stringify({
            search_input: input,
            filters: props.filters(),
          }),
        })
      ).json();
  };
  const [searchResults]: ResourceReturn<{ results: SearchResult[] }> =
    createResource(props.searchInput, fetchSearchResults);

  const createPDFPageLink = (pdf_link: string, page_num: string): string => {
    // https://drive.google.com/uc?export=view&id={ID}#page={num}
    const regex = /[-\w]{25,}/;

    const fileIdMatch = pdf_link.match(regex);

    if (fileIdMatch && pdf_link.includes('google')) {
      const fileId = fileIdMatch[0];
      return `https://drive.google.com/uc?export=view&id=${fileId}#page=${page_num}`;
    }
    if (pdf_link.includes('/abs/')) {
      pdf_link = pdf_link.replace('/abs/', '/pdf/') + '.pdf';
    }
    return pdf_link + `#page=${page_num}`;
  };

  return (
    <div class="mt-4 max-w-xs sm:max-w-none w-[45rem]">
      <Suspense
        fallback={
          <div class="search-result w-full">
            <div class="text-center font-bold text-xl mb-8">Searching</div>
            <progress class="progress progress-secondary w-full"></progress>
          </div>
        }
      >
        <For each={searchResults()?.results}>
          {(result) => (
            <div class="search-result text-left">
              <div innerHTML={ (window as any).markdownToHTML(result.content)}/>
              <div class="flex flex-col md:flex-row justify-between items-center w-full mt-5">
                <div class="text-left md:mr-6">
                  {result.title}, page {result.page_num} 
                  <div class="text-sm">
                    {"("}{Math.round(result.similarity * 100)}%{" match)"}
                    </div>
                </div>
                <a
                  class="btn btn-secondary hover:btn-primary btn-circle btn-outline flex items-center gap-2 btn-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={createPDFPageLink(result.pdf_link, result.page_num)}
                >
                  <HiOutlineExternalLink size={18} />
                </a>
              </div>
            </div>
          )}
        </For>
      </Suspense>
    </div>
  );
}
