const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");
const express = require("express");
const { createRequestHandler } = require("@remix-run/express");

const { registerSentry, sentryLoadContext } = require("./sentry-remix-node");

const buildPath = "../build/index.js";
const mode =
  process.env.NODE_ENV === "development" ? "development" : "production";

function loadBuild() {
  let build = require(buildPath);
  build = registerSentry(build);
  return build;
}

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

const app = express();

app.use(
  "/build",
  express.static("public/build", { immutable: true, maxAge: "1y" })
);

app.use(express.static("public", { maxAge: "1h" }));

app.all(
  "*",
  mode === "production"
    ? createRequestHandler({
        build: loadBuild(),
        mode,
        getLoadContext: sentryLoadContext,
      })
    : async (req, res, next) => {
        try {
          purgeRequireCache(buildPath);
          return createRequestHandler({
            build: loadBuild(),
            mode,
            getLoadContext: sentryLoadContext,
          })(req, res, next);
        } catch (err) {
          next(err);
        }
      }
);

app.listen(process.env.PORT || 3000, () => {
  console.log(
    `Listening on http://localhost:${process.env.PORT || 3000} in ${mode} mode`
  );
});

function purgeRequireCache(file) {
  let resolved = require.resolve(file);
  for (let key in require.cache) {
    if (key.startsWith(resolved)) {
      delete require.cache[key];
    }
  }
}
