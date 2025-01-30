import { motion, useScroll } from "motion/react";
import { useState } from "react";

function Header() {
    const { scrollYProgress } = useScroll();
    const [bgOpacity, setBgOpacity] = useState(1);

    scrollYProgress.on("change", (latest) => {
        setBgOpacity(latest === 0 ? 1 : 0.8);
    });

    return (
        <motion.header
            className="sticky top-0 left-0 h-16 text-white flex items-center px-4 z-10"
            style={{ backgroundColor: `rgba(0, 0, 0, ${bgOpacity})` }}
            transition={{ duration: 0.5 }}
        >
            <h1 className="text-lg font-semibold">Placeholder</h1>
        </motion.header>
    );
}

export default Header;