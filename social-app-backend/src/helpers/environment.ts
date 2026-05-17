export const getAsNumber = (key: string, defaultValue = NaN, env = process.env): number => {
  const value = Number(env[key]);

  return isNaN(value) ? defaultValue : value;
};

export const getAsBoolean = (key: string, env = process.env): boolean => {
  return env[key] === 'true';
};
