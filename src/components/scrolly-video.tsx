import { motion, useScroll, useTransform, useMotionValueEvent, HTMLMotionProps } from "framer-motion";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";

interface ScrollyVideoProps extends HTMLMotionProps<"canvas"> {
    video: string;
    containerRef: RefObject<HTMLDivElement>;
    onLoadProgress?: (progress: number) => void;
}

function ScrollyVideo({ video, containerRef, onLoadProgress, ...props }: ScrollyVideoProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [frames, setFrames] = useState<ImageBitmap[]>([]);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    const frameIndex = useTransform(scrollYProgress, [0, 1], [0, frames.length - 1], {
        clamp: true
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Scale canvas for high DPI screens
        const dpr = window.devicePixelRatio || 1;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;

        ctx.scale(dpr, dpr);
    }, []);

    // Preload frames when component mounts
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const tempCanvas = document.createElement("canvas");
        const ctx = tempCanvas.getContext("2d");
        if (!ctx) return;

        const frameArray: ImageBitmap[] = [];
        let isCancelled = false;

        video.addEventListener("loadeddata", async () => {
            tempCanvas.width = video.videoWidth;
            tempCanvas.height = video.videoHeight;

            const MAX_FRAMES = 60;
            const totalFrames = Math.floor(video.duration * 30);
            const frameSkip = Math.max(1, Math.floor(totalFrames / MAX_FRAMES));

            console.time("Frame Extraction Speed");

            // 🔥 **1. Play video in 2x speed for preloading**
            video.playbackRate = 8.0;
            video.pause();

            let frameCount = 0;
            let batchPromises: Promise<ImageBitmap>[] = [];

            while (frameCount < totalFrames && !isCancelled) {
                if ("fastSeek" in video) {
                    video.fastSeek((frameCount / totalFrames) * video.duration);
                } else {
                    (video as HTMLVideoElement).currentTime = (frameCount / totalFrames) * (video as HTMLVideoElement).duration;
                }

                // 🏎 **Fast seek and wait for frame readiness**
                await new Promise((resolve) => video.onseeked = resolve);

                ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
                batchPromises.push(createImageBitmap(tempCanvas));

                frameCount += frameSkip; // Skip frames dynamically

                // 🔥 **Process images in batches of 10** (prevents UI freezing)
                if (batchPromises.length >= 10) {
                    const bitmaps = await Promise.all(batchPromises);
                    frameArray.push(...bitmaps);
                    batchPromises = [];
                    onLoadProgress?.(Math.floor((frameArray.length / MAX_FRAMES) * 100));
                }
            }

            // 🏁 **Finish processing remaining frames**
            if (batchPromises.length > 0) {
                const bitmaps = await Promise.all(batchPromises);
                frameArray.push(...bitmaps);
            }

            console.timeEnd("Frame Extraction Speed");
            onLoadProgress?.(100);
            setFrames(frameArray);
        });

        return () => {
            isCancelled = true;
            frameArray.forEach((frame) => frame.close()); // Cleanup
        };
    }, []);


    const drawImage = useCallback((v: number) => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        const frameIndex = Math.floor(v);
        const bitmap = frames[frameIndex];
        if (!bitmap) return;

        const draw = () => {
            const canvasWidth = ctx.canvas.width;
            const canvasHeight = ctx.canvas.height;
            const imgWidth = bitmap.width;
            const imgHeight = bitmap.height;

            // Calculate aspect ratios
            const canvasAspect = canvasWidth / canvasHeight;
            const imgAspect = imgWidth / imgHeight;

            let drawWidth, drawHeight, offsetX, offsetY;

            if (imgAspect > canvasAspect) {
                drawHeight = canvasHeight;
                drawWidth = drawHeight * imgAspect;
                offsetX = (canvasWidth - drawWidth) / 2;
                offsetY = 0;
            } else {
                drawWidth = canvasWidth;
                drawHeight = drawWidth / imgAspect;
                offsetX = 0;
                offsetY = 0;
            }

            // Clear and draw
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            ctx.drawImage(bitmap, offsetX, offsetY, drawWidth, drawHeight);
        };

        requestAnimationFrame(draw);
    }, [frames]);

    useEffect(() => drawImage(0), [drawImage]);

    useMotionValueEvent(frameIndex, "change", drawImage);

    return (
        <>
            <motion.canvas ref={canvasRef} {...props} />
            <video ref={videoRef} src={video} className="hidden" playsInline muted />
        </>
    );
}
export default ScrollyVideo;
