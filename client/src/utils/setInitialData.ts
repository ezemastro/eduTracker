import { db } from "@/lib/database";
import { initialData } from "data/intialData";

export const setInitialData = async () => {
  Object.entries(initialData).forEach(([groupName, students]) => {
    const year = parseInt(groupName[0]);
    const letter = groupName[1];
    db.groups.create(year, letter).then((id) => {
      students.forEach((student) => {
        db.students.create({
          name: student.name,
          lastName: student.lastName,
          image: student.image,
          group_id: id,
        });
      });
    });
  });
};
