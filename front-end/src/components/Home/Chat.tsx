import { HiOutlineSearch, HiOutlineTrash } from "solid-icons/hi";
import {
  Component,
  For,
  Show,
  createEffect,
  createSignal,
  on,
  onMount,
} from "solid-js";
import config from "~/config";
import { supabaseBrowser } from "~/helpers/supabase-browser";
import { useProfile } from "../Providers/ProfileProvider";
import { getCookie } from "~/helpers/getCookie";

type Conversation = {
  content: string;
  role: "user" | "assistant" | "system";
};

export const Chat: Component<{}> = () => {
  const [conversation, setConversation] = createSignal<Conversation[]>([]);
  const [isCompleting, setIsCompleting] = createSignal<boolean>(false);
  const [isWaitingForCompletion, setIsWaitingForCompletion] =
    createSignal<boolean>(false);
  const [eventSource, setEventSource] = createSignal<EventSource>(
    new EventSource(`${config.API_BASE_URL}/stream`)
  );
  const [profile] = useProfile();

  let inputRef: HTMLInputElement | undefined;
  let chatboxRef: HTMLDivElement | undefined;

  onMount(async () => {
    eventSource().close();
    const { data, error } = await supabaseBrowser
      .from("chat_history")
      .select("history")
      .eq("user_id", profile().id)
      .order("created_at", { ascending: true })
      .limit(1);
    console.log(data);
    if (data && data[0]) setConversation(data[0].history.memory.slice(1));
  });

  function decodeUnicode(str: string): string {
    return str.replace(/\\u(\w{1,4})/g, function (match, hex) {
      const code = parseInt(hex, 16);
      return String.fromCodePoint(code);
    });
  }

  createEffect(() => {
    eventSource().onmessage = (event) => {
      let completion = (event.data as string).slice(1, -1);
      // completion = String.raw`${completion}`
      if (completion === `[DONE]`) {
        setIsCompleting(false);
        eventSource().close();
      } else if (conversation().slice(-1)[0].role === "user") {
        setConversation((prev) => [
          ...prev,
          { content: "", role: "assistant" },
        ]);
        setIsCompleting(true);
        setIsWaitingForCompletion(false);
      } else {
        completion = decodeUnicode(completion);
        completion = completion.replaceAll("\\\\", "\\");
        completion = completion.replaceAll("\\n", " ");

        setConversation((prev) => [
          ...prev.slice(0, -1),
          {
            content: prev.slice(-1)[0].content + completion,
            role: "assistant",
          },
        ]);
        console.log(conversation().slice(1));
      }
    };
  });

  createEffect(
    on(conversation, () => {
      if (chatboxRef) chatboxRef.scrollTop = chatboxRef?.scrollHeight;
    })
  );

  const handleUserInput = () => {
    if (inputRef?.value) {
      setConversation((prev) => [
        ...prev,
        { content: inputRef?.value as string, role: "user" },
      ]);
      setEventSource(
        new EventSource(
          `${config.API_BASE_URL}/stream?prompt=${
            inputRef?.value
          }&my-access-token=${
            "Bearer " + getCookie("my-access-token")
          }&my-refresh-token=${getCookie("my-refresh-token")}`
        )
      );
      setIsWaitingForCompletion(true);
      inputRef.value = "";
    }
  };

  const clearChat = async () => {
    setConversation([]);
    const { error } = await supabaseBrowser
      .from("chat_history")
      .delete()
      .eq("user_id", profile().id)
      .order("created_at", { ascending: true })
      .limit(1);
    if (error) console.error(error);
  };

  return (
    <>
      <div class="overflow-auto sm:px-[10%] px-5" ref={chatboxRef}>
        <For each={conversation()}>
          {(bubble) => (
            <Show
              when={bubble.role === "assistant"}
              fallback={
                <div class="chat chat-end">
                  <div class="chat-bubble mt-10 flex bg-primary text-primary-content">
                    <div
                      innerHTML={(window as any).markdownToHTML(bubble.content)}
                    />
                  </div>
                </div>
              }
            >
              <div class="chat chat-start">
                <div class="chat-bubble mt-10 flex">
                  <div
                    innerHTML={(window as any).markdownToHTML(bubble.content)}
                  />
                </div>
              </div>
            </Show>
          )}
        </For>
        <Show when={isWaitingForCompletion()} fallback={<></>}>
          <div class="chat chat-start">
            <div class="chat-bubble mt-10 flex">Studying...</div>
          </div>
        </Show>
      </div>
      <div class="relative mt-10 sm:mx-[20%] mx-5">
        <input
          type="text"
          placeholder="Search your library."
          ref={inputRef}
          class="input input-bordered input-primary w-full pr-14"
          onkeypress={(e: any) => {
            if (e.key == "Enter" && !isCompleting()) handleUserInput();
          }}
        />
        <button
          class="btn btn-secondary hover:bg-secondary w-16 p-2 absolute right-0"
          onClick={handleUserInput}
          disabled={isCompleting()}
        >
          <HiOutlineSearch size={20} />
        </button>
        <button
          class="btn btn-primary hidden sm:inline-flex absolute -right-20"
          onClick={clearChat}
        >
          <HiOutlineTrash size={20} />
        </button>
      </div>
    </>
  );
};
