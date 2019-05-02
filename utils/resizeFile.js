const sharp = require('sharp');
module.exports = (buffer, dimensions, toFile) => sharp(buffer).resize(dimensions).toFile(toFile);
