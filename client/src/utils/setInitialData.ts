import { db } from "@/lib/database";

export const setInitialData = async () => {
  try {
    const { initialData } = await import("../../data/intialData");

    Object.entries(initialData).forEach(([groupName, students]) => {
      const year = parseInt(groupName[0]);
      const letter = groupName[1];
      db.groups.create(year, letter).then((id) => {
        students.forEach((student) => {
          db.students.create({
            name: student.name,
            lastName: student.lastName,
            gender: student.gender,
            image: student.image,
            group_id: id,
          });
        });
      });
    });
  } catch (error) {
    console.warn("No initial data in data/initialData.ts", error);
  }
};
