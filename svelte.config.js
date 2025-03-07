import adapter from "@sveltejs/adapter-auto";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    alias: {
      "@components": "src/components",
      "@stores": "src/stores.js",
      "@utils": "src/utils.js",
    },
  },
};

export default config;
