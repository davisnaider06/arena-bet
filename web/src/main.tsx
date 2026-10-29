import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { MotionConfig } from "motion/react";
import "@fontsource-variable/inter";
import "./index.css";
import { router } from "./router";
import { ToastProvider } from "./state/toast";
import { BetSlipProvider } from "./state/betslip";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // O socket mantém o cache vivo; não precisa refazer a busca a cada foco.
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <BetSlipProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </BetSlipProvider>
      </MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
);
