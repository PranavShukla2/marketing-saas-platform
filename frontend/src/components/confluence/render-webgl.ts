import { DEEP_RGB, STREAM_RGB, UNIFIED_RGB, type Field } from "./sim";

/**
 * Raw WebGL2 renderer for the Confluence — no three.js (see DECISIONS.md).
 *
 * Trails accumulate in an offscreen buffer over *black*, then each frame is
 * composited as deep water + trails. The spike faded the visible framebuffer
 * toward deep water instead, and 8-bit blending rounds the last few levels of
 * that fade to "no change", leaving permanent ghost streaks. Here:
 *   1. the trail buffer is half-float where the GPU can render to it, so the
 *      multiplicative fade reaches zero cleanly; and
 *   2. a tiny subtraction each frame guarantees it does even on RGBA8.
 * Particles add light rather than paint over, so dense water glows.
 *
 * Returns null when WebGL2 is unavailable or a shader won't compile, so the
 * caller keeps the static poster.
 */

const VS_QUAD = `#version 300 es
in vec2 a_pos; out vec2 v_uv;
void main() { v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const FS_SOLID = `#version 300 es
precision mediump float;
uniform vec4 u_col; out vec4 o;
void main() { o = u_col; }`;

const FS_COMPOSITE = `#version 300 es
precision mediump float;
in vec2 v_uv; uniform sampler2D u_trails; uniform vec3 u_deep; out vec4 o;
// max(…, 0): a float target isn't clamped, so the per-frame floor drives empty
// pixels slightly *negative* (−ε/(1−KEEP)) — left in, the whole scene sat
// three levels darker than the page around it, a visible seam.
void main() { o = vec4(min(u_deep + max(texture(u_trails, v_uv).rgb, 0.0), 1.0), 1.0); }`;

const VS_POINTS = `#version 300 es
in vec2 a_pos; in vec3 a_col;
uniform vec2 u_size; uniform float u_pt;
out vec3 v_col;
void main() {
  vec2 clip = (a_pos / u_size) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = u_pt;
  v_col = a_col;
}`;

const FS_POINTS = `#version 300 es
precision mediump float;
in vec3 v_col; uniform float u_alpha; out vec4 o;
void main() {
  float a = smoothstep(0.5, 0.15, length(gl_PointCoord - 0.5));
  o = vec4(v_col, a * u_alpha);
}`;

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const p = gl.createProgram()!;
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    gl.attachShader(p, s);
    gl.deleteShader(s);
  }
  gl.bindAttribLocation(p, 0, "a_pos");
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link");
  return p;
}

/** How much of the trail survives each frame. */
const KEEP = 0.86;

export function createWebglRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, powerPreference: "low-power" });
  if (!gl || gl.isContextLost()) return null;

  let solid: WebGLProgram, composite: WebGLProgram, points: WebGLProgram;
  try {
    solid = compile(gl, VS_QUAD, FS_SOLID);
    composite = compile(gl, VS_QUAD, FS_COMPOSITE);
    points = compile(gl, VS_POINTS, FS_POINTS);
  } catch {
    return null;
  }
  const floatTrails = !!gl.getExtension("EXT_color_buffer_float");
  const U = {
    solidCol: gl.getUniformLocation(solid, "u_col"),
    trails: gl.getUniformLocation(composite, "u_trails"),
    deep: gl.getUniformLocation(composite, "u_deep"),
    size: gl.getUniformLocation(points, "u_size"),
    pt: gl.getUniformLocation(points, "u_pt"),
    alpha: gl.getUniformLocation(points, "u_alpha"),
  };

  // Full-screen quad, shared by the fade, subtract and composite passes.
  const quadBuf = gl.createBuffer();
  const quadVao = gl.createVertexArray();
  gl.bindVertexArray(quadVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // Particles: one interleaved buffer of x, y, r, g, b.
  const ptBuf = gl.createBuffer();
  const ptVao = gl.createVertexArray();
  gl.bindVertexArray(ptVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf);
  const aCol = gl.getAttribLocation(points, "a_col");
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 20, 0);
  gl.enableVertexAttribArray(aCol);
  gl.vertexAttribPointer(aCol, 3, gl.FLOAT, false, 20, 8);
  gl.bindVertexArray(null);

  // Trail target, (re)made on resize.
  const fbo = gl.createFramebuffer();
  let tex: WebGLTexture | null = null;

  const deep = DEEP_RGB.map((v) => v / 255);
  const src = STREAM_RGB.map((c) => c.map((v) => v / 255));
  const uni = UNIFIED_RGB.map((v) => v / 255);
  let data = new Float32Array(0);
  let dpr = 1;

  function makeTarget(w: number, h: number) {
    if (tex) gl!.deleteTexture(tex);
    tex = gl!.createTexture();
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    if (floatTrails) gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA16F, w, h, 0, gl!.RGBA, gl!.HALF_FLOAT, null);
    else gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA8, w, h, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, null);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
    gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, tex, 0);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
  }

  return {
    name: "webgl2" as const,
    resize(w: number, h: number, ratio: number) {
      dpr = ratio;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      makeTarget(canvas.width, canvas.height);
    },
    draw(f: Field, w: number, h: number) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.enable(gl.BLEND);
      gl.useProgram(solid);
      gl.bindVertexArray(quadVao);

      // 1. Fade: trails *= KEEP.
      gl.blendEquation(gl.FUNC_ADD);
      gl.blendFunc(gl.ZERO, gl.SRC_ALPHA);
      gl.uniform4f(U.solidCol, 0, 0, 0, KEEP);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // 2. Floor: trails -= ε, so nothing can stall above zero.
      const eps = floatTrails ? 0.0015 : 1.2 / 255;
      gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.uniform4f(U.solidCol, eps, eps, eps, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // 3. Particles add light.
      if (data.length !== f.n * 5) {
        data = new Float32Array(f.n * 5);
        gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf);
        gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);
      }
      for (let i = 0, o = 0; i < f.n; i++, o += 5) {
        const c = src[f.src[i]], k = f.mix[i];
        data[o] = f.x[i];
        data[o + 1] = f.y[i];
        data[o + 2] = c[0] + (uni[0] - c[0]) * k;
        data[o + 3] = c[1] + (uni[1] - c[1]) * k;
        data[o + 4] = c[2] + (uni[2] - c[2]) * k;
      }
      gl.blendEquation(gl.FUNC_ADD);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.useProgram(points);
      gl.uniform2f(U.size, w, h);
      gl.uniform1f(U.pt, 2.8 * dpr);
      // A particle passes any one pixel briefly, so trails rarely reach the
      // steady state (alpha / (1 − KEEP)); 0.3 keeps a lone stream legible on
      // deep water while dense water still only glows, not blows out.
      gl.uniform1f(U.alpha, 0.3);
      gl.bindVertexArray(ptVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
      gl.drawArrays(gl.POINTS, 0, f.n);

      // 4. Composite deep water + trails to the screen.
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.disable(gl.BLEND);
      gl.useProgram(composite);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(U.trails, 0);
      gl.uniform3f(U.deep, deep[0], deep[1], deep[2]);
      gl.bindVertexArray(quadVao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindVertexArray(null);
    },
    // Free what we made but keep the context alive: a canvas hands back the
    // same context on the next getContext(), so losing it here broke React
    // StrictMode's mount → unmount → mount in dev.
    dispose() {
      gl.deleteBuffer(quadBuf);
      gl.deleteBuffer(ptBuf);
      gl.deleteVertexArray(quadVao);
      gl.deleteVertexArray(ptVao);
      gl.deleteFramebuffer(fbo);
      if (tex) gl.deleteTexture(tex);
      gl.deleteProgram(solid);
      gl.deleteProgram(composite);
      gl.deleteProgram(points);
    },
  };
}
