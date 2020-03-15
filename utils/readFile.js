module.exports = fs => async file => {
    const data = await fs.readFile(file);
    return Buffer.from(data);
};
