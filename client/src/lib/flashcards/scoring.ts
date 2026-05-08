export type FlashcardMode = "multiple" | "type" | "reverse";

export type WordCategory =
  | "firstName"
  | "middleName"
  | "firstLastName"
  | "secondLastName";

export interface WordDetail {
  word: string; // palabra correcta
  category: WordCategory;
  similarity: number; // 0 - 1
  inputWord: string; // palabra del input más cercana (puede ser distinta)
}

export interface ScoreResult {
  score: number; // 0 - 1
  quality: number; // 0 - 5 (SM-2)
  details: WordDetail[];
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function toWords(str: string): string[] {
  return normalize(str)
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

function lcsLength(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  // Use two rows to save memory
  let prev = Array(n + 1).fill(0);
  let curr = Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1] + 1;
      } else {
        curr[j] = Math.max(prev[j], curr[j - 1]);
      }
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** 0..1 similarity based on longest common subsequence */
function wordSimilarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.length === 0 || nb.length === 0) return 0;

  // One starts with the other → strong signal (e.g. benja ~ benjamin)
  if (na.startsWith(nb) || nb.startsWith(na)) {
    return Math.min(na.length, nb.length) / Math.max(na.length, nb.length);
  }

  const lcs = lcsLength(na, nb);
  return lcs / Math.max(na.length, nb.length);
}

const WEIGHTS: Record<WordCategory, number> = {
  firstName: 0.50,
  middleName: 0.10,
  firstLastName: 0.25,
  secondLastName: 0.15,
};

function bestMatch(
  target: string,
  inputWords: string[],
): { similarity: number; inputWord: string } {
  let bestSim = 0;
  let bestWord = "";
  for (const iw of inputWords) {
    const sim = wordSimilarity(target, iw);
    if (sim > bestSim) {
      bestSim = sim;
      bestWord = iw;
    }
  }
  return { similarity: bestSim, inputWord: bestWord };
}

export function calculateNameScore(
  input: string,
  correctName: string,
  correctLastName: string,
): ScoreResult {
  const inputWords = toWords(input);
  const nameWords = toWords(correctName);
  const lastWords = toWords(correctLastName);

  const details: WordDetail[] = [];
  let score = 0;

  // --- First name (first word of name) ---
  if (nameWords.length > 0) {
    const w = nameWords[0];
    const { similarity, inputWord } = bestMatch(w, inputWords);
    score += WEIGHTS.firstName * similarity;
    details.push({ word: w, category: "firstName", similarity, inputWord });
  }

  // --- Middle name(s) (remaining words of name) ---
  if (nameWords.length > 1) {
    const middle = nameWords.slice(1);
    let totalSim = 0;
    for (const w of middle) {
      const { similarity, inputWord } = bestMatch(w, inputWords);
      totalSim += similarity;
      details.push({
        word: w,
        category: "middleName",
        similarity,
        inputWord,
      });
    }
    const ratio = middle.length > 0 ? totalSim / middle.length : 0;
    score += WEIGHTS.middleName * ratio;
  }

  // --- First last name (first word of lastName) ---
  if (lastWords.length > 0) {
    const w = lastWords[0];
    const { similarity, inputWord } = bestMatch(w, inputWords);
    score += WEIGHTS.firstLastName * similarity;
    details.push({ word: w, category: "firstLastName", similarity, inputWord });
  }

  // --- Second last name(s) (remaining words of lastName) ---
  if (lastWords.length > 1) {
    const second = lastWords.slice(1);
    let totalSim = 0;
    for (const w of second) {
      const { similarity, inputWord } = bestMatch(w, inputWords);
      totalSim += similarity;
      details.push({
        word: w,
        category: "secondLastName",
        similarity,
        inputWord,
      });
    }
    const ratio = second.length > 0 ? totalSim / second.length : 0;
    score += WEIGHTS.secondLastName * ratio;
  }

  score = Math.min(score, 1);

  return {
    score,
    quality: scoreToQuality(score),
    details,
  };
}

export function scoreToQuality(score: number): number {
  if (score >= 0.95) return 5;
  if (score >= 0.8) return 4;
  if (score >= 0.6) return 3;
  if (score >= 0.4) return 2;
  if (score >= 0.2) return 1;
  return 0;
}

export function difficultyToQuality(
  difficulty: "easy" | "medium" | "hard",
): number {
  switch (difficulty) {
    case "easy":
      return 5;
    case "medium":
      return 3;
    case "hard":
      return 1;
  }
}

export function categoryLabel(cat: WordCategory): string {
  switch (cat) {
    case "firstName":
      return "Primer nombre";
    case "middleName":
      return "Segundo nombre";
    case "firstLastName":
      return "Primer apellido";
    case "secondLastName":
      return "Segundo apellido";
  }
}
