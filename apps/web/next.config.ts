import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent webpack/turbopack from bundling Transformers.js and its ONNX runtime.
  // These packages ship native binaries and WASM assets that must be resolved at
  // runtime by Node.js, not at build time by the bundler.
  serverExternalPackages: [
    "@huggingface/transformers",
    "onnxruntime-node",
    "onnxruntime-web",
  ],
};

export default nextConfig;
