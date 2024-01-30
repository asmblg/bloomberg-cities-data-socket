const mergeObjects = (target, source) => {
    // If either target or source is null, return the other
    if (!target || !source) {
      return target || source;
  }

  Object.keys(source).forEach(key => {
      if (target[key] === null) {
        target[key] = {};
      }
      if (source[key] instanceof Object && target[key] instanceof Object) {
          mergeObjects(target[key], source[key]);
      } else {
          target[key] = source[key];
      }
  });

  return target;
}

 module.exports = { mergeObjects };

