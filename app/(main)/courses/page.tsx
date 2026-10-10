import { api } from "@/lib/api";
import { CoursesList } from "@/components/courses-list";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getLocaleFromCourse, getTranslations } from "@/lib/i18n";

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

  const activeTitle = data.activeCourseId
    ? data.courses.find((c) => c.id === data.activeCourseId)?.title
    : undefined;
  const t = getTranslations(getLocaleFromCourse(activeTitle));

  return (
    <div className="mx-auto h-full max-w-[912px] pb-10">
      <div className="px-3 pt-6">
        <Button variant="ghost" asChild>
          <Link href="/learn">
            <ArrowLeft className="mr-2 h-5 w-5" />
            {t.returnToLearn}
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
