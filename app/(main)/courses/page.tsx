import { api } from "@/lib/api";
import { CoursesList } from "@/components/courses-list";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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
    <div className="h-full max-w-[912px] mx-auto pb-10">
      <div className="pt-6 px-3">
        <Button variant="ghost" asChild>
          <Link href="/learn">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Return to Learn
          </Link>
        </Button>
      </div>
      <CoursesList
        courses={data.courses}
        activeCourseId={data.activeCourseId}
      />
    </div>
  );
};

export default CoursesPage;
