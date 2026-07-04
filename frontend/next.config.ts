/** @type {import('next').NextConfig} */
const nextConfig = {
  // Type errors now fail the build (as they should). The old
  // `typescript.ignoreBuildErrors` escape hatch was removed once the
  // outstanding framer-motion `Variants` type errors were fixed.
};

export default nextConfig;
