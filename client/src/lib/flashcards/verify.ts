import { db } from "../database";

export const verifyFlashcard = async ({
  studentId,
  selectedName,
}: {
  studentId: number;
  selectedName: string;
}) => {
  const student = await db.students.getById(studentId);
  const correctName = `${student.name} ${student.lastName}`;
  const isCorrect = correctName === selectedName;

  return {
    isCorrect,
    correctName,
  };
};
