export function safeJson(value, fallback) {
  if (value && typeof value === "object") return value;
  try {
    return JSON.parse(value) || fallback;
  } catch {
    return fallback;
  }
}

export function setIfPresent(target, key, value) {
  if (value !== undefined) {
    target[key] = value;
  }
}

export const isObject = (item) => item && typeof item === "object" && !Array.isArray(item);

export const mergeDeep = (target, source) => {
  let output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) Object.assign(output, { [key]: source[key] });
        else output[key] = mergeDeep(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
};
