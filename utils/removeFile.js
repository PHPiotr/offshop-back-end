module.exports = fs => async file => {
    try {
        await fs.unlink(file);
    } catch {}
};
