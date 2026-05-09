import { db } from "../database";
import { calculateNameScore, type FlashcardMode, type WordDetail } from "./scoring";

interface VerifyInput {
  studentId: number;
  mode: FlashcardMode;
  selectedName?: string;
  typedName?: string;
  selectedId?: number;
}

interface MultipleVerifyResult {
  isCorrect: boolean;
  correctName: string;
}

interface TypeVerifyResult {
  score: number;
  quality: number;
  correctName: string;
  correctLastName: string;
  details: WordDetail[];
  unusedInputWords: string[];
}

interface ReverseVerifyResult {
  isCorrect: boolean;
  correctId: number;
}

export type VerifyResult =
  | { mode: "multiple"; result: MultipleVerifyResult }
  | { mode: "type"; result: TypeVerifyResult }
  | { mode: "reverse"; result: ReverseVerifyResult };

export const verifyFlashcard = async ({
  studentId,
  mode,
  selectedName,
  typedName,
  selectedId,
}: VerifyInput): Promise<VerifyResult> => {
  const student = await db.students.getById(studentId);

  if (mode === "multiple") {
    const correctName = `${student.name} ${student.lastName}`;
    const isCorrect = correctName === selectedName;
    return { mode: "multiple", result: { isCorrect, correctName } };
  }

  if (mode === "type") {
    const input = typedName || "";
    const scoreResult = calculateNameScore(
      input,
      student.name,
      student.lastName,
    );
    return {
      mode: "type",
      result: {
        score: scoreResult.score,
        quality: scoreResult.quality,
        correctName: student.name,
        correctLastName: student.lastName,
        details: scoreResult.details,
        unusedInputWords: scoreResult.unusedInputWords,
      },
    };
  }

  if (mode === "reverse") {
    const isCorrect = student.id === selectedId;
    return { mode: "reverse", result: { isCorrect, correctId: student.id } };
  }

  throw new Error("Invalid mode");
};
