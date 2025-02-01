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
                    <div className="relative w-full h-6 bg-white rounded-full overflow-hidden shadow-xl">
                        <motion.div
                            className="origin-left h-full w-full bg-blue-400"
                            style={{ scaleX: loadingBar }}
                        />
                    </div>

                </div>
            </motion.div>

            <div className={"w-full cursor-auto sm:cursor-none bg-black"}>
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
