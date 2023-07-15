import { createEffect, createSignal, Setter } from "solid-js";
import { HiOutlineSearch, HiSolidFilter } from "solid-icons/hi";
import Results from "./Results";
import { Chat } from "./Chat";

export type Filters = {
  paragraph: boolean;
  equation: boolean;
  figure: boolean;
  table: boolean;
  author: boolean;
};

const EMPTY_FILTERS = {
  paragraph: true,
  equation: true,
  figure: true,
  table: true,
  author: true,
};

export default function Search() {
  let inputRef: HTMLInputElement | undefined;
  const [searchInput, setSearchInput] = createSignal("");
  const [checkboxes, setCheckboxes] = createSignal<Filters>(EMPTY_FILTERS);

  return (
    <>
      <div class="">
        <div class="form-control max-w-xs sm:max-w-none w-[42rem] relative">
          <div class="dropdown dropdown-hover left-0 top-0 absolute">
            <label
              tabindex="0"
              class="btn rounded-r-none btn-outline btn-secondary hover:btn-primary focus:transition-none focus:ring-0"
            >
              <HiSolidFilter size={24} />
            </label>
            <ul
              tabindex="0"
              class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 focus:transition-none focus:ring-0"
            >
              <label class="label cursor-pointer">
                <span class="label-text">Equation</span>
                <input
                  type="checkbox"
                  id="equation"
                  checked={checkboxes().equation}
                  onChange={(e) => {
                    setCheckboxes((prev) => {
                      return {
                        ...prev,
                        [e.currentTarget.id]:
                          !prev[e.currentTarget.id as keyof Filters],
                      };
                    });
                  }}
                  class="checkbox checkbox-primary"
                />
              </label>
              <label class="label cursor-pointer">
                <span class="label-text">Paragraph</span>
                <input
                  type="checkbox"
                  id="paragraph"
                  checked={checkboxes().paragraph}
                  onChange={(e) => {
                    setCheckboxes((prev) => {
                      return {
                        ...prev,
                        [e.currentTarget.id]:
                          !prev[e.currentTarget.id as keyof Filters],
                      };
                    });
                  }}
                  class="checkbox checkbox-primary"
                />
              </label>
              <label class="label cursor-pointer">
                <span class="label-text">Figure</span>
                <input
                  type="checkbox"
                  id="figure"
                  checked={checkboxes().figure}
                  onChange={(e) => {
                    setCheckboxes((prev) => {
                      return {
                        ...prev,
                        [e.currentTarget.id]:
                          !prev[e.currentTarget.id as keyof Filters],
                      };
                    });
                  }}
                  class="checkbox checkbox-primary"
                />
              </label>
              <label class="label cursor-pointer">
                <span class="label-text">Table</span>
                <input
                  type="checkbox"
                  id="table"
                  checked={checkboxes().table}
                  onChange={(e) => {
                    setCheckboxes((prev) => {
                      return {
                        ...prev,
                        [e.currentTarget.id]:
                          !prev[e.currentTarget.id as keyof Filters],
                      };
                    });
                  }}
                  class="checkbox checkbox-primary"
                />
              </label>
              <label class="label cursor-pointer">
                <span class="label-text">Author</span>
                <input
                  type="checkbox"
                  id="author"
                  checked={checkboxes().author}
                  onChange={(e) => {
                    setCheckboxes((prev) => {
                      return {
                        ...prev,
                        [e.currentTarget.id]:
                          !prev[e.currentTarget.id as keyof Filters],
                      };
                    });
                  }}
                  class="checkbox checkbox-primary"
                />
              </label>
            </ul>
          </div>
          <input
            type="text"
            placeholder="Search papers"
            ref={inputRef}
            class="input input-bordered input-primary max-w-xs sm:max-w-2xl w-full pl-[4.25rem] pr-14"
            onkeypress={(e: any) => {
              if (e.key == "Enter") setSearchInput(e.currentTarget.value);
            }}
          />
          <button
            class="btn btn-link w-10 p-2 absolute right-2 text-secondary"
            onClick={(e: any) => {
              setSearchInput(inputRef?.value as string);
            }}
          >
            <HiOutlineSearch size={20} />
          </button>
        </div>
      </div>
      <Results searchInput={searchInput} filters={checkboxes} />
    </>
  );
}
