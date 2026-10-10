"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type CourseCardProps = {
  title: string;
  id: string;
  imageSrc: string;
  onClick: (id: string) => void;
  disabled?: boolean;
  active?: boolean;
};

export const CourseCard = ({
  title,
  id,
  imageSrc,
  onClick,
  disabled,
  active,
}: CourseCardProps) => {
  return (
    <button
      onClick={() => onClick(id)}
      disabled={disabled}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl p-3 transition hover:bg-slate-100",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center rounded-2xl border-2 p-2",
          active ? "border-b-[5px] border-green-500" : "border-slate-200"
        )}
      >
        <Image
          src={imageSrc}
          alt={title}
          height={60}
          width={80}
          className="rounded-lg object-cover"
          draggable={false}
        />
        {active && (
          <div className="absolute right-1 top-1 rounded-full bg-green-500 p-0.5">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
      <p className="mt-2 text-center font-bold text-neutral-600">{title}</p>
    </button>
  );
};
