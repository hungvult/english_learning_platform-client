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
        "flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer hover:bg-slate-100 transition",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center p-2 rounded-2xl border-2",
          active ? "border-green-500 border-b-[5px]" : "border-slate-200"
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
           <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5">
              <Check className="h-3 w-3 text-white" />
           </div>
        )}
      </div>
      <p className="mt-2 text-center font-bold text-neutral-600">
        {title}
      </p>
    </button>
  );
};
