// /lib/api/stt.js
import { api } from "../../api/api";

/**
 * Gửi blob audio lên STT endpoint, trả về transcript (string).
 * @param {Blob} blob - audio (webm/ogg/wav)
 * @param {Object} opts
 * @param {string} opts.languageCode - 'en' | 'vi' | ...
 * @param {string} opts.endpoint - default '/api/speech/pron/up/'
 * @param {string} opts.fieldName - default 'audio'
 * @param {Object} opts.extraFields - key/value bổ sung (vd: expected_text)
 */
export async function sttRecognizeBlob(
  blob,
  {
    languageCode = "en",
    endpoint = "/speech/pron/up/",
    fieldName = "audio",
    extraFields = {},
  } = {}
) {
  const fd = new FormData();
  fd.append(fieldName, blob, "record.webm");
  fd.append("language_code", languageCode);
  for (const [k, v] of Object.entries(extraFields)) fd.append(k, v);

  // ĐỂ Axios tự set Content-Type (kèm boundary)
  const resp = await api.post(endpoint, fd);
  const data = resp?.data || resp;
  return data?.text || data?.transcript || data?.result?.text || "";
}
