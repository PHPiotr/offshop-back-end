const fs = require('fs');

module.exports = (file) => {
    return new Promise((resolve, reject) => {
        return fs.unlink(file, (err) => {
            if (err) {
                return reject(err);
            }
            return resolve(file);
        });
    });
};