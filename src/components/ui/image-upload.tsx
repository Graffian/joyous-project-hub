import { useRef, useState, useEffect } from "react";
import { ImagePlus, X, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  className?: string;
}

const MAX_SIZE = 5 * 1024 * 1024;

export function ImageUpload({ value, onChange, disabled, className = "" }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPreview(value);
  }, [value]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > MAX_SIZE) {
      toast.error("Image must be under 5MB");
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPreview(dataUrl);
      onChange(dataUrl);
      setLoading(false);
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
      setLoading(false);
    };
    reader.readAsDataURL(file);
  }

  function handleRemove() {
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleReplaceClick() {
    inputRef.current?.click();
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
        disabled={disabled}
      />

      {preview ? (
        <div className="flex items-start gap-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-cream">
            <img
              src={preview}
              alt="Preview"
              className="h-full w-full object-cover"
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Loader2 className="h-4 w-4 animate-spin text-cream" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={handleReplaceClick}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-ink hover:bg-muted/40 disabled:opacity-50"
            >
              <ImagePlus className="h-3 w-3" />
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-destructive hover:bg-destructive/5 disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-ink/20 bg-background px-3 py-4 text-[11px] text-muted-foreground hover:border-ink/40 hover:bg-muted/20 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          Click to upload image
        </button>
      )}
    </div>
  );
}
