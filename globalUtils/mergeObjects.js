const { over } = require("lodash");

const mergeObjects = (target, source, overwriteAt) => {
  if (!target || !source) {
    return target || source;
  }

  Object.keys(source).forEach(key => {
    const overwriteArray = overwriteAt ? overwriteAt.split('.') : [];

    if (key === overwriteArray[0]) {
      const newOverwriteAt = overwriteArray.slice(1).join('.');
      // If we've reached the end of the overwrite path, overwrite the entire value
      if (!newOverwriteAt) {
        target[key] = source[key];
      } else {
        // Otherwise, continue traversing down the path
        if (!target[key]) {
          target[key] = {};
        }
        mergeObjects(target[key], source[key], newOverwriteAt);
      }
    } else if (source[key] instanceof Object && target[key] instanceof Object) {
      mergeObjects(target[key], source[key], overwriteAt);
    } else {
      target[key] = source[key];
    }
  });

  return target;
}

 module.exports = { mergeObjects };

