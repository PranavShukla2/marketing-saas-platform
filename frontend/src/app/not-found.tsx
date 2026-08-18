"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Matter from "matter-js";

export default function NotFound() {
    const sceneRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const renderRef = useRef<Matter.Render | null>(null);

    // Refs for the DOM elements we want to animate
    const headerRef = useRef<HTMLHeadingElement>(null);
    const textRef = useRef<HTMLParagraphElement>(null);
    const buttonRef = useRef<HTMLAnchorElement>(null);

    useEffect(() => {
        if (!sceneRef.current) return;

        // 1. Setup Matter.js Engine and World
        const engine = Matter.Engine.create();
        const world = engine.world;
        engineRef.current = engine;

        // 2. Setup Renderer (Invisible, just for calculating positions)
        const render = Matter.Render.create({
            element: sceneRef.current,
            engine: engine,
            options: {
                width: window.innerWidth,
                height: window.innerHeight,
                wireframes: false,
                background: "transparent",
            },
        });
        renderRef.current = render;

        // The DOM elements *are* the visuals — the canvas only exists to catch
        // mouse events. Without this, Matter draws every body as a random-coloured
        // rectangle, which is what put stray squares behind the pills.
        const invisible = { render: { visible: false } };

        // Add boundaries (walls and floor)
        const walls = [
            Matter.Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 25, window.innerWidth, 50, { isStatic: true, ...invisible }), // Floor
            Matter.Bodies.rectangle(-25, window.innerHeight / 2, 50, window.innerHeight, { isStatic: true, ...invisible }), // Left wall
            Matter.Bodies.rectangle(window.innerWidth + 25, window.innerHeight / 2, 50, window.innerHeight, { isStatic: true, ...invisible }), // Right wall
        ];
        Matter.World.add(world, walls);

        // 3. Create physics bodies for our DOM elements
        // We delay slightly to ensure DOM elements have rendered and got their dimensions
        const createBodies = () => {
            const elements = [
                { ref: headerRef, domScale: 1 },
                { ref: textRef, domScale: 1 },
                { ref: buttonRef, domScale: 1 },
            ];

            const bodies = elements.map((item, index) => {
                if (!item.ref.current) return null;
                const rect = item.ref.current.getBoundingClientRect();

                // Create a body that matches the DOM element's size and starting position
                const body = Matter.Bodies.rectangle(
                    rect.left + rect.width / 2,
                    rect.top + rect.height / 2,
                    rect.width,
                    rect.height,
                    {
                        restitution: 0.6, // Bounciness
                        friction: 0.1,
                        density: 0.001,
                        // Give them slightly different starting angles/forces to make it look chaotic
                        angle: (Math.random() - 0.5) * 0.2,
                        ...invisible,
                    }
                );

                // Map the body back to the DOM element so we can update it in the loop
                (body as any).domElement = item.ref.current;
                return body;
            }).filter(Boolean) as Matter.Body[];

            Matter.World.add(world, bodies);

            // Add mouse control so user can throw them around
            const mouse = Matter.Mouse.create(render.canvas);
            const mouseConstraint = Matter.MouseConstraint.create(engine, {
                mouse: mouse,
                constraint: {
                    stiffness: 0.2,
                    render: {
                        visible: false,
                    },
                },
            });
            Matter.World.add(world, mouseConstraint);

            // Keep the mouse in sync with rendering
            render.mouse = mouse;
        };

        // Need a tiny timeout to ensure React has fully painted the DOM nodes at their original positions
        setTimeout(createBodies, 50);

        // 4. Start the engine and renderer
        Matter.Runner.run(Matter.Runner.create(), engine);
        Matter.Render.run(render);

        // 5. Update DOM elements to match Physics bodies
        const updateDOM = () => {
            const bodies = Matter.Composite.allBodies(engine.world);
            bodies.forEach((body) => {
                if ((body as any).domElement) {
                    const domElement = (body as any).domElement as HTMLElement;
                    const { x, y } = body.position;

                    // Apply position and rotation to the actual HTML element
                    // We translate by -50% to center the element on the physics body's center
                    domElement.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${body.angle}rad)`;

                    // absolute positioning is critical for this to work
                    domElement.style.position = 'absolute';
                    domElement.style.top = '0';
                    domElement.style.left = '0';
                    domElement.style.margin = '0';
                }
            });
            requestAnimationFrame(updateDOM);
        };

        requestAnimationFrame(updateDOM);

        // Cleanup
        return () => {
            Matter.Render.stop(render);
            Matter.Engine.clear(engine);
            if (render.canvas) {
                render.canvas.remove();
            }
            // Remove all elements from the world before throwing away
            Matter.World.clear(world, false);
        };
    }, []);

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[var(--ink)] text-slate-200 font-sans selection:bg-[var(--violet)]/30">
            {/* Ambient brand glow — same indigo/violet wash as the landing page,
                so a wrong URL still feels like ArbFlow. */}
            <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
                <div
                    className="absolute -top-40 -left-32 h-[38rem] w-[38rem] rounded-full opacity-30 blur-3xl"
                    style={{ background: "radial-gradient(circle, var(--indigo), transparent 65%)" }}
                />
                <div
                    className="absolute -bottom-52 -right-24 h-[34rem] w-[34rem] rounded-full opacity-25 blur-3xl"
                    style={{ background: "radial-gradient(circle, var(--violet), transparent 65%)" }}
                />
            </div>

            {/* Matter.js will inject a canvas here to handle mouse events, but it will be transparent */}
            <div
                ref={sceneRef}
                className="absolute inset-0 z-10 pointer-events-auto cursor-grab active:cursor-grabbing"
            />

            {/* These elements start perfectly centered, then Matter.js takes over their transform styles */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
                <h1
                    ref={headerRef}
                    className="rounded-full bg-white px-14 py-5 text-8xl font-black tracking-tight text-[var(--ink)] pointer-events-auto cursor-grab active:cursor-grabbing select-none shadow-2xl"
                >
                    404
                </h1>

                <p
                    ref={textRef}
                    className="mt-6 rounded-full bg-white/10 px-8 py-4 text-xl font-light text-slate-200 pointer-events-auto cursor-grab active:cursor-grabbing select-none whitespace-nowrap backdrop-blur-sm"
                >
                    Looks like gravity broke on this page.
                </p>

                <Link
                    href="/"
                    ref={buttonRef}
                    className="mt-6 rounded-full px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-[var(--indigo)]/40 hover:opacity-90 transition-opacity pointer-events-auto cursor-pointer inline-block"
                    style={{ background: "linear-gradient(100deg, var(--indigo), var(--violet))" }}
                    // We need to stop propagation so clicking the link actually navigates instead of just being dragged by matter-js
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    Take me home
                </Link>
            </div>

            {/* Nobody discovers the physics unless you tell them. Pinned to the
                top — the pills pile up along the bottom, which would cover it. */}
            <p className="absolute inset-x-0 top-10 z-20 text-center text-xs uppercase tracking-[0.2em] text-slate-500 pointer-events-none">
                Grab the pills and throw them around
            </p>
        </div>
    );
}
