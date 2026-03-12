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

export const getNextFlashcard = async (): Promise<Res> => {
  // Look for the next student to review
  const student = await db.students.getNextReview();

  // If nothing to review, return "done"
  if (!student) {
    return { status: "done", flashcard: null };
  }

  // Get distractors
  const distractors = await db.students.getDistractors({
    studentId: student.id,
    groupId: student.group_id,
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
