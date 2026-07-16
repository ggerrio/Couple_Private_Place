import React from "react";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  resizeWidth?: number;
  resizeHeight?: number;
}

export function OptimizedImage({
  src,
  resizeWidth,
  resizeHeight,
  alt = "",
  loading = "lazy",
  referrerPolicy = "no-referrer",
  ...props
}: OptimizedImageProps) {
  let optimizedSrc = src;

  if (src && typeof src === "string") {
    // Check if it is a Cloudinary URL
    const cloudinaryMatch = src.match(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload)(.*)$/);
    if (cloudinaryMatch) {
      const baseUrl = cloudinaryMatch[1];
      let remainingPath = cloudinaryMatch[2];

      // Build transformations
      const transforms = ["f_auto", "q_auto"];
      if (resizeWidth) transforms.push(`w_${resizeWidth}`);
      if (resizeHeight) transforms.push(`h_${resizeHeight}`);
      if (resizeWidth && resizeHeight) transforms.push("c_limit");

      const transformStr = transforms.join(",");

      if (remainingPath.startsWith("/")) {
        remainingPath = remainingPath.substring(1);
      }

      const segments = remainingPath.split("/");
      const firstSegment = segments[0];
      const isVersion = /^v\d+$/.test(firstSegment);
      
      if (!isVersion && segments.length > 1 && !firstSegment.includes(".")) {
        // First segment is an existing transformation, let's merge
        const existingTransforms = firstSegment.split(",");
        const merged = Array.from(new Set([...existingTransforms, "f_auto", "q_auto"]));
        if (resizeWidth && !existingTransforms.some(t => t.startsWith("w_"))) {
          merged.push(`w_${resizeWidth}`);
        }
        if (resizeHeight && !existingTransforms.some(t => t.startsWith("h_"))) {
          merged.push(`h_${resizeHeight}`);
        }
        segments[0] = merged.join(",");
        optimizedSrc = `${baseUrl}/${segments.join("/")}`;
      } else {
        // No existing transformation, insert ours
        optimizedSrc = `${baseUrl}/${transformStr}/${remainingPath}`;
      }
    } else if (src.includes("images.unsplash.com")) {
      // Optimize Unsplash images on the fly!
      try {
        const url = new URL(src);
        url.searchParams.set("auto", "format");
        url.searchParams.set("q", "80");
        if (resizeWidth) url.searchParams.set("w", resizeWidth.toString());
        if (resizeHeight) url.searchParams.set("h", resizeHeight.toString());
        optimizedSrc = url.toString();
      } catch (e) {
        // ignore errors and fallback
      }
    }
  }

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      loading={loading}
      referrerPolicy={referrerPolicy}
      {...props}
    />
  );
}
