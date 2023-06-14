module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({"src/js/**/*": "js"});
  eleventyConfig.addPassthroughCopy({"src/css/**/*": "css"});
  eleventyConfig.addPassthroughCopy({"src/image/**/*": "image"});

  return {
    dir: {
      input: "src/html",
      // output: "./"
    }
  }
};
