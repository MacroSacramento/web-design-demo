import { motion, HTMLMotionProps, useScroll, useTransform } from "framer-motion";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";

interface ScrollyVideoProps extends HTMLMotionProps<"canvas"> {
    /**
     * The URL or path to the video file used to extract frames.
     */
    video: string;

    /**
     * A ref to the container element within which the scroll progress is measured.
     */
    containerRef: RefObject<HTMLDivElement>;

    /**
     * An optional callback fired during the frame extraction process (0-100).
     */
    onLoadProgress?: (progress: number) => void;

    /**
     * The maximum width (in pixels) to which extracted frames will be scaled. 
     * Defaults to 1920.
     */
    maxWidth?: number;

    /**
     * The maximum height (in pixels) to which extracted frames will be scaled. 
     * Defaults to 1080.
     */
    maxHeight?: number;

    /**
     * The maximum number of frames to extract from the video. Defaults to 60.
     */
    maxFrames?: number;

    /**
     * The base frames-per-second to assume when slicing frames from the video. 
     * Defaults to 30.
     */
    baseFps?: number;
}

/**
 * ScrollyVideo extracts frames from a video and draws them onto a canvas
 * in response to the user's scroll progress. As the user scrolls, it updates
 * the displayed frame based on the current scroll position.
 */
export default function ScrollyVideo({
    video,
    onLoadProgress,
    containerRef,
    maxWidth = 1920,
    maxHeight = 1080,
    maxFrames = 30,
    baseFps = 30,
    ...props
}: ScrollyVideoProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    /**
     * Holds all extracted ImageBitmap frames once ready.
     */
    const [frames, setFrames] = useState<ImageBitmap[]>([]);

    /**
     * Keep track of the current frame index so we can re-draw on canvas resize.
     */
    const currentFrameRef = useRef<number>(0);

    /**
     * Scroll progress (0 to 1) as we move from 'start' to 'end' of containerRef.
     */
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    /**
     * A transform for mapping scroll progress (0-1) to our frame array index (0 to frames.length-1).
     */
    const frameIndex = useTransform(
        scrollYProgress,
        [0, 1],
        [0, frames.length - 1],
        { clamp: true }
    );

    /**
     * Each time frameIndex changes, draw the corresponding frame.
     * Also keep track of that index in currentFrameRef for re-drawing.
     */
    frameIndex.on("change", (v) => {
        if (v < 0 || v == null)
            v = 0;

        const idx = Math.round(v);
        currentFrameRef.current = idx;
        drawImage(idx);
    });

    /**
     * Utility to scale the canvas for higher DPI (e.g., on Retina screens)
     * to match the element's layout size.
     */
    const scaleCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Get bounding client rect to understand the element's layout size
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // Update canvas width/height based on layout size * devicePixelRatio
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        // Scale the drawing context so we can draw at "CSS size" coordinates
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.scale(dpr, dpr);
        }
    }, []);

    /**
     * Draws an ImageBitmap frame onto the canvas at the given index, maintaining
     * aspect ratio. Clears the canvas first to avoid overlapping images.
     */
    const drawImage = useCallback(
        (index: number) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const bitmap = frames[index];
            if (!bitmap) return;

            // Clear any previously-drawn frame
            const { width: canvasWidth, height: canvasHeight } = canvas;
            ctx.clearRect(0, 0, canvasWidth, canvasHeight);

            // Maintain aspect ratio while covering the entire canvas
            const aspectRatio = bitmap.width / bitmap.height;
            let drawWidth = canvasWidth;
            let drawHeight = canvasWidth / aspectRatio;

            if (drawHeight < canvasHeight) {
                drawHeight = canvasHeight;
                drawWidth = canvasHeight * aspectRatio;
            }

            // Align image to the top; center horizontally
            const offsetX = (canvasWidth - drawWidth) / 2;
            const offsetY = 0;

            ctx.drawImage(bitmap, offsetX, offsetY, drawWidth, drawHeight);
        },
        [frames]
    );

    useEffect(() => {
        drawImage(0);
        setTimeout(() => { onLoadProgress?.(100); }, 500);
    }, [drawImage]);

    /**
     * Initialize the canvas size on mount (and first render).
     */
    useEffect(() => {
        scaleCanvas();
    }, [scaleCanvas]);

    /**
     * Handle canvas resizing whenever the window size changes.
     * We re-scale the canvas, then re-draw the current frame.
     */
    useEffect(() => {
        function handleResize() {
            scaleCanvas();
            // Re-draw the last frame we have
            drawImage(currentFrameRef.current);
        }

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [scaleCanvas, drawImage]);

    /**
     * Extract frames from the <video> once metadata is loaded (dimensions, duration, etc.).
     * We sample frames uniformly based on maxFrames, and store them as ImageBitmaps in state.
     */
    useEffect(() => {
        if (!videoRef.current) return;
        const videoEl = videoRef.current;

        let isCancelled = false;
        let frameArray: ImageBitmap[] = [];

        // Temporary offscreen canvas to draw & convert to ImageBitmap
        const tempCanvas = document.createElement("canvas");
        const ctx = tempCanvas.getContext("2d");
        if (!ctx) return;

        /**
         * Extracts frames after video metadata (width/height/duration) is available.
         */
        async function extractFrames() {
            // Ensure video is not playing
            videoEl.pause();

            // Determine video dimensions & clamp them to maxWidth/maxHeight
            const videoWidth = videoEl.videoWidth;
            const videoHeight = videoEl.videoHeight;
            const aspect = videoWidth / videoHeight;

            let targetWidth = videoWidth;
            let targetHeight = videoHeight;

            // Clamp to maxWidth
            if (targetWidth > maxWidth) {
                targetWidth = maxWidth;
                targetHeight = Math.floor(targetWidth / aspect);
            }
            // Clamp to maxHeight
            if (targetHeight > maxHeight) {
                targetHeight = maxHeight;
                targetWidth = Math.floor(targetHeight * aspect);
            }

            tempCanvas.width = targetWidth;
            tempCanvas.height = targetHeight;

            const totalDuration = videoEl.duration;
            const totalFrames = Math.floor(totalDuration * baseFps);
            const frameSkip = Math.max(1, Math.floor(totalFrames / maxFrames));

            // Seek to frames in increments and extract
            for (
                let frameCount = 0;
                frameCount < totalFrames && !isCancelled;
                frameCount += frameSkip
            ) {
                const seekTime = (frameCount / totalFrames) * totalDuration;
                videoEl.currentTime = seekTime;

                // Wait for the browser to decode the frame
                await new Promise<void>((resolve) => {
                    const onSeeked = () => {
                        videoEl.removeEventListener("seeked", onSeeked);
                        resolve();
                    };
                    videoEl.addEventListener("seeked", onSeeked);
                });

                ctx?.drawImage(videoEl, 0, 0, targetWidth, targetHeight);

                if (isCancelled) break;
                const bitmap = await createImageBitmap(tempCanvas);
                frameArray.push(bitmap);
                const loadProgress = (frameCount / totalFrames) * 100;
                if (loadProgress != 100) onLoadProgress?.(loadProgress);
            }

            // Final progress = 100%
            onLoadProgress?.(99);

            // Update frames state if extraction not cancelled
            if (!isCancelled) {
                setFrames(frameArray);
            }
        }

        // Once we have video metadata (dimensions, duration), start extracting
        const onMetadataLoaded = () => {
            videoEl.removeEventListener("loadedmetadata", onMetadataLoaded);
            extractFrames().catch(() => {
                /* Handle or log errors as needed */
            });
        };
        videoEl.addEventListener("loadedmetadata", onMetadataLoaded, { once: true });

        // Cleanup
        return () => {
            isCancelled = true;
            videoEl.removeEventListener("loadedmetadata", onMetadataLoaded);
            frameArray.forEach((bitmap) => bitmap.close());
            frameArray = [];
        };
    }, [onLoadProgress, maxWidth, maxHeight, maxFrames, baseFps]);

    return (
        <>
            {/*
            * Canvas to display the current frame. 
            * We use framer-motion's motion.canvas for potential animations/styling.
            */}
            <motion.canvas ref={canvasRef} {...props} />

            {/*
            * Hidden <video> element used only for decoding frames. 
            * 'playsInline' ensures mobile browsers handle inline playback.
            */}
            <video ref={videoRef} src={video} className="hidden" playsInline muted />
        </>
    );
}
