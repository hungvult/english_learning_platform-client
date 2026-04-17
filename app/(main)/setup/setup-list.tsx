"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { CourseCard } from "@/components/course-card";

type CourseComp = {
  id: string;
  title: string;
  imageSrc: string;
};

type SetupListProps = {
  courses: CourseComp[];
};

export const SetupList = ({ courses }: SetupListProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onClick = (id: string) => {
    if (pending) return;

    startTransition(async () => {
      try {
        await api(`/api/v1/courses/select?course_id=${id}`, {
          method: "PATCH",
        });
        toast.success("Course selected");
        router.push("/learn");
        router.refresh();
      } catch (error) {
        toast.error("Something went wrong");
      }
    });
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          id={course.id}
          title={course.title}
          imageSrc={course.imageSrc}
          onClick={onClick}
          disabled={pending}
        />
      ))}
    </div>
  );
};
