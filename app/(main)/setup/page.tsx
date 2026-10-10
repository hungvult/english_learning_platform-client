import { api } from "@/lib/api";
import { SetupList } from "./setup-list";

type UserCoursesResponse = {
  activeCourseId?: string;
  courses: {
    id: string;
    title: string;
    imageSrc: string;
  }[];
};

const SetupPage = async () => {
  let data: UserCoursesResponse = { courses: [] };

  try {
    data = await api<UserCoursesResponse>("/api/v1/courses/me");
  } catch (error) {
    console.error("Failed to fetch courses:", error);
  }

  return (
    <div className="mx-auto h-full max-w-[912px] px-3 pb-10">
      <h1 className="mt-10 text-center text-2xl font-bold text-neutral-700">
        Choose your active course
      </h1>
      <SetupList courses={data.courses} />
    </div>
  );
};

export default SetupPage;
