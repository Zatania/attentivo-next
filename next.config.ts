import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: false
};


module.exports = {
  allowedDevOrigins: ['10.10.20.17'],
}

export default nextConfig;