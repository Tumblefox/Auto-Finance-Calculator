import * as esbuild from 'esbuild';

export default async function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    "src/css/**/*": "css",
    "src/image/**/*": "image",
    "src/fonts/**/*": "fonts",
    "src/js/**/*": "js",
  });

  eleventyConfig.on("eleventy.after", async () => {
    await esbuild.build({
      entryPoints: ["./src/js/main.js"],
      bundle: true,
      outfile: "./js/main.js",
      minify: true,
      sourcemap: true,
    });
  });

  return {
    dir: {
      input: "./src",
      output: "./"
    }
  }
};
