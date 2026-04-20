"use client";

import { type ChangeEvent, useMemo, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { TextInput, useNotify, useSourceContext } from "react-admin";
import { Box, Button, Typography } from "@mui/material";

import { adminFetch, parseApiError } from "@/lib/admin-api";

type UploadImageResponse = {
  image_url: string;
  static_url: string;
};

type Props = {
  source: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function resolveImagePreviewUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("images/")) {
    return `${API_BASE}/static/${value}`;
  }

  if (value.startsWith("/static/")) {
    return `${API_BASE}${value}`;
  }

  if (value.startsWith("/media/")) {
    return value;
  }

  return value;
}

function isManagedImageUrl(raw: string): boolean {
  return raw.startsWith("images/") || raw.startsWith("/static/images/");
}

async function cropImageToSquare(file: File): Promise<File> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Cannot read image file"));
      img.src = objectUrl;
    });

    const squareSize = Math.min(image.naturalWidth, image.naturalHeight);
    const offsetX = Math.floor((image.naturalWidth - squareSize) / 2);
    const offsetY = Math.floor((image.naturalHeight - squareSize) / 2);

    const canvas = document.createElement("canvas");
    canvas.width = squareSize;
    canvas.height = squareSize;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Cannot initialize canvas for cropping");
    }

    context.drawImage(
      image,
      offsetX,
      offsetY,
      squareSize,
      squareSize,
      0,
      0,
      squareSize,
      squareSize
    );

    const targetMimeType = file.type === "image/png" ? "image/png" : "image/jpeg";

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (!result) {
            reject(new Error("Cannot generate cropped image"));
            return;
          }
          resolve(result);
        },
        targetMimeType,
        0.92
      );
    });

    const extension = targetMimeType === "image/png" ? ".png" : ".jpg";
    const originalBaseName = file.name.replace(/\.[^.]+$/, "") || "image";

    return new File([blob], `${originalBaseName}-square${extension}`, {
      type: targetMimeType,
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function ImageOptionField({ source }: Props) {
  const notify = useNotify();
  const sourceContext = useSourceContext();
  const finalSource = sourceContext.getSource?.(source) ?? source;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { setValue } = useFormContext();
  const imageUrl = useWatch({ name: finalSource }) as string | undefined;
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const notifyPlain = (message: string, type: "info" | "warning" | "error") => {
    notify(message, { type, messageArgs: { _: message } });
  };

  const previewUrl = useMemo(() => resolveImagePreviewUrl(imageUrl ?? ""), [imageUrl]);

  const openFileDialog = () => {
    if (uploading || deleting) return;
    fileInputRef.current?.click();
  };

  const onFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";
    if (!selectedFile) return;

    setUploading(true);
    try {
      const croppedFile = await cropImageToSquare(selectedFile);
      const body = new FormData();
      body.append("file", croppedFile);

      const response = await adminFetch<UploadImageResponse>("/api/v1/admin/exercises/upload-image", {
        method: "POST",
        body,
      });
      setValue(finalSource, response.image_url, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      notifyPlain("Image uploaded (auto-cropped 1:1)", "info");
    } catch (error) {
      const message = parseApiError(error);
      notifyPlain(message, "error");
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async () => {
    const currentImageUrl = (imageUrl ?? "").trim();
    if (!currentImageUrl) {
      notifyPlain("No image to delete", "warning");
      return;
    }

    if (!isManagedImageUrl(currentImageUrl)) {
      setValue(finalSource, "", {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      notifyPlain("Image URL cleared", "info");
      return;
    }

    setDeleting(true);
    try {
      await adminFetch<void>(
        `/api/v1/admin/exercises/delete-image?image_url=${encodeURIComponent(currentImageUrl)}`,
        { method: "DELETE" }
      );
      setValue(finalSource, "", {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      notifyPlain("Image deleted", "info");
    } catch (error) {
      const message = parseApiError(error);
      notifyPlain(message, "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 260 }}>
      {previewUrl ? (
        <Box
          sx={{
            width: 120,
            height: 80,
            borderRadius: 1,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Option preview"
            style={{ width: "100%", height: "100%", objectFit: "fill" }}
          />
        </Box>
      ) : (
        <Typography variant="caption" color="text.secondary">
          No image uploaded
        </Typography>
      )}

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={openFileDialog}
          disabled={uploading || deleting}
        >
          {uploading ? "Uploading..." : "Upload"}
        </Button>
        <Button
          size="small"
          color="error"
          variant="outlined"
          onClick={deleteImage}
          disabled={uploading || deleting || !imageUrl}
        >
          {deleting ? "Deleting..." : "Delete"}
        </Button>
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onFileSelected}
      />

      <TextInput source={source} label="Image URL" fullWidth helperText="Supports images/... or /static/images/..." />
    </Box>
  );
}
