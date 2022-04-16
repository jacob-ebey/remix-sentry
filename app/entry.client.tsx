import { RemixBrowser } from "@remix-run/react";
import { hydrate } from "react-dom";
import * as Sentry from "@sentry/browser";
import { Integrations } from "@sentry/tracing";

declare global {
  interface Window {
    GLOBALS: Record<string, string | undefined>;
  }
}

Sentry.init({
  dsn: window.GLOBALS.SENTRY_DSN,
  tracesSampleRate: 1.0,
  integrations: [new Integrations.BrowserTracing()],
});

hydrate(<RemixBrowser />, document);
