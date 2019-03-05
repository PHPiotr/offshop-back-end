module.exports = value => {
    if (value === 0) {
        return '00.00';
    }
    return (value / 100).toFixed(2);
};
