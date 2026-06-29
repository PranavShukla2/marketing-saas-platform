const BLOBS = [
  { color: "#8b5cf6", top: "-10%", left: "-5%", size: 420, duration: "18s" },
  { color: "#ff9d8a", top: "10%", left: "70%", size: 380, duration: "22s" },
  { color: "#14b8a6", top: "55%", left: "5%", size: 360, duration: "20s" },
  { color: "#f5a623", top: "65%", left: "65%", size: 340, duration: "23s" },
];

export default function GlowBlobs({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`absolute inset-0 overflow-hidden pointer-events-none -z-10 ${className}`}>
      {BLOBS.map((blob, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-[100px] opacity-30 animate-drift"
          style={{
            background: blob.color,
            top: blob.top,
            left: blob.left,
            width: blob.size,
            height: blob.size,
            animationDuration: blob.duration,
          }}
        />
      ))}
    </div>
  );
}
