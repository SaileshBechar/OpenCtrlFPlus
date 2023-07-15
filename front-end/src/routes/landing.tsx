import { FaSolidCheck, FaSolidArrowDown } from "solid-icons/fa";
import { Show } from "solid-js";
import { A, createRouteAction } from "solid-start";
import Footer from "~/components/Footer";
import { useSupabase } from "~/components/Providers/SupabaseProvider";

// Import the custom images
import mendeleyIcon from "~/assets/mendeley-icon.png";
import zoteroIcon from "~/assets/zotero-icon.png";
import driveIcon from "~/assets/drive-icon.png";
import arxivIcon from "~/assets/arxiv-icon.png";
export default function Landing() {
  const supabase = useSupabase();
  let emailForm: HTMLDivElement | undefined = undefined;

  function scrollToSection() {
    if (emailForm) {
      emailForm.scrollIntoView({ behavior: "smooth" });
    }
  }
  const [submitEmail, { Form }] = createRouteAction(
    async (formData: FormData) => {
      if (formData.get("email")) {
        const { error } = await supabase
          .from("emails")
          .insert({ email: formData.get("email") });
        if (error) {
          return false;
        } else {
          return true;
        }
      } else return false;
    }
  );

  return (
    <div class="drawer">
      <input id="landing-drawer" type="checkbox" class="drawer-toggle" />
      <div class="drawer-content flex flex-col ">
        <div class="w-full navbar min-h-[5rem] bg-transparent">
          <div class="navbar-start">
            <div class="lg:hidden">
              <label for="landing-drawer" class="btn btn-square btn-ghost">
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
            <div class="inline-flex px-2 mx-2 font-bold text-3xl ">
              <div class="">CtrlF</div>
              <button class="bg-clip-text text-transparent transition ease-in-out btn-gradient origin-center hover:-rotate-180 hover:translate-y-2 duration-300 ">
                +
              </button>
            </div>
          </div>
          <div class="navbar-center hidden lg:block">
            <ul class="menu menu-horizontal gap:4">
              <li>
                <A href="/about">About Us</A>
              </li>
            </ul>
          </div>
          <div class="navbar-end mr-2">
            <A href="/login" class="btn btn-primary hidden lg:flex">
              Login
            </A>
          </div>
        </div>
        <div class="hero min-h-screen bg-gradient-to-tr from-primary-focus via-primary to-secondary text-primary-content">
          <div class="hero-content flex-col justify-start !items-start px-10 max-w-6xl text-left">
            <h1 class="mb-5 text-5xl sm:text-8xl font-bold leading-tight capitalize">
              <div class="">
                The <span class="">AI assistant</span> for
              </div>
              <div class="">scientific research</div>
            </h1>
            <p class="text-xl sm:text-2xl mb-5 ">
              {/* Extract and work with data, methods, analyses, equations, and even figures from your papers. */}
              Extracts and analyzes complex data, provides contextualized
              explanations and summaries, and more.{" "}
              <b>Tailored to your collection of scientific papers.</b>
            </p>
            <button
              class="btn btn-primary bg-[#D6D9FF] mb-20 font-bold"
              onClick={scrollToSection}
            >
              Join the waitlist
              <FaSolidArrowDown size={16} class="ml-2" />
            </button>
          </div>
        </div>
        <div class="relative bg-primary">
          <div class="absolute w-full h-full">
            <div class="relative h-full w-full top-0 left-0 bg-base-300 -skew-y-12 sm:-skew-y-6 min-h-[150vh] translate-y-[-8rem] "></div>
          </div>
          <div class="hero bg-transparent">
            <div class="hero-content flex-col sm:flex-row sm:justify-center gap-4 items-center justify-center">
              <A href="/login">
                <button class="btn btn-neutral mx-2 ring-2 ring-neutral-content">
                  <img
                    src={arxivIcon}
                    alt="Arxiv"
                    class="inline-block w-10 h-10 mr-2"
                  />
                  Integrate with Arxiv
                </button>
              </A>
              <A href="/login">
                <button class="btn btn-neutral mx-2 ring-2 ring-neutral-content">
                  <img
                    src={mendeleyIcon}
                    alt="Mendeley"
                    class="inline-block w-6 h-6 mr-2"
                  />
                  Integrate with Mendeley
                </button>
              </A>
              <A href="/login">
                <button class="btn btn-neutral mx-2 ring-2 ring-neutral-content">
                  <img
                    src={driveIcon}
                    alt="Drive"
                    class="inline-block w-6 h-6 mr-2"
                  />
                  Integrate with Drive
                </button>
              </A>
            </div>
          </div>
          <div class="hero min-h-screen bg-transparent">
            <div class="hero-content flex-col sm:flex-row sm:justify-center px-10 sm:px-20 h-full w-full max-w-none">
              <div class="sm:mr-5">
                <div class="text-4xl sm:text-5xl font-semibold mb-6 text-center sm:text-left">
                  Accelerate Your Research
                </div>
                <ul class="text-xl mt-8 list-disc list-outside">
                  <li class="my-3">
                    Discover deep insights with GPT4 by seamlessly integrating
                    knowledge and data from the papers you care about.
                  </li>
                  <li class="my-3">
                    Access laser-precise search through your custom
                    knowledge-base of traditionally unsearchable PDFs.
                  </li>
                  <li class="my-3">
                    Dark-themed reading for those sleepless researchers. You
                    know who you are.
                  </li>
                </ul>
              </div>
              {/* 
              <iframe
                src="https://github.com/emcf/CtrlFplus/assets/38445041/e1eed1bb-9e22-4f4c-bc92-1fc9a4d2a946"
                title="Demo Video"
                allowfullscreen
                class="w-full aspect-[14/9]"
              ></iframe> */}
              <iframe
                src="https://player.vimeo.com/video/838779843?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"
                allow="autoplay; fullscreen; picture-in-picture"
                title="Demo Video"
                allowfullscreen
                class="w-full aspect-[14/9]"
              ></iframe>
              <script src="https://player.vimeo.com/api/player.js"></script>
            </div>
          </div>
        </div>
        <div
          class="hero min-h-screen bg-gradient-to-t from-primary to-secondary text-base-100"
          ref={emailForm}
        >
          <div class="hero-overlay bg-opacity-10"></div>
          <div class="hero-content flex flex-col items-center mt-32 p-10">
            <div class="text-3xl font-semibold text-left">
              Request exclusive access now.
            </div>
            <Form class="inline-flex w-full mt-4 relative">
              <input
                type="email"
                name="email"
                placeholder="Email"
                class="input input-bordered w-full max-w-xs sm:max-w-none pr-20 text-base-content"
              />
              <Show
                when={!submitEmail.result}
                fallback={
                  <button class="btn btn-success absolute top-0 right-0 rounded-l-none">
                    <FaSolidCheck />
                  </button>
                }
              >
                <button
                  class="btn absolute top-0 right-0 rounded-l-none"
                  classList={{ loading: submitEmail.pending }}
                >
                  Join!
                </button>
              </Show>
            </Form>
            <A class="mt-6 text-xl" href="/login">
              Already have an account? <u>Login.</u>
            </A>
          </div>
        </div>
        <Footer />
      </div>
      <div class="drawer-side">
        <label for="landing-drawer" class="drawer-overlay"></label>
        <ul class="menu p-4 w-80 bg-base-100">
          <li>
            <A href="/login" class="btn btn-primary">
              Login
            </A>
          </li>
          <li>
            <A href="/about">About Us</A>
          </li>
        </ul>
      </div>
    </div>
  );
}
