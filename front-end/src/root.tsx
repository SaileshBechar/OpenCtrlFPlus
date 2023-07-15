// @refresh reload
import { createEffect, Suspense } from "solid-js";
import {
  useLocation,
  A,
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title,
} from "solid-start";
import AddPDFModal from "./components/AddPDFModal";
import { ProfileProvider } from "./components/Providers/ProfileProvider";
import { SupabaseProvider } from "./components/Providers/SupabaseProvider";
import { Toaster } from "solid-toast";
import "./root.css";

export default function Root() {
  return (
    <Html lang="en" data-theme="fire" class="text-neutral-300">
      <Head>
        <Title>CtrlF+</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <script>
        {`let script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/mathpix-markdown-it@1.0.40/es5/bundle.js";
    document.head.append(script);

    script.onload = function() {
      const isLoaded = window.loadMathJax();
      if (isLoaded) {
        console.log('Styles loaded!')
      }
    }`}
      </script>
      <Body>
        <Suspense>
          <ErrorBoundary>
            <SupabaseProvider>
              <ProfileProvider>
                <AddPDFModal />
                <Routes>
                  <FileRoutes />
                </Routes>
                <Toaster
                  position="top-center"
                  containerClassName=""
                  containerStyle={{}}
                  toastOptions={{
                    // Define default options that each toast will inherit. Will be overwritten by individual toast options
                    className:
                      "!bg-neutral !text-neutral-content font-semibold",
                    duration: 5000,
                  }}
                />
              </ProfileProvider>
            </SupabaseProvider>
          </ErrorBoundary>
        </Suspense>
        <Scripts />
      </Body>
    </Html>
  );
}
