"use client";
import { useEffect, useRef } from "react";

const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
const FS = `precision highp float;uniform vec2 res;uniform float t;uniform float amp;uniform float yo;
float ln(float y,float x,float ph,float a,float w){return w/abs(y+sin(x+ph)*a);}
void main(){
  vec2 p=(gl_FragCoord.xy*2.0-res)/min(res.x,res.y);
  p.y+=yo;
  float sx=gl_FragCoord.x/res.x;
  float l1=ln(p.y,p.x*0.9,t,amp,0.0045);
  float l2=ln(p.y+0.05,p.x*1.3,-t*0.7,amp*0.7,0.003);
  float l3=ln(p.y-0.04,p.x*0.7,t*0.5+1.7,amp*0.5,0.0025);
  vec3 c1=mix(vec3(0.051,0.580,0.533),vec3(0.176,0.831,0.749),smoothstep(0.1,0.6,sx));
  c1=mix(c1,vec3(0.388,0.400,0.945),smoothstep(0.6,1.0,sx));
  vec3 c2=mix(vec3(0.176,0.831,0.749),vec3(0.051,0.580,0.533),sx);
  vec3 c3=mix(vec3(0.388,0.400,0.945),vec3(0.176,0.831,0.749),sx);
  float s=l1+l2+l3;
  vec3 c=mix((c1*l1+c2*l2+c3*l3)/max(s,1e-3),vec3(0.62,0.80,0.80),0.35);
  float fade=smoothstep(0.0,0.2,sx)*smoothstep(1.0,0.8,sx);
  float a=clamp(s*0.18,0.0,0.35)*fade;
  gl_FragColor=vec4(c*a,a);
}`;

/**
 * Three soft sound waves behind the hero (WebGL). `active` makes them swell
 * and move faster: something is playing, being typed or produced.
 */
export function HeroWave({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const gl = cv.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: true });
    if (!gl) return;
    const sh = (type: number, src: string) => { const o = gl.createShader(type)!; gl.shaderSource(o, src); gl.compileShader(o); return o; };
    const pr = gl.createProgram()!;
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(pr, "res"), uT = gl.getUniformLocation(pr, "t");
    const uA = gl.getUniformLocation(pr, "amp"), uY = gl.getUniformLocation(pr, "yo");
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let t = 0, amp = 0.2, raf = 0, visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(cv);

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5), w = cv.clientWidth, h = cv.clientHeight;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      gl.viewport(0, 0, cv.width, cv.height);
      const on = activeRef.current;
      amp += ((on ? 0.26 : 0.18) - amp) * 0.02;
      t += reduce ? 0 : on ? 0.006 : 0.0028;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, cv.width, cv.height);
      gl.uniform1f(uT, t);
      gl.uniform1f(uA, amp);
      gl.uniform1f(uY, window.innerWidth < 820 ? 0.95 : 0.62);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    frame();
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, []);

  return (
    <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full"
      style={{
        WebkitMaskImage: "linear-gradient(to bottom,transparent 0%,#000 30%,#000 80%,transparent 100%)",
        maskImage: "linear-gradient(to bottom,transparent 0%,#000 30%,#000 80%,transparent 100%)",
      }} />
  );
}
