import { useEffect, useState, type ComponentPropsWithRef } from "react";

type GeneratedImage = { base64?: string; mediaType?: string; uint8Array?: Uint8Array };
export type ImageProps = Omit<ComponentPropsWithRef<"img">, "src"> & { image?: GeneratedImage; src?: string };
function isImageSource(source: string) {
  try {
    const parsed = new URL(source, "https://image.invalid");
    if (parsed.username || parsed.password) return false;
    if (["http:", "https:", "blob:"].includes(parsed.protocol)) return true;
    return parsed.protocol === "data:" && /^data:image\/[a-z0-9.+-]+(?:;base64)?,/i.test(source);
  } catch { return false; }
}
export function Image({ image, src, srcSet, alt = "Generated image", className = "", onError, ...props }: ImageProps) {
  const [failedSource, setFailedSource] = useState<string>();
  const base64 = image?.base64 ?? (image?.uint8Array?.length ? btoa(Array.from(image.uint8Array, byte => String.fromCharCode(byte)).join("")) : undefined);
  const data = base64 ? `data:${image?.mediaType ?? "image/png"};base64,${base64}` : src;
  useEffect(() => { setFailedSource(undefined); }, [data]);
  if (!data || !isImageSource(data) || failedSource === data) return <div role="img" aria-label={alt} className={`hk-generated-image hk-generated-image--empty ${className}`}>No image available</div>;
  const safeSrcSet = srcSet && srcSet.split(",").every(candidate => {
    const [source, descriptor, ...extra] = candidate.trim().split(/\s+/);
    return source && isImageSource(source) && !source.toLowerCase().startsWith("data:") && !extra.length && (!descriptor || /^(?:\d+w|(?:\d+(?:\.\d+)?|\.\d+)x)$/.test(descriptor));
  }) ? srcSet : undefined;
  return <img {...props} src={data} srcSet={safeSrcSet} alt={alt} className={`hk-generated-image ${className}`} onError={event => { setFailedSource(data); onError?.(event); }} />;
}
