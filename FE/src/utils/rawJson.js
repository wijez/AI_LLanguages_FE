export const rawJson = (data) => {
  try { return JSON.stringify(data, null, 2); }
  catch { return String(data); }
};