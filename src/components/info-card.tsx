export interface InfoCardProps {
    title: string;
    children: React.ReactNode;
    image?: string;
}

function InfoCard({
    title,
    children,
    image,
}: InfoCardProps) {
    return (
        <section
            className="h-[200vh] sm:h-screen flex items-center odd:place-self-end"
        >
            <div className={"max-w-2xl bg-white/80 m-4 rounded drop-shadow-lg flex flex-col sm:flex-row gap-4 " + (image != null ? "px-10 py-5" : "p-10")}>
                {image && (
                    <img
                        src={image}
                        alt={title}
                        className="aspect-square max-w-full sm:max-w-1/3"
                    />
                )}
                <div>
                    <h2 className="text-xl font-semibold mb-2">{title}</h2>
                    <p className="text-base text-gray-700">{children}</p>
                </div>
            </div>
        </section>
    );
}

export default InfoCard;