"use client";

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { TextInput, useNotify, useSourceContext } from "react-admin";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";

import { adminFetch, parseApiError } from "@/lib/admin-api";

type UploadImageResponse = {
  image_url: string;
  static_url: string;
};

type Props = {
  source: string;
};

type CropRect = {
  x: number;
  y: number;
  size: number;
};

type DragMode = "move" | "resize" | null;

type DragState = {
  mode: DragMode;
  startX: number;
  startY: number;
  origin: CropRect;
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

async function loadImageFromObjectUrl(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Cannot read image file"));
    img.src = objectUrl;
  });
}

async function generateSquarePreview(
  image: HTMLImageElement,
  crop: CropRect,
  mimeType: string,
  quality = 0.92
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = crop.size;
  canvas.height = crop.size;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Cannot initialize canvas for preview");
  }

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.size,
    crop.size,
    0,
    0,
    crop.size,
    crop.size
  );

  return canvas.toDataURL(mimeType, quality);
}

async function buildCroppedFile(
  file: File,
  image: HTMLImageElement,
  crop: CropRect
): Promise<File> {
  const targetMimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const dataUrl = await generateSquarePreview(image, crop, targetMimeType, 0.92);
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  const extension = targetMimeType === "image/png" ? ".png" : ".jpg";
  const originalBaseName = file.name.replace(/\.[^.]+$/, "") || "image";

  return new File([blob], `${originalBaseName}-square${extension}`, {
    type: targetMimeType,
    lastModified: Date.now(),
  });
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
  const [cropOpen, setCropOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [cropImage, setCropImage] = useState<HTMLImageElement | null>(null);
  const [cropSourceUrl, setCropSourceUrl] = useState("");
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, size: 100 });
  const [cropPreviewUrl, setCropPreviewUrl] = useState("");
  const [dragState, setDragState] = useState<DragState | null>(null);

  const notifyPlain = (message: string, type: "info" | "warning" | "error") => {
    notify(message, { type, messageArgs: { _: message } });
  };

  const previewUrl = useMemo(() => resolveImagePreviewUrl(imageUrl ?? ""), [imageUrl]);

  useEffect(() => {
    return () => {
      if (cropSourceUrl) {
        URL.revokeObjectURL(cropSourceUrl);
      }
    };
  }, [cropSourceUrl]);

  useEffect(() => {
    if (!cropImage) {
      setCropPreviewUrl("");
      return;
    }

    const targetMimeType = pendingFile?.type === "image/png" ? "image/png" : "image/jpeg";
    generateSquarePreview(cropImage, cropRect, targetMimeType)
      .then(setCropPreviewUrl)
      .catch(() => setCropPreviewUrl(""));
  }, [cropImage, cropRect, pendingFile]);

  useEffect(() => {
    if (!dragState || !cropImage) return;

    const width = cropImage.naturalWidth;
    const height = cropImage.naturalHeight;
    const frameSize = 280;
    const fitScale = Math.min(frameSize / width, frameSize / height);
    const pxToImage = (value: number) => value / fitScale;

    const handleMouseMove = (event: MouseEvent) => {
      event.preventDefault();
      const deltaX = pxToImage(event.clientX - dragState.startX);
      const deltaY = pxToImage(event.clientY - dragState.startY);

      if (dragState.mode === "move") {
        const nextX = clamp(Math.round(dragState.origin.x + deltaX), 0, width - cropRect.size);
        const nextY = clamp(Math.round(dragState.origin.y + deltaY), 0, height - cropRect.size);
        setCropRect((prev) => ({ ...prev, x: nextX, y: nextY }));
        return;
      }

      if (dragState.mode === "resize") {
        const delta = Math.max(deltaX, deltaY);
        const maxSize = Math.min(width - dragState.origin.x, height - dragState.origin.y);
        const nextSize = clamp(Math.round(dragState.origin.size + delta), 32, maxSize);
        setCropRect((prev) => ({ ...prev, size: nextSize }));
      }
    };

    const stopDragging = () => setDragState(null);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopDragging);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
    };
  }, [cropImage, cropRect.size, dragState]);

  const resetCropState = () => {
    if (cropSourceUrl) {
      URL.revokeObjectURL(cropSourceUrl);
    }
    setCropOpen(false);
    setPendingFile(null);
    setCropImage(null);
    setCropSourceUrl("");
    setCropPreviewUrl("");
    setCropRect({ x: 0, y: 0, size: 100 });
    setDragState(null);
  };

  const openFileDialog = () => {
    if (uploading || deleting) return;
    fileInputRef.current?.click();
  };

  const onFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";
    if (!selectedFile) return;

    try {
      if (cropSourceUrl) {
        URL.revokeObjectURL(cropSourceUrl);
      }

      const objectUrl = URL.createObjectURL(selectedFile);
      const image = await loadImageFromObjectUrl(objectUrl);
      const minEdge = Math.min(image.naturalWidth, image.naturalHeight);
      const centeredX = Math.floor((image.naturalWidth - minEdge) / 2);
      const centeredY = Math.floor((image.naturalHeight - minEdge) / 2);

      setPendingFile(selectedFile);
      setCropImage(image);
      setCropSourceUrl(objectUrl);
      setCropRect({ x: centeredX, y: centeredY, size: minEdge });
      setCropOpen(true);
    } catch (error) {
      const message = parseApiError(error);
      notifyPlain(message, "error");
    }
  };

  const uploadCroppedImage = async () => {
    if (!pendingFile || !cropImage) {
      notifyPlain("No image selected", "warning");
      return;
    }

    setUploading(true);
    try {
      const croppedFile = await buildCroppedFile(pendingFile, cropImage, cropRect);
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
      notifyPlain("Image uploaded", "info");
      resetCropState();
    } catch (error) {
      const message = parseApiError(error);
      notifyPlain(message, "error");
    } finally {
      setUploading(false);
    }
  };

  const cropBounds = useMemo(() => {
    const width = cropImage?.naturalWidth ?? 1;
    const height = cropImage?.naturalHeight ?? 1;
    const maxSize = Math.min(width, height);
    return { width, height, maxSize };
  }, [cropImage]);

  const cropOverlay = useMemo(() => {
    if (!cropImage) return null;
    const frameSize = 280;
    const fitScale = Math.min(frameSize / cropBounds.width, frameSize / cropBounds.height);
    const displayWidth = cropBounds.width * fitScale;
    const displayHeight = cropBounds.height * fitScale;
    const offsetLeft = (frameSize - displayWidth) / 2;
    const offsetTop = (frameSize - displayHeight) / 2;

    return {
      frameSize,
      fitScale,
      displayWidth,
      displayHeight,
      offsetLeft,
      offsetTop,
      left: offsetLeft + cropRect.x * fitScale,
      top: offsetTop + cropRect.y * fitScale,
      size: cropRect.size * fitScale,
    };
  }, [cropBounds.height, cropBounds.width, cropImage, cropRect.x, cropRect.y, cropRect.size]);

  const startDraggingMove = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragState({
      mode: "move",
      startX: event.clientX,
      startY: event.clientY,
      origin: cropRect,
    });
  };

  const startDraggingResize = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragState({
      mode: "resize",
      startX: event.clientX,
      startY: event.clientY,
      origin: cropRect,
    });
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

      <Dialog open={cropOpen} onClose={resetCropState} maxWidth="md" fullWidth>
        <DialogTitle>Crop image 1:1</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", mt: 1 }}>
            <Box sx={{ minWidth: 280 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Crop area (drag inside to move, drag corner handle to resize)
              </Typography>
              <Box
                sx={{
                  position: "relative",
                  width: 280,
                  height: 280,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  bgcolor: "#111",
                  overflow: "hidden",
                }}
              >
                {cropOverlay && (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cropSourceUrl}
                      alt="Crop source"
                      style={{
                        position: "absolute",
                        left: cropOverlay.offsetLeft,
                        top: cropOverlay.offsetTop,
                        width: cropOverlay.displayWidth,
                        height: cropOverlay.displayHeight,
                        objectFit: "fill",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        left: cropOverlay.left,
                        top: cropOverlay.top,
                        width: cropOverlay.size,
                        height: cropOverlay.size,
                        border: "2px solid #58CC02",
                        boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)",
                        cursor: "move",
                        pointerEvents: "auto",
                        userSelect: "none",
                      }}
                      onMouseDown={startDraggingMove}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          width: 16,
                          height: 16,
                          right: -10,
                          bottom: -10,
                          borderRadius: "50%",
                          border: "2px solid #fff",
                          bgcolor: "#58CC02",
                          cursor: "nwse-resize",
                          boxShadow: "0 1px 6px rgba(0,0,0,0.3)",
                        }}
                        onMouseDown={startDraggingResize}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        position: "absolute",
                        left: 8,
                        bottom: 8,
                        color: "#fff",
                        bgcolor: "rgba(0,0,0,0.45)",
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 0.5,
                      }}
                    >
                      {cropRect.size} x {cropRect.size}
                    </Typography>
                  </>
                )}
              </Box>
            </Box>

            <Box sx={{ minWidth: 280, flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Preview 1:1
              </Typography>
              <Box
                sx={{
                  width: 180,
                  height: 180,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  overflow: "hidden",
                  bgcolor: "background.paper",
                }}
              >
                {cropPreviewUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={cropPreviewUrl}
                    alt="Crop preview"
                    style={{ width: "100%", height: "100%", objectFit: "fill" }}
                  />
                ) : null}
              </Box>
              {/* <Typography variant="caption" sx={{ display: "block", mt: 1.5, color: "text.secondary" }}>
                Mẹo: Kéo bên trong khung xanh để di chuyển vùng crop. Kéo nút tròn ngoài góc để thay đổi kích thước.
              </Typography> */}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetCropState} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={uploadCroppedImage} variant="contained" disabled={uploading || !cropImage}>
            {uploading ? "Uploading..." : "Crop & Upload"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
