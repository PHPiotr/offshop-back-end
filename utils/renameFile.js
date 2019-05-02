const fs = require('fs');

module.exports = (oldFile, newFile) => {
    return new Promise((resolve, reject) => {
        fs.rename(oldFile, newFile, err => {
            if (err) {
                return reject(err);
            } else {
                return resolve();
            }
        });
    });
};
