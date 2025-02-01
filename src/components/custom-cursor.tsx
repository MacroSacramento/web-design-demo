import { useEffect } from "react";
import { motion, useMotionValue } from "motion/react";

function CustomCursor() {
    // 1) Track mouse position
    const cursorX = useMotionValue(0);
    const cursorY = useMotionValue(0);

    // 2) Listen to mousemove globally, update motion values
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [cursorX, cursorY]);

    // 4) A styled circle that follows the mouse
    return (
        <motion.div
            className="hidden sm:block pointer-events-none fixed top-0 left-0 z-50 h-6 w-6 rounded-full bg-black/80 backdrop-blur-sm"
            style={{
                translateX: cursorX,
                translateY: cursorY,
            }}
        />
    );
}

export default CustomCursor;
