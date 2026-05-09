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
  unusedInputWords: string[];
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

  // One starts with the other → very strong signal (e.g. benja ~ benjamin)
  if (na.startsWith(nb) || nb.startsWith(na)) {
    return 0.8 + 0.2 * (Math.min(na.length, nb.length) / Math.max(na.length, nb.length));
  }

  const lcs = lcsLength(na, nb);
  return lcs / Math.max(na.length, nb.length);
}

const WEIGHTS: Record<WordCategory, number> = {
  firstName: 0.35,
  middleName: 0.10,
  firstLastName: 0.35,
  secondLastName: 0.10,
};

interface CorrectWord {
  word: string;
  category: WordCategory;
}

function globalBestMatch(
  inputWords: string[],
  correctWords: CorrectWord[],
): { details: WordDetail[]; unusedInputWords: string[] } {
  // Build all pairs sorted by similarity descending
  const pairs: { i: number; j: number; sim: number }[] = [];
  for (let i = 0; i < inputWords.length; i++) {
    for (let j = 0; j < correctWords.length; j++) {
      pairs.push({
        i,
        j,
        sim: wordSimilarity(inputWords[i], correctWords[j].word),
      });
    }
  }
  pairs.sort((a, b) => b.sim - a.sim);

  const usedInput = new Set<number>();
  const usedCorrect = new Set<number>();
  const assignments = new Map<number, number>(); // correct index -> input index

  for (const p of pairs) {
    if (usedInput.has(p.i) || usedCorrect.has(p.j)) continue;
    usedInput.add(p.i);
    usedCorrect.add(p.j);
    assignments.set(p.j, p.i);
  }

  const details = correctWords.map((cw, j) => {
    const inputIdx = assignments.get(j);
    if (inputIdx !== undefined) {
      return {
        word: cw.word,
        category: cw.category,
        similarity: pairs.find((p) => p.i === inputIdx && p.j === j)!.sim,
        inputWord: inputWords[inputIdx],
      };
    }
    return {
      word: cw.word,
      category: cw.category,
      similarity: 0,
      inputWord: "",
    };
  });

  const unusedInputWords = inputWords.filter((_, i) => !usedInput.has(i));

  return { details, unusedInputWords };
}

export function calculateNameScore(
  input: string,
  correctName: string,
  correctLastName: string,
): ScoreResult {
  const inputWords = toWords(input);
  const nameWords = toWords(correctName);
  const lastWords = toWords(correctLastName);

  const correctWords: CorrectWord[] = [];
  if (nameWords.length > 0) {
    correctWords.push({ word: nameWords[0], category: "firstName" });
  }
  for (let k = 1; k < nameWords.length; k++) {
    correctWords.push({ word: nameWords[k], category: "middleName" });
  }
  if (lastWords.length > 0) {
    correctWords.push({ word: lastWords[0], category: "firstLastName" });
  }
  for (let k = 1; k < lastWords.length; k++) {
    correctWords.push({ word: lastWords[k], category: "secondLastName" });
  }

  const { details, unusedInputWords } = globalBestMatch(inputWords, correctWords);

  let score = 0;
  let totalWeight = 0;
  const grouped: Partial<Record<WordCategory, WordDetail[]>> = {};
  for (const d of details) {
    if (!grouped[d.category]) grouped[d.category] = [];
    grouped[d.category]!.push(d);
  }

  for (const cat of [
    "firstName",
    "middleName",
    "firstLastName",
    "secondLastName",
  ] as WordCategory[]) {
    const words = grouped[cat];
    if (!words || words.length === 0) continue;
    const totalSim = words.reduce((sum, w) => sum + w.similarity, 0);
    const ratio = totalSim / words.length;
    score += WEIGHTS[cat] * ratio;
    totalWeight += WEIGHTS[cat];
  }

  if (totalWeight > 0) {
    score /= totalWeight;
  }

  score = Math.min(Math.max(score, 0), 1);

  return {
    score,
    quality: scoreToQuality(score),
    details,
    unusedInputWords,
  };
}

export function scoreToQuality(score: number): number {
  if (score >= 0.90) return 5;
  if (score >= 0.70) return 4;
  if (score >= 0.45) return 3;
  if (score >= 0.25) return 2;
  if (score >= 0.10) return 1;
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
