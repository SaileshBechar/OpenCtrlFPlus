import { A } from "solid-start";
import Footer from "~/components/Footer";

export default function About() {
  return (
    <>
      <div class="w-full navbar h-20 bg-neutral">
        <div class="navbar-start">
          <A href="/landing">
            <div class="inline-flex px-2 mx-2 font-bold text-3xl ">
              <div class="">CtrlF</div>
              <button class="bg-clip-text text-transparent transition ease-in-out btn-gradient origin-center hover:-rotate-180 hover:translate-y-2 duration-300 ">
                +
              </button>
            </div>
          </A>
        </div>
            
        <div class="navbar-end mr-2">
          <A href="/login" class="btn btn-primary hidden lg:flex">
            Login
          </A>
        </div>
      </div>
      <div class="h-screen w-full sm:p-20 text-lg flex flex-col justify-center items-center bg-gradient-to-tr from-primary-focus to-primary ">
        <div class="text-lg sm:text-2xl my-10 text-center p-5 sm:px-80">
          Our mission is to empower researchers with laser-focused access to
          their domain-specific documents, enabling them to focus on what truly
          matters. Join us in transforming the research community and shaping a
          more efficient, informed, and collaborative world.
        </div>
        <div class="rounded-lg bg-neutral flex flex-col items-center gap:6 sm:w-6/12 sm:h-96 p-6 border-4 border-neutral-focus">
          <div class="text-center text-lg mb-4 sm:mb-0 sm:text-2xl">
            Meet the team
          </div>
          <div class="flex justify-center items-center gap-12 w-full h-[90%]">
            <div class="flex flex-col items-center justify-center">
              <div class="avatar">
                <div class="w-24 rounded grayscale">
                  <img src="https://cdn.discordapp.com/attachments/894774806912827433/1103842430530375701/emcf-removebg-preview_1.png" />
                </div>
              </div>
              <div class="text-lg mt-2">Emmett McFarlane</div>
              <div>Co-founder, CEO</div>
            </div>
            <div class="flex flex-col items-center justify-center">
              <div class="avatar">
                <div class="w-24 rounded grayscale">
                  <img src="https://cdn.discordapp.com/attachments/839630331242217502/939238062322491402/grad_photo.png" />
                </div>
              </div>
              <div class="text-lg mt-2">Sailesh Bechar</div>
              <div>Co-founder, CTO</div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
