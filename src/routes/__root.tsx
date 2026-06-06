import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Toaster } from "@/components/ui/sonner";
import { ChatBotWidget } from "@/components/ChatBotWidget";
import { useRouterState } from "@tanstack/react-router";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-gold-gradient">404</h1>
        <h2 className="mt-4 font-display text-2xl">Страница не найдена</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Дорога к этой странице ускользнула, как тень между стихиями.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-gold-gradient px-6 py-3 text-sm uppercase tracking-[0.2em] text-primary-foreground hover:opacity-90 transition"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl">Что-то пошло не так</h1>
        <p className="mt-2 text-sm text-muted-foreground">Стихии временно вне баланса. Попробуйте ещё раз.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-xl bg-gold-gradient px-6 py-3 text-sm uppercase tracking-[0.2em] text-primary-foreground"
          >
            Попробовать снова
          </button>
          <a href="/" className="inline-flex items-center justify-center rounded-xl border border-gold px-6 py-3 text-sm uppercase tracking-[0.2em]">
            Домой
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Qi & Code — Китайская метафизика онлайн" },
      { name: "description", content: "Персональные онлайн-консультации по китайской метафизике: личность, карьера, финансы, отношения, здоровье." },
      { property: "og:title", content: "Qi & Code — Китайская метафизика онлайн" },
      { property: "og:description", content: "Персональные онлайн-консультации по китайской метафизике: личность, карьера, финансы, отношения, здоровье." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Qi & Code — Китайская метафизика онлайн" },
      { name: "twitter:description", content: "Персональные онлайн-консультации по китайской метафизике: личность, карьера, финансы, отношения, здоровье." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/07bc33ad-9483-4b42-aa95-7508f9ae2ae0" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/07bc33ad-9483-4b42-aa95-7508f9ae2ae0" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Karla:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hideBot = pathname.startsWith("/admin") || pathname.startsWith("/auth") || pathname.startsWith("/reset-password");
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1"><Outlet /></main>
        <SiteFooter />
      </div>
      <Toaster theme="dark" />
      {!hideBot && <ChatBotWidget />}
    </QueryClientProvider>
  );
}
