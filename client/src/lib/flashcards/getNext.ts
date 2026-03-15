import { db } from "@/lib/database";
type Res =
  | { status: "done"; flashcard: null }
  | {
      status: "playing";
      flashcard: {
        id: number;
        image: string;
        options: string[];
      };
    };

interface Props {
  groups?: number[];
  tracking?: boolean;
}

export const getNextFlashcard = async ({
  groups,
  tracking,
}: Props = {}): Promise<Res> => {
  // Look for the next student to review
  const student = tracking
    ? await db.students.getNextReview(groups)
    : await db.students.getRandom(groups);

  // If nothing to review, return "done"
  if (!student) {
    return { status: "done", flashcard: null };
  }

  // Get distractors
  const distractors = await db.students.getDistractors({
    studentId: student.id,
    count: 3,
  });

  // Shuffle options
  const correctName = `${student.name} ${student.lastName}`;
  const distractorsNames = distractors.map((r) => r.fullName as string);
  const options = [correctName, ...distractorsNames].sort(
    () => Math.random() - 0.5,
  );

  return {
    status: "playing",
    flashcard: {
      id: student.id,
      // We know it has image because getNextReview filters those without image
      image: student.image!,
      options: options,
    },
  };
};
