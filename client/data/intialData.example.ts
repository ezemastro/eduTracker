import type { Student } from "@/lib/database";
export type ShortStudent = Pick<
  Student,
  "name" | "lastName" | "image" | "gender"
>;
export const initialData: Record<string, ShortStudent[]> = {
  "1A": [
    {
      name: "John",
      lastName: "Doe",
      gender: "male",
      image: "https://randomuser.me/api/portraits/men/1.jpg",
    },
  ],
};
