module.exports = sharp => (buffer, dimensions, toFile) => sharp(buffer).resize(dimensions).toFile(toFile);
