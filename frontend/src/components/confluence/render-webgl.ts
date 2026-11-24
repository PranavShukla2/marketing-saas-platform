import { DEEP_RGB, STREAM_RGB, UNIFIED_RGB, type Field } from "./sim";

/**
 * Raw WebGL2 renderer — no three.js. Same trail trick as the canvas renderer
 * (a translucent deep-water quad over the previous frame, which needs
 * preserveDrawingBuffer), then every particle in one drawArrays(POINTS) call
 * from a single interleaved buffer: x, y, r, g, b.
 *
 * Returns null when WebGL2 is unavailable so the caller can fall back.
 */
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
in vec3 v_col; out vec4 o;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.2, length(c));
  o = vec4(v_col, a);
}`;
const VS_QUAD = `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;
const FS_QUAD = `#version 300 es
precision mediump float;
uniform vec4 u_col; out vec4 o;
void main() { o = u_col; }`;

function program(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const p = gl.createProgram()!;
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    gl.attachShader(p, s);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link");
  return p;
}

export function createWebglRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, preserveDrawingBuffer: true });
  if (!gl || gl.isContextLost()) return null;

  let pts: WebGLProgram, quad: WebGLProgram;
  try {
    pts = program(gl, VS_POINTS, FS_POINTS);
    quad = program(gl, VS_QUAD, FS_QUAD);
  } catch {
    // A driver that can't compile these is a driver to fall back from, not
    // a page to crash.
    return null;
  }
  const uSize = gl.getUniformLocation(pts, "u_size");
  const uPt = gl.getUniformLocation(pts, "u_pt");
  const uCol = gl.getUniformLocation(quad, "u_col");

  const quadBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const quadVao = gl.createVertexArray();
  gl.bindVertexArray(quadVao);
  const qa = gl.getAttribLocation(quad, "a_pos");
  gl.enableVertexAttribArray(qa);
  gl.vertexAttribPointer(qa, 2, gl.FLOAT, false, 0, 0);

  const ptBuf = gl.createBuffer();
  const ptVao = gl.createVertexArray();
  gl.bindVertexArray(ptVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf);
  const aPos = gl.getAttribLocation(pts, "a_pos");
  const aCol = gl.getAttribLocation(pts, "a_col");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 20, 0);
  gl.enableVertexAttribArray(aCol);
  gl.vertexAttribPointer(aCol, 3, gl.FLOAT, false, 20, 8);
  gl.bindVertexArray(null);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  let data = new Float32Array(0);
  let dpr = 1;
  const deep = DEEP_RGB.map((v) => v / 255);
  const src = STREAM_RGB.map((c) => c.map((v) => v / 255));
  const uni = UNIFIED_RGB.map((v) => v / 255);

  return {
    name: "webgl2" as const,
    resize(w: number, h: number, ratio: number) {
      dpr = ratio;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(deep[0], deep[1], deep[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
    draw(f: Field, w: number, h: number) {
      // Fade the previous frame toward deep water.
      gl.useProgram(quad);
      gl.uniform4f(uCol, deep[0], deep[1], deep[2], 0.16);
      gl.bindVertexArray(quadVao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

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
      gl.useProgram(pts);
      gl.uniform2f(uSize, w, h);
      gl.uniform1f(uPt, 2.4 * dpr);
      gl.bindVertexArray(ptVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, ptBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
      gl.drawArrays(gl.POINTS, 0, f.n);
      gl.bindVertexArray(null);
    },
    // Free what we made, but leave the context alive: a canvas hands back the
    // same context on the next getContext(), so losing it here broke React
    // StrictMode's mount → unmount → mount in dev (every shader then failed).
    dispose() {
      gl.deleteBuffer(quadBuf);
      gl.deleteBuffer(ptBuf);
      gl.deleteVertexArray(quadVao);
      gl.deleteVertexArray(ptVao);
      gl.deleteProgram(pts);
      gl.deleteProgram(quad);
    },
  };
}
