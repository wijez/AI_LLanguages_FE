// i18n helpers
function getL1() {
  try {
    return (
      localStorage.getItem("lang") || localStorage.getItem("lang") || "vi"
    );
  } catch {
    return "vi";
  }
}
function tI18n(obj, fallback) {
  const l1 = getL1();
  return (obj && obj[l1]) || fallback || "";
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Trả mảng các "steps" cho 1 skill theo schema model hiện tại.
 * - Quiz: lấy question_text_i18n || question_text + choices
 * - Matching: hiển thị câu hỏi bằng left_text_i18n || left_text
 * - Pron/Speaking: thêm ttsSample để FE phát mẫu; câu trả lời vẫn để server chấm
 * - Fillgap/Reading/Writing/Listening/Ordering: đúng như bạn mô tả
 */
export function normalizeSkill(skill) {
  const t = skill?.type;

  switch (t) {
    case "quiz":
      return (skill.quiz_questions || []).map((q) => ({
        id: q.id,
        type: "quiz",
        question: tI18n(q.question_text_i18n, q.question_text),
        choices: (q.choices || []).map(c => ({ id: c.id, text: c.text })),
        __skill: skill,
      }));

    case "matching": {
      const pairs = skill.matching_pairs || [];
      const allRights = pairs.map(p => p.right_text);
      return pairs.map((p) => {
        const leftL1 = p.left_text_i18n ? (p.left_text_i18n[getL1()] || p.left_text || "") : (p.left_text || "");
        const distractors = shuffle(allRights.filter(r => r !== p.right_text)).slice(0, Math.min(3, Math.max(1, allRights.length - 1)));
        const rightChoices = shuffle([p.right_text, ...distractors]); 
        return {
          id: p.id,
          type: "matching",
          question: leftL1,           
          choices: rightChoices,        
          answer: p.right_text,       
          __skill: skill,
        };
      });
    }
    case "speaking":
      return (skill.speaking_prompts || []).map((p) => ({
        id: p.id,
        type: "speaking",
        question: `Nói lại: ${p.text}${p.tip ? ` — ${p.tip}` : ""}`,
        ttsSample: p.target,
        answer: p.target,
        __skill: skill,
      }));

    case "pron":
      return (skill.pronunciation_prompts || []).map((p) => ({
        id: p.id,
        type: "pron",
        question: `Phát âm: ${p.word}${p.phonemes ? ` (${p.phonemes})` : ""}`,
        ttsSample: p.answer || p.word,
        answer: p.answer || p.word,
        __skill: skill,
      }));

    case "fillgap":
      return (skill.fillgaps || []).map((g) => ({
        id: g.id,
        type: "fillgap",
        question: g.text,
        choices: null,
        answer: g.answer ?? "",
        __skill: skill,
      }));

    // case "reading":
    //   return (skill.reading_questions || []).map((q) => ({
    //     id: q.id,
    //     type: "reading",
    //     question: q.question_text,
    //     choices: null,
    //     answer: q.answer ?? "",
    //     __skill: skill,
    //   }));

    case "reading": {
      const passage = skill?.reading_content?.passage_i18n
        ? skill.reading_content.passage_i18n[getL1()] ||
          skill.reading_content.passage ||
          ""
        : skill?.reading_content?.passage || "";

      return (skill.reading_questions || []).map((q) => {
        const question = q?.question_text_i18n
          ? q.question_text_i18n[getL1()] || q.question_text || ""
          : q.question_text || "";
        const answer = String(q?.answer || "").trim();

        const answerTokens = answer.split(/\s+/).filter(Boolean);
        const tokens = shuffle(answerTokens);

        return {
          id: q.id,
          type: "reading",
          passage: passage,
          question,
          answer,
          tokens,
          answerTokens,
          __skill: {
            ...skill,
            reading_content: skill.reading_content ?? null,
          },
        };
      });
    }

    case "writing":
      return (skill.writing_questions || []).map((q) => ({
        id: q.id,
        type: "writing",
        question: q.prompt,
        choices: null,
        answer: q.answer ?? "",
        __skill: skill,
      }));

    case "listening":
      return (skill.listening_prompts || []).map((p) => ({
        id: p.id,
        type: "listening",
        question: p.question_text || "Bạn nghe thấy gì?",
        audio: p.audio_url || "",
        choices: null,
        answer: p.answer ?? "",
        __skill: skill,
      }));

    case "ordering": {
      const items = skill.ordering_items || [];
      const answerArr = [...items]
        .sort((a, b) => a.order_index - b.order_index)
        .map((it) => it.text);
      const tokens = shuffle(items.map((it) => it.text));
      return answerArr.length
        ? [
            {
              id: `ordering:${skill.id}`,
              type: "ordering",
              question: "Sắp xếp các từ thành câu đúng",
              tokens,
              answer: answerArr,
              __skill: skill,
            },
          ]
        : [];
    }

    default:
      return [];
  }
}
