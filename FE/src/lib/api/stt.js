import { api } from "../../api/api";

export async function sttRecognizeBlob(
  blob,
  {
    expectedText,
    languageCode = "en",
    endpoint = "/speech/pron/up/",
    fieldName = "audio",
    extraFields = {},
  }
) {
  if (!expectedText || !expectedText.trim()) {
    throw new Error("expectedText is required for pronunciation scoring");
  }

  const fd = new FormData();
  fd.append(fieldName, blob, "record.webm");
  fd.append("language_code", languageCode);
  fd.append("expected_text", expectedText.trim());

  for (const [k, v] of Object.entries(extraFields)) {
    fd.append(k, v);
  }

  const resp = await api.post(endpoint, fd);
  return resp.data;
}
