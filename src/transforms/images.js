const path = require("path");
const Image = require("@11ty/eleventy-img");


  


module.exports = (value, outputPath) => {
	await Image("./test/bio-2017.jpg", {
    widths: [300],
    formats: [null],
    filenameFormat: function (id, src, width, format, options) {
      const extension = path.extname(src);
      const name = path.basename(src, extension);
  
      return `${name}-${width}w.${format}`;
    }
});
};
