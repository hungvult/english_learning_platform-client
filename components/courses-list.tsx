"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { CourseCard } from "@/components/course-card";
import { useLocale } from "@/components/locale-provider";

type CourseComp = {
  id: string;
  title: string;
  imageSrc: string;
};

type CoursesListProps = {
  courses: CourseComp[];
  activeCourseId?: string;
};

export const CoursesList = ({ courses, activeCourseId }: CoursesListProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { t } = useLocale();

  const onClick = (id: string) => {
    if (pending) return;

    if (id === activeCourseId) {
      return router.push("/learn");
    }

    startTransition(async () => {
      try {
        await api(`/api/v1/courses/select?course_id=${id}`, {
          method: "PATCH",
        });
        toast.success(t.courseSelected);
        router.push("/learn");
        router.refresh();
      } catch (error) {
        toast.error(t.somethingWentWrong);
      }
    });
  };

  const currentlyLearning = courses.filter((c) => c.id === activeCourseId);
  const otherCourses = courses.filter((c) => c.id !== activeCourseId);

  return (
    <div className="max-w-[912px] px-3 mx-auto pb-10">
      {currentlyLearning.length > 0 && (
        <section className="mt-10">
          <h1 className="text-2xl font-bold text-neutral-700">
            {t.currentlyLearning}
          </h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
            {currentlyLearning.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                imageSrc={course.imageSrc}
                onClick={onClick}
                active={true}
                disabled={pending}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h1 className="text-2xl font-bold text-neutral-700">
          {t.continueLearning}
        </h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
          {otherCourses.map((course) => (
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
      </section>

      <section className="mt-10">
        <h1 className="text-2xl font-bold text-neutral-700">
          {t.addCourse}
        </h1>
        {/* For now, just showing all courses. In a real app we might distinguish available from joined. */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
           {/* Mocking some samples to match the screenshot if needed, or just relying on real data. */}
           {otherCourses.length === 0 && (
             <p className="text-neutral-500 italic">{t.noOtherCourses}</p>
           )}
        </div>
      </section>
    </div>
  );
};
