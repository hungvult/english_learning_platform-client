import { api } from "@/lib/api";
import { CoursesList } from "@/components/courses-list";

type UserCoursesResponse = {
  activeCourseId?: string;
  courses: {
    id: string;
    title: string;
    imageSrc: string;
  }[];
};

const CoursesPage = async () => {
  let data: UserCoursesResponse = { courses: [] };

  try {
    data = await api<UserCoursesResponse>("/api/v1/courses/me");
  } catch (error) {
    console.error("Failed to fetch courses:", error);
  }

  return (
    <div className="h-full">
      <CoursesList
        courses={data.courses}
        activeCourseId={data.activeCourseId}
      />
    </div>
  );
};

export default CoursesPage;
