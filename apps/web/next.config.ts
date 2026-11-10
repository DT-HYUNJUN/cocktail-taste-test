import path from "node:path";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
};

export default withSentryConfig(nextConfig, {
  silent: true,
  buildTimeInstrumentation: false,
  sourcemaps: {
    disable: true,
  },
});
