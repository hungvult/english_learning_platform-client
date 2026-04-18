"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { FeedWrapper } from "@/components/feed-wrapper";
import { UserProgress } from "@/components/user-progress";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLocale } from "@/components/locale-provider";
import { UserProfile, UserProgress as UserProgressType } from "@/types/api";

const ProfilePage = () => {
  const router = useRouter();
  const { t } = useLocale();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgressType | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    cefr_level: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, progressData] = await Promise.all([
          api<UserProfile>("/api/v1/users/me"),
          api<UserProgressType>("/api/v1/users/me/progress"),
        ]);
        setProfile(profileData);
        setUserProgress(progressData);
        setFormData({
          username: profileData.username,
          email: profileData.email,
          password: "",
          confirmPassword: "",
          cefr_level: profileData.cefr_level || "",
        });
      } catch (error) {
        toast.error(t.failedToLoadProfile);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error(t.passwordsDoNotMatch);
      return;
    }

    setUpdating(true);

    try {
      const payload: any = {
        username: formData.username,
        email: formData.email,
        cefr_level: formData.cefr_level || null,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const updatedProfile = await api<UserProfile>("/api/v1/users/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      setProfile(updatedProfile);
      setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      toast.success(t.profileUpdated);
    } catch (error: any) {
      toast.error(error.message || t.failedToUpdateProfile);
    } finally {
      setUpdating(false);
    }
  };

  const onLogout = async () => {
    try {
      await api("/api/v1/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
      toast.error(t.logoutFailed);
    }
  };

  if (loading) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <span className="text-muted-foreground">{t.loading}</span>
        </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row-reverse gap-[48px] px-6">
      <StickyWrapper>
        {userProgress && userProgress.activeCourse && (
            <UserProgress
                activeCourse={userProgress.activeCourse}
                hearts={userProgress.hearts}
                points={userProgress.points}
            />
        )}
      </StickyWrapper>

      <FeedWrapper>
        <div className="flex w-full flex-col gap-y-6">
          <div className="flex items-center gap-x-4">
            <Image
              src="/profile.svg"
              alt="Profile"
              height={80}
              width={80}
            />
            <div>
                <h1 className="text-2xl font-bold text-neutral-700">{t.settings}</h1>
                <p className="text-muted-foreground">{t.manageAccount}</p>
            </div>
          </div>

          <Separator />

          <form onSubmit={onUpdate} className="flex w-full flex-col gap-y-4">
            <div className="flex flex-col gap-y-2">
              <label className="text-sm font-bold text-neutral-600">{t.username}</label>
              <input
                className="rounded-xl border-2 border-b-4 bg-neutral-100 p-3 outline-none focus:border-green-600 active:border-b-2"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <label className="text-sm font-bold text-neutral-600">{t.email}</label>
              <input
                type="email"
                className="rounded-xl border-2 border-b-4 bg-neutral-100 p-3 outline-none focus:border-green-600 active:border-b-2"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="flex flex-col gap-y-2">
              <label className="text-sm font-bold text-neutral-600">{t.cefrLevel}</label>
              <select
                className="rounded-xl border-2 border-b-4 bg-neutral-100 p-3 outline-none focus:border-green-600 active:border-b-2"
                value={formData.cefr_level}
                onChange={(e) => setFormData({ ...formData, cefr_level: e.target.value })}
              >
                <option value="">{t.selectLevel}</option>
                <option value="A1">A1 - Junior</option>
                <option value="A2">A2 - Elementary</option>
                <option value="B1">B1 - Intermediate</option>
                <option value="B2">B2 - Upper Intermediate</option>
                <option value="C1">C1 - Advanced</option>
                <option value="C2">C2 - Native / Proficiency</option>
              </select>
            </div>

            <div className="flex flex-col gap-y-2">
                <label className="text-sm font-bold text-neutral-600">{t.newPassword}</label>
                <input
                    type="password"
                    autoComplete="new-password"
                    className="rounded-xl border-2 border-b-4 bg-neutral-100 p-3 outline-none focus:border-green-600 active:border-b-2"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
            </div>

            <div className="flex flex-col gap-y-2">
                <label className="text-sm font-bold text-neutral-600">{t.confirmPassword}</label>
                <input
                    type="password"
                    autoComplete="new-password"
                    className="rounded-xl border-2 border-b-4 bg-neutral-100 p-3 outline-none focus:border-green-600 active:border-b-2"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
            </div>

            <Button
                type="submit"
                disabled={updating}
                size="lg"
                className="w-full mt-4"
                variant="secondary"
            >
                {updating ? t.saving : t.saveChanges}
            </Button>

            <Separator className="my-4" />

            <Button
                type="button"
                onClick={onLogout}
                size="lg"
                variant="danger"
                className="w-full"
            >
                {t.signOut}
            </Button>
          </form>
        </div>
      </FeedWrapper>
    </div>
  );
};

export default ProfilePage;
