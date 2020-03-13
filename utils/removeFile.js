const fs = require('fs');

module.exports = (file) => {
    return new Promise((resolve, reject) => {
        return fs.access(file, fs.constants.F_OK, (err) => {
            if (err) {
                return resolve();
            }
            return fs.unlink(file, (err) => {
                if (err) {
                    return reject(err);
                }
                return resolve(file);
            });
        });
    });
};