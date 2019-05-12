module.exports = s3 => (keys) => {
    return new Promise((resolve, reject) => {
        return s3.deleteObjects({
            Delete: {
                Objects: keys.map(Key => ({Key})),
            }
        }, function (err, data) {
            if (err) {
                return reject(err);
            }
            return resolve(data);
        });
    });
};
