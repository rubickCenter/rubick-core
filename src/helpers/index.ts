import fs from 'fs';

function existOrNot(path: string) {
  return new Promise((resolve) => {
    fs.stat(path, async (err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

module.exports = {
  existOrNot
}
