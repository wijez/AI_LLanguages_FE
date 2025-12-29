import { api } from "../../api/api";


export function audioKeyToUrl(key) {
  if (!key) return "";
  if (key.startsWith("http")) return key;
  const trimmed = key.replace(/^\/+/, "");
  const withoutMedia = trimmed.replace(/^media\//, "");
  return `${api.baseURL.replace(/\/+$/, "")}/media/${withoutMedia}`;
}

export const roleLabel = {
  teacher: "Teacher",
  student_a: "Student A",
  student_b: "Student B",
  narrator: "Narrator",
  assistant: "Assistant",
};

export const clsx = (...xs) => xs.filter(Boolean).join(" ");

// blob → base64 (no data URL prefix)
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const dataUrl = reader.result || "";
        const base64 = String(dataUrl).split(",").pop() || "";
        resolve(base64);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const toFixed1 = (n) => {
  const x = typeof n === "number" ? n : Number(n);
  return Number.isFinite(x) ? x.toFixed(1) : "0.0";
};