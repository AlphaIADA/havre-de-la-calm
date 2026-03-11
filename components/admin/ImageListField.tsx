'use client';

import * as React from 'react';
import Image from 'next/image';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

function moveItem<T>(items: T[], from: number, to: number) {
  const next = items.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function safeTrim(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

type Uploaded = { key: string; uploadUrl: string; publicUrl: string };

async function presignR2(prefix: string, file: File): Promise<Uploaded> {
  const res = await fetch('/api/admin/uploads/r2/presign', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      prefix,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error ?? 'Could not prepare upload');
  return body as Uploaded;
}

async function putFile(url: string, file: File) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: file.type ? { 'content-type': file.type } : undefined,
    body: file,
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }
}

export function ImageListField(props: {
  label: string;
  helpText?: string;
  prefix: string;
  value: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  maxFiles?: number;
}) {
  const multiple = props.multiple ?? true;
  const maxFiles = props.maxFiles ?? (multiple ? 20 : 1);
  const [pending, startTransition] = React.useTransition();
  const [manualUrl, setManualUrl] = React.useState('');

  const images = props.value ?? [];

  const uploadFiles = (files: FileList | null) => {
    if (props.disabled) return;
    const list = files ? Array.from(files) : [];
    if (!list.length) return;
    if (!props.prefix.trim()) {
      toast.error('Enter a slug first', { description: 'Uploads need a valid prefix.' });
      return;
    }
    if (images.length + list.length > maxFiles) {
      toast.error('Too many images', { description: `Max ${maxFiles} images.` });
      return;
    }

    startTransition(async () => {
      try {
        for (const file of list) {
          if (!file.type.toLowerCase().startsWith('image/')) {
            toast.error('Unsupported file', { description: 'Only images are supported.' });
            continue;
          }
          if (file.size > 10 * 1024 * 1024) {
            toast.error('File too large', { description: 'Max 10MB per image.' });
            continue;
          }
          const presigned = await presignR2(props.prefix, file);
          await putFile(presigned.uploadUrl, file);
          props.onChange(multiple ? [...images, presigned.publicUrl] : [presigned.publicUrl]);
          toast.success('Image uploaded', { description: file.name });
        }
      } catch (err) {
        toast.error('Upload failed', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  const addManual = () => {
    const url = safeTrim(manualUrl);
    if (!url) return;
    if (images.length + 1 > maxFiles) {
      toast.error('Too many images', { description: `Max ${maxFiles} images.` });
      return;
    }
    props.onChange(multiple ? [...images, url] : [url]);
    setManualUrl('');
    toast.success('Image added');
  };

  const removeAt = (idx: number) => {
    props.onChange(images.filter((_, i) => i !== idx));
  };

  const moveUp = (idx: number) => {
    if (idx <= 0) return;
    props.onChange(moveItem(images, idx, idx - 1));
  };

  const moveDown = (idx: number) => {
    if (idx >= images.length - 1) return;
    props.onChange(moveItem(images, idx, idx + 1));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">{props.label}</label>
        {props.helpText ? <div className="text-xs text-zinc-500">{props.helpText}</div> : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={(e) => uploadFiles(e.target.files)}
          disabled={pending || props.disabled}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
        />
        <div className="text-xs text-zinc-500 sm:min-w-[140px]">
          {pending ? 'Uploading…' : `${images.length}/${maxFiles}`}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
          placeholder="Paste an image URL or /images/... path"
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
          disabled={pending || props.disabled}
        />
        <Button type="button" variant="secondary" onClick={addManual} disabled={pending || props.disabled}>
          Add
        </Button>
      </div>

      {images.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {images.map((src, idx) => (
            <div key={`${src}-${idx}`} className="rounded-2xl border border-zinc-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="relative h-20 w-28 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                  <Image
                    src={src}
                    alt={`Image ${idx + 1}`}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-zinc-700">#{idx + 1}</div>
                  <div className="mt-1 break-all text-xs text-zinc-500">{src}</div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  className={cn(
                    'rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-60',
                  )}
                  disabled={pending || props.disabled || idx === 0}
                >
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(idx)}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-60"
                  disabled={pending || props.disabled || idx === images.length - 1}
                >
                  Down
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-60"
                  disabled={pending || props.disabled}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
          No images yet.
        </div>
      )}
    </div>
  );
}

