import { A } from "solid-start";

export default function Footer() {
  return (
    <footer class="footer p-10 bg-base-200 text-base-content">
      <div>
        <p class="font-bold text-lg ">CtrlFPlus Research Ltd.</p>
        <p class="font-semibold">Search less. Do more.</p>
        <p>Copyright © 2023 - All right reserved</p>
      </div>
      <div>
        <span class="footer-title">Company</span>
        <A href="/about" class="link link-hover">About us</A>
        <a class="link link-hover" href="mailto:ctrlfplus.ai@gmail.com">
          Contact us 👋
        </a>
      </div>
    </footer>
  );
}
