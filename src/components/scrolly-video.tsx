import { HTMLMotionProps, motion, useScroll, useTransform } from "motion/react";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { demuxVideoWithLibav } from "@/lib/video-helpers";

interface ScrollyVideoProps extends HTMLMotionProps<"canvas"> {
    video: string;
    containerRef: RefObject<HTMLDivElement>;
    onDecodeProgress?: (progress: number) => void;
}

function ScrollyVideo({ video, containerRef, onDecodeProgress, ...props }: ScrollyVideoProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [imageBmps, setImageBmps] = useState<ImageBitmap[]>([]);
    const [currentFrame, setCurrentFrame] = useState(0);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });
    const videoProgress = useTransform(scrollYProgress, [0, 1], [0, 1]);

    useEffect(() => {
        let isCancelled = false; // in case component unmounts mid‐decode

        const decodeFrames = async () => {
            try {
                onDecodeProgress?.(0);

                // 1) Demux
                const { packets, extradata, codecName } = await demuxVideoWithLibav(video);
                const imgBmps: ImageBitmap[] = [];

                // 2) Create VideoDecoder
                const decoder = new VideoDecoder({
                    output: async (frame) => {
                        try {
                            const { codedWidth: width, codedHeight: height, visibleRect: rect } = frame;
                            if (!rect) {
                                console.error("Frame visibleRect is null");
                                return;
                            }
                            // Copy RGBA
                            const rgbaBuffer = new Uint8Array(width * height * 4);
                            await frame.copyTo(rgbaBuffer, {
                                format: "RGBA",
                                rect: {
                                    height: rect.height,
                                    width: rect.width,
                                    x: rect.x,
                                    y: rect.y,
                                }
                            });
                            // Create ImageBitmap
                            const imageData = new ImageData(
                                new Uint8ClampedArray(rgbaBuffer.buffer),
                                width,
                                height
                            );
                            const bitmap = await createImageBitmap(imageData);
                            imgBmps.push(bitmap);
                        } finally {
                            // Always close the frame to avoid GC warnings
                            frame.close();
                        }
                    },
                    error: (e) => console.error("Decoder error:", e),
                });

                // 3) Configure decoder
                let config: VideoDecoderConfig;
                if (codecName === "h264") {
                    config = {
                        codec: "avc1.640029", // Example: H.264
                        description: extradata ?? undefined
                    };
                } else if (codecName === "vp9") {
                    config = {
                        codec: "vp09.00.10.08", // Example: VP9
                        description: extradata ?? undefined
                    };
                } else {
                    throw new Error(`Unsupported codec: ${codecName}`);
                }
                decoder.configure(config);

                // 4) Decode frames and update progress
                for (let i = 0; i < packets.length; i++) {
                    if (isCancelled) return;
                    const p = packets[i];
                    const chunk = new EncodedVideoChunk({
                        timestamp: p.pts,
                        type: p.isKey ? "key" : "delta",
                        data: p.data
                    });
                    decoder.decode(chunk);

                    onDecodeProgress?.(Math.floor((i + 1) / packets.length * 100)); // update progress
                    await new Promise((r) => setTimeout(r, 0));
                }

                // 5) Wait for final decode
                await decoder.flush();

                if (!isCancelled) {
                    setImageBmps(imgBmps);
                    console.log("Done decoding!");
                }
            } catch (err) {
                console.error("Error in decodeFrames:", err);
            }
        };

        decodeFrames();

        // Setup canvas size & scaling
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                // Scale to device pixel ratio
                const scale = window.devicePixelRatio || 1;
                const width = canvas.clientWidth;
                const height = canvas.clientHeight;
                canvas.width = width * scale;
                canvas.height = height * scale;
                ctx.scale(scale, scale);

                // Set smoothing
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
            }
        }

        // Cleanup if unmounted
        return () => {
            isCancelled = true;
            onDecodeProgress?.(100);
            setImageBmps([]);
        };
    }, [video]);

    const drawImage = useCallback((v: number) => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        const frameIndex = Math.floor(v * imageBmps.length);
        setCurrentFrame(frameIndex);
        const bitmap = imageBmps[frameIndex];
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
    }, [imageBmps]);

    useEffect(() => { drawImage(0); }, [drawImage]);

    useEffect(() => {
        const handleResize = () => {
            drawImage(currentFrame / imageBmps.length);
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [drawImage, currentFrame, imageBmps.length]);

    videoProgress.on("change", drawImage);

    return <>
        <motion.canvas ref={canvasRef} {...props} />
    </>
}

export default ScrollyVideo;