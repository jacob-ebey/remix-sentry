const Sentry = require("@sentry/node");
let { isResponse } = require("@remix-run/server-runtime/responses");
const { v4: uuid } = require("uuid");

/**
 *
 * @param {(...args: unknown[]) => unknown} func
 * @param {string} routeId
 * @param {string} method
 */
function wrapDataFunc(func, routeId, method) {
  const ogFunc = func;

  return async (...args) => {
    /** @type {import("@sentry/types").Transaction | undefined} */
    const parentTransaction =
      args[0].context && args[0].context.__sentry_transaction;
    const transaction =
      parentTransaction &&
      parentTransaction.startChild({
        op: `${method}:${routeId}`,
        description: `${method}: ${routeId}`,
      });
    transaction && transaction.setStatus("ok");
    transaction && (transaction.transaction = parentTransaction);

    try {
      return await ogFunc(...args);
    } catch (error) {
      if (isResponse(error)) {
        throw error;
      }

      Sentry.captureException(error, {
        tags: {
          global_id: parentTransaction && parentTransaction.tags["global_id"],
        },
      });
      transaction.setStatus("internal_error");
      throw error;
    } finally {
      transaction && transaction.finish();
    }
  };
}

/**
 * Register Sentry across your entire remix build.
 * @param {import("@remix-run/node").ServerBuild} build
 */
function registerSentry(build) {
  /** @type {Record<string, build["routes"][string]>} */
  let routes = {};

  for (let [id, route] of Object.entries(build.routes)) {
    /** @type {build["routes"][string]} */
    let newRoute = { ...route, module: { ...route.module } };

    if (route.module.action) {
      newRoute.module.action = wrapDataFunc(route.module.action, id, "action");
    }

    if (route.module.loader) {
      newRoute.module.loader = wrapDataFunc(route.module.loader, id, "loader");
    }

    routes[id] = newRoute;
  }

  return {
    ...build,
    routes,
  };
}

/**
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns
 */
function sentryLoadContext(req, res) {
  const transaction = Sentry.getCurrentHub().startTransaction({
    op: "request",
    name: `${req.method}: ${req.url}`,
    description: `${req.method}: ${req.url}`,
    metadata: {
      requestPath: req.url,
    },
    tags: {
      global_id: uuid(),
    },
  });
  transaction && transaction.setStatus("internal_error");

  res.once("finish", () => {
    if (transaction) {
      transaction.setHttpStatus(res.statusCode);
      transaction.setTag("http.status_code", res.statusCode);
      transaction.setTag("http.method", req.method);
      transaction.finish();
    }
  });

  return {
    __sentry_transaction: transaction,
  };
}

exports.registerSentry = registerSentry;
exports.sentryLoadContext = sentryLoadContext;
