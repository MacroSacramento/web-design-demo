import { motion, useMotionValue, useScroll, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";
import video from "@/assets/12827201_1920_1080_30fps.webm";
import ScrollyVideo from "@/components/scrolly-video";
import Header from "@/components/layout/header";
import InfoCard from "@/components/info-card";

export default function App() {
    const [progress, setProgress] = useState(0);
    const loading = progress < 100;

    const scrollySectionRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: scrollySectionRef,
        offset: ["start start", "end end"],
    });
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001,
    });

    const loadingMotion = useMotionValue(0);
    const loadingBar = useSpring(loadingMotion, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001,
    });

    // Smoothly animate the number count-up effect
    const progressMotion = useMotionValue(0);
    const animatedProgress = useSpring(progressMotion, {
        stiffness: 100,
        damping: 20,
        restDelta: 0.001,
    });

    const [showSecondColor, setShowSecondColor] = useState(false);
    const section2ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress: section2Progress } = useScroll({
        target: section2ref,
    });
    section2Progress.on("change", (latest) => {
        setShowSecondColor(latest > 0.5);
    });

    useEffect(() => {
        loadingMotion.set(progress / 100);
        progressMotion.set(progress);
    }, [progress]);

    useEffect(() => {
        if (loading) {
            document.documentElement.style.overflow = "hidden";
            window.scrollTo(0, 0);
        } else {
            document.documentElement.style.overflow = "";
        }
    }, [loading]);

    return (
        <>
            <motion.div
                className={"fixed inset-0 bg-black flex items-center justify-center z-50"}
                initial={{ opacity: 1 }}
                animate={{ opacity: loading ? 1 : 0 }}
                transition={{ duration: 0.5 }}
                style={{ pointerEvents: loading ? "auto" : "none" }}
            >
                <div className="w-1/2">
                    {/* Animated Loading Percentage */}
                    <motion.h3 className="text-white text-center text-xl font-semibold">
                        Loading <motion.span>{Math.floor(animatedProgress.get())}%</motion.span>
                    </motion.h3>

                    {/* Animated Progress Bar */}
                    <div className="relative w-full h-6 bg-gray-900 rounded-full overflow-hidden border border-blue-500 shadow-xl">
                        {/* Background Frosty Glow */}
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                                scaleX: loadingBar,
                                transformOrigin: "left",
                                background: "rgba(173, 216, 230, 0.4)",
                                filter: "blur(15px)",
                                opacity: 0.7,
                            }}
                        />

                        {/* Cracked Ice Progress Effect */}
                        <motion.div
                            className="absolute inset-0 rounded-full overflow-hidden"
                            style={{
                                scaleX: loadingBar,
                                transformOrigin: "left",
                            }}
                        >
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                                {/* Ice Shards & Cracks */}
                                <motion.path
                                    fill="rgba(173, 216, 230, 0.9)"
                                    d="M0 15 L10 10 L20 14 L30 8 L40 12 L50 7 L60 13 L70 9 L80 15 L90 10 L100 15 V 20 H 0 Z"
                                    animate={{
                                        d: [
                                            "M0 15 L10 10 L20 14 L30 8 L40 12 L50 7 L60 13 L70 9 L80 15 L90 10 L100 15 V 20 H 0 Z",
                                            "M0 16 L10 9 L22 13 L32 7 L42 11 L52 6 L64 14 L72 8 L82 14 L92 11 L100 16 V 20 H 0 Z",
                                        ],
                                        translateX: ["0%", "3%", "0%"],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatType: "mirror",
                                        ease: "easeInOut",
                                    }}
                                />
                            </svg>
                        </motion.div>

                        {/* Ice Reflection Overlay */}
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                                scaleX: loadingBar,
                                transformOrigin: "left",
                                background: "linear-gradient(to right, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))",
                                opacity: 0.8,
                            }}
                        />

                        {/* Snow Accumulation Effect */}
                        <motion.div
                            className="absolute top-0 left-0 w-full h-2 bg-white opacity-80 rounded-full"
                            style={{
                                scaleX: loadingBar,
                                transformOrigin: "left",
                                filter: "blur(5px)",
                            }}
                        />

                        {/* Ice Crack Glow Effect */}
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            animate={{
                                opacity: [0.4, 0.7, 0.4],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            style={{
                                background: "rgba(173, 216, 230, 0.6)",
                                filter: "blur(10px)",
                            }}
                        />

                        {/* Snowfall Effect */}
                        <motion.div
                            className="absolute top-0 left-0 w-full h-full pointer-events-none"
                            animate={{ opacity: [0.8, 0.4, 0.8] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <svg className="absolute w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                                <motion.circle cx="10" cy="2" r="1.5" fill="white" animate={{ cy: [2, 18] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
                                <motion.circle cx="30" cy="4" r="1.2" fill="white" animate={{ cy: [4, 19] }} transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }} />
                                <motion.circle cx="60" cy="1" r="1.8" fill="white" animate={{ cy: [1, 17] }} transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }} />
                                <motion.circle cx="80" cy="3" r="1.4" fill="white" animate={{ cy: [3, 18] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
                            </svg>
                        </motion.div>
                    </div>

                </div>
            </motion.div>

            <div className={"w-full cursor-none bg-black"}>
                <Header />

                <section
                    ref={scrollySectionRef}
                    className="relative min-h-[200vh] bg-gray-50"
                >
                    <div className="sticky top-0 h-screen w-full">
                        <ScrollyVideo
                            video={video}
                            containerRef={scrollySectionRef}
                            className="h-full w-full object-cover -z-1"
                            onLoadProgress={setProgress}
                        />

                        <motion.div
                            className="absolute bottom-6 left-0 right-0 h-1 bg-red-500 origin-center"
                            style={{ scaleX }}
                        />
                    </div>

                    <div className="relative h-screen flex items-center justify-center text-white mt-[-100vh]">
                        <h1
                            className="text-4xl font-bold"
                            style={{
                                textShadow: "5 0 10px rgba(0, 0, 0, 0.8)",
                            }}
                        >
                            Scrollable Video Demo
                        </h1>
                    </div>

                    <div className="flex flex-col z-10">
                        <InfoCard title="Section 1" image="https://placehold.co/400">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque tincidunt justo a velit commodo sollicitudin. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Maecenas et leo aliquet, auctor nunc at, placerat velit. Fusce non tempor est, vestibulum ornare libero. Vestibulum in elementum diam. Proin dictum ligula sit amet velit porta sollicitudin. Duis sem purus, semper quis risus semper, malesuada lacinia mauris.
                        </InfoCard>

                        <InfoCard title="Section 2">
                            Aenean tincidunt libero et porta feugiat. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Sed posuere hendrerit congue. Fusce nec eros tortor. Donec nulla elit, vulputate a elit vitae, congue interdum turpis. Nunc ac euismod turpis. Donec ut leo egestas, dapibus tortor et, condimentum ligula.
                        </InfoCard>

                        <InfoCard title="Section 3">
                            Praesent dictum, urna volutpat eleifend efficitur, metus augue viverra sapien, ut maximus ante lectus sed ligula. Curabitur facilisis euismod nunc, vitae imperdiet lacus suscipit id. Interdum et malesuada fames ac ante ipsum primis in faucibus. Duis eu urna in augue finibus lacinia. Nam congue enim ut lacus venenatis malesuada. Nullam nec dignissim mi. Cras dapibus lectus sit amet placerat facilisis. Suspendisse potenti.
                        </InfoCard>
                    </div>
                </section>

                <section className="h-[200vh]" ref={section2ref}>
                    <motion.div
                        className={"h-screen sticky top-0 left-0 flex flex-col items-center justify-center text-white"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            backgroundColor: showSecondColor ? "#8B8982" : "#373F47",
                            transition: "background-color 0.5s ease-in-out",
                        }}
                    >
                        <h3 className="text-4xl font-bold mb-4">Next Section</h3>
                        <p className="max-w-2xl text-center">
                            Once we enter here, the video is no longer pinned.
                        </p>
                    </motion.div>
                </section>
            </div>
        </>
    );
}
