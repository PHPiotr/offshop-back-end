module.exports = s3 => (file, key, acl = 'public-read') => {
    return new Promise((resolve, reject) => {
        return s3.upload({
            Body: file,
            Key: key,
            ACL: acl,
        }, function (err, data) {
            if (err) {
                return reject(err);
            }
            return resolve(data);
        });
    });
};
