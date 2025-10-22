const mergeObjects = (target, source, overwriteAt) => {
  if (!target || !source) {
    return target || source;
  }

  Object.keys(source).forEach(key => {
    if (key === overwriteAt) {
      // Overwrite the entire value at overwriteAt key with source's value
      target[key] = source[key];
    } else if (source[key] instanceof Object && target[key] instanceof Object) {
      mergeObjects(target[key], source[key], overwriteAt);
    } else {
      target[key] = source[key];
    }
  });

  return target;
}

 module.exports = { mergeObjects };

