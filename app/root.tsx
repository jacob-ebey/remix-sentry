import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";

type LoaderData = {
  GLOBALS: string;
};
export const loader: LoaderFunction = () => {
  return {
    GLOBALS: JSON.stringify({
      SENTRY_DSN: process.env.SENTRY_DSN,
    }),
  };
};

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "New Remix App",
  viewport: "width=device-width,initial-scale=1",
});

export default function App() {
  const { GLOBALS } = useLoaderData() as LoaderData;
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/error">Error</Link>
          </li>
        </ul>
        <Outlet />
        <ScrollRestoration />
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `window.GLOBALS=${GLOBALS};`,
          }}
        />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
