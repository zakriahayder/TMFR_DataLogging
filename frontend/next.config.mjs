import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: currentDirectory,
  },
};

export default nextConfig;
