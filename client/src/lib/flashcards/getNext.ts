import { db } from "@/lib/database";
import type { FlashcardMode } from "./scoring";

type FlashcardData =
  | {
      mode: "multiple";
      id: number;
      image: string;
      options: string[];
    }
  | {
      mode: "type";
      id: number;
      image: string;
    }
  | {
      mode: "reverse";
      id: number;
      name: string;
      imageOptions: { id: number; image: string }[];
    };

type Res =
  | { status: "done"; flashcard: null }
  | { status: "playing"; flashcard: FlashcardData };

interface Props {
  groups?: number[];
  tracking?: boolean;
  mode?: FlashcardMode;
}

export const getNextFlashcard = async ({
  groups,
  tracking,
  mode = "multiple",
}: Props = {}): Promise<Res> => {
  const student = tracking
    ? await db.students.getNextReview(groups)
    : await db.students.getRandom(groups);

  if (!student || !student.image) {
    return { status: "done", flashcard: null };
  }

  if (mode === "type") {
    return {
      status: "playing",
      flashcard: {
        mode: "type",
        id: student.id,
        image: student.image,
      },
    };
  }

  if (mode === "reverse") {
    const distractors = await db.students.getDistractors({
      studentId: student.id,
      count: 3,
    });

    const correctOption = { id: student.id, image: student.image };
    const distractorOptions = distractors.map((d) => ({
      id: d.id,
      image: d.image,
    }));

    const imageOptions = [correctOption, ...distractorOptions]
      .filter((o) => o.image)
      .sort(() => Math.random() - 0.5);

    return {
      status: "playing",
      flashcard: {
        mode: "reverse",
        id: student.id,
        name: `${student.name} ${student.lastName}`,
        imageOptions,
      },
    };
  }

  // Default: multiple
  const distractors = await db.students.getDistractors({
    studentId: student.id,
    count: 3,
  });

  const correctName = `${student.name} ${student.lastName}`;
  const distractorsNames = distractors.map((r) => r.fullName as string);
  const options = [correctName, ...distractorsNames].sort(
    () => Math.random() - 0.5,
  );

  return {
    status: "playing",
    flashcard: {
      mode: "multiple",
      id: student.id,
      image: student.image,
      options,
    },
  };
};
