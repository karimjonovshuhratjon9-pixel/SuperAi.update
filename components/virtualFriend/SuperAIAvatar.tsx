import React from "react";

export type SuperAIAvatarState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "happy"
  | "confused"
  | "surprised"
  | "serious"
  | "excited";

interface SuperAIAvatarProps {
  state?: SuperAIAvatarState;
  /** Eye-contact offset, range -1..1 (computed from pointer). */
  eyeX?: number;
  eyeY?: number;
}

/**
 * SuperAI digital-human avatar — a premium stylized human bust with natural
 * proportions, realistic skin/hair gradients, blinking, breathing, head
 * motion, eye-contact tracking and expression states. Pure presentational
 * SVG; all motion is CSS-driven and respects prefers-reduced-motion.
 */
const SuperAIAvatar: React.FC<SuperAIAvatarProps> = ({
  state = "idle",
  eyeX = 0,
  eyeY = 0,
}) => {
  const style = {
    "--vf-eye-x": Math.max(-1, Math.min(1, eyeX)),
    "--vf-eye-y": Math.max(-1, Math.min(1, eyeY)),
  } as React.CSSProperties;

  return (
    <svg
      className={`vf-avatar-state-${state}`}
      style={style}
      viewBox="0 0 360 440"
      role="img"
      aria-label="SuperAI raqamli inson avatari"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="vfSkinG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8d8ba" />
          <stop offset="55%" stopColor="#eeb992" />
          <stop offset="100%" stopColor="#dda37a" />
        </linearGradient>
        <linearGradient id="vfHairBackG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#241610" />
          <stop offset="100%" stopColor="#140c08" />
        </linearGradient>
        <linearGradient id="vfHairFrontG" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#312019" />
          <stop offset="45%" stopColor="#241610" />
          <stop offset="100%" stopColor="#1a100b" />
        </linearGradient>
        <linearGradient id="vfJacketG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22324f" />
          <stop offset="100%" stopColor="#131d33" />
        </linearGradient>
        <linearGradient id="vfNeckG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e3aa83" />
          <stop offset="100%" stopColor="#c98b64" />
        </linearGradient>
        <radialGradient id="vfIrisL" cx="0.35" cy="0.3" r="1">
          <stop offset="0%" stopColor="#8a5c33" />
          <stop offset="55%" stopColor="#55351a" />
          <stop offset="100%" stopColor="#2c1c0e" />
        </radialGradient>
        <radialGradient id="vfIrisR" cx="0.65" cy="0.3" r="1">
          <stop offset="0%" stopColor="#8a5c33" />
          <stop offset="55%" stopColor="#55351a" />
          <stop offset="100%" stopColor="#2c1c0e" />
        </radialGradient>
      </defs>

      {/* ================= BODY (static bust) ================= */}
      <g>
        <path
          d="M44 440 Q46 382 112 348 Q154 330 180 330 Q206 330 248 348 Q314 382 316 440 Z"
          fill="url(#vfJacketG)"
        />
        <path
          d="M146 344 L180 372 L214 344 L206 330 L180 352 L154 330 Z"
          fill="#0e1730"
        />
        <path d="M172 362 L180 376 L188 362 Q180 356 172 362 Z" fill="#e8e3d9" />
        <path
          d="M70 400 Q120 362 170 344"
          stroke="rgba(160,200,255,0.14)"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M180 330 L180 440"
          stroke="rgba(34,211,238,0.45)"
          strokeWidth="2"
        />
        <path
          d="M150 344 Q180 320 210 344"
          stroke="rgba(120,170,220,0.28)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M152 300 Q180 330 208 300 L208 336 Q180 348 152 336 Z"
          fill="#b47a56"
        />
      </g>
      {/* ================= HEAD GROUP (tilts / sways) ================= */}
      <g className="vf-head-group">
        {/* neck */}
        <path
          d="M152 286 L152 320 Q180 334 208 320 L208 286 Q180 302 152 286 Z"
          fill="url(#vfNeckG)"
        />
        {/* neck shadow under chin */}
        <ellipse cx="180" cy="290" rx="34" ry="9" fill="rgba(120,70,45,0.28)" />

        {/* back hair */}
        <path
          d="M180 40 C256 40 304 90 300 172 C298 214 278 244 252 258 L108 258 C82 244 62 214 60 172 C56 90 104 40 180 40 Z"
          fill="url(#vfHairBackG)"
        />

        {/* head / face */}
        <path
          d="M180 80 C256 80 292 132 292 196 C292 246 262 292 180 292 C98 292 68 246 68 196 C68 132 104 80 180 80 Z"
          fill="url(#vfSkinG)"
        />
        {/* ears poking out at the sides */}
        <ellipse cx="69.5" cy="198" rx="10.5" ry="18" fill="url(#vfSkinG)" />
        <ellipse
          cx="290.5"
          cy="198"
          rx="10.5"
          ry="18"
          fill="url(#vfSkinG)"
        />
        {/* inner-ear shading */}
        <path d="M64 200 Q69 204 71 194" stroke="rgba(140,80,55,0.5)" strokeWidth="1.6" fill="none" />
        <path d="M296 200 Q291 204 289 194" stroke="rgba(140,80,55,0.5)" strokeWidth="1.6" fill="none" />

        {/* hair top volume */}
        <path
          d="M76 158 C80 86 130 52 180 52 C230 52 280 86 284 158 C276 96 234 66 180 66 C126 66 84 96 76 158 Z"
          fill="url(#vfHairFrontG)"
        />

        {/* face side shading */}
        <path d="M76 176 C74 224 96 262 130 284 C104 260 88 220 92 180 Z" fill="rgba(140,80,50,0.1)" />
        <path d="M284 176 C286 224 264 262 230 284 C256 260 272 220 268 180 Z" fill="rgba(140,80,50,0.08)" />
        {/* chin highlight */}
        <ellipse cx="180" cy="276" rx="12" ry="4" fill="rgba(255,240,225,0.35)" />
      {/* face features */}
        <g>
          {/* eyebrows */}
          <path
            className="vf-brow vf-brow-left"
            d="M113 172 Q131 163 150 168"
            stroke="#2b1a10"
            strokeWidth="4.2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            className="vf-brow vf-brow-right"
            d="M210 168 Q229 163 247 172"
            stroke="#2b1a10"
            strokeWidth="4.2"
            fill="none"
            strokeLinecap="round"
          />

          {/* eyes (blink animated group) */}
          <g className="vf-eyes-group">
            {/* upper lash lines */}
            <path d="M112 189 Q132 179 152 189" stroke="#7a4b2e" strokeWidth="3.4" fill="none" />
            <path d="M208 189 Q228 179 248 189" stroke="#7a4b2e" strokeWidth="3.4" fill="none" />
            {/* lower lash hints */}
            <path d="M113 203 Q132 208 151 203" stroke="rgba(180,120,90,0.5)" strokeWidth="1.4" fill="none" />
            <path d="M209 203 Q228 208 247 203" stroke="rgba(180,120,90,0.5)" strokeWidth="1.4" fill="none" />
            {/* eye whites */}
            <ellipse cx="132" cy="196" rx="20" ry="12.5" fill="#fdf7f2" />
            <ellipse cx="228" cy="196" rx="20" ry="12.5" fill="#fdf7f2" />
            {/* iris + pupil + highlight (moves with eye-contact)) */}
            <g className="vf-pupils">
              <circle cx="131" cy="196.6" r="8.6" fill="url(#vfIrisL)" />
              <circle cx="229" cy="196.6" r="8.6" fill="url(#vfIrisR)" />
              <circle cx="131" cy="197" r="3.6" fill="#160d07" />
              <circle cx="229" cy="197" r="3.6" fill="#160d07" />
              <circle cx="128.8" cy="193.6" r="2" fill="#ffffff" opacity="0.92" />
              <circle cx="226.8" cy="193.6" r="2" fill="#ffffff" opacity="0.92" />
            </g>
          </g>

          {/* nose */}
          <path d="M180 200 C178 216 172 226 166 230" stroke="rgba(140,80,55,0.5)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M160 228 Q166 234 172 232" stroke="rgba(140,80,55,0.4)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M188 232 Q194 234 200 228" stroke="rgba(140,80,55,0.4)" strokeWidth="1.6" fill="none" strokeLinecap="round" />

          {/* ===== mouths ===== */}
          <g className="vf-mouth vf-mouth-neutral">
            <path d="M160 264 Q180 275 200 264" stroke="#8a4a3a" strokeWidth="3.4" fill="none" strokeLinecap="round" />
            <path d="M164 268 Q180 275 196 268" stroke="rgba(170,90,64,0.45)" strokeWidth="1.6" fill="none" />
          </g>
          <g className="vf-mouth vf-mouth-smile">
            <path d="M163 263 Q180 273 197 263 L197 268 Q180 277 163 268 Z" fill="#f7f2ea" />
            <path d="M157 262 Q180 282 203 262" stroke="#8a4a3a" strokeWidth="3.4" fill="none" strokeLinecap="round" />
          </g>
          <g className="vf-mouth vf-mouth-open">
            <ellipse cx="180" cy="263" rx="11.5" ry="13.5" fill="#8a3b34" stroke="#7c3a30" strokeWidth="1.5" />
            <path d="M170.5 257 Q180 261 189.5 257 L189.5 261 Q180 263.5 170.5 261 Z" fill="#f6f1ea" />
            <ellipse cx="180" cy="270.5" rx="6.2" ry="4.6" fill="#a8504a" />
          </g>
          <g className="vf-mouth vf-mouth-surprised">
            <ellipse cx="180" cy="264" rx="12.5" ry="14.5" fill="#7c3630" stroke="#6e2f2a" strokeWidth="2" />
            <ellipse cx="180" cy="266" rx="9" ry="10.5" fill="#3c141b" />
            <path d="M174 259 Q180 262 186 259 L185.5 262 Q180 264.5 174.5 262 Z" fill="#f6f1ea" />
            <ellipse cx="180" cy="271.5" rx="5.5" ry="4" fill="#a8504a" />
          </g>
          <g className="vf-mouth vf-mouth-thinking">
            <path d="M168 263 Q178 270.5 190 264.5" stroke="#8a4a3a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
            <path d="M170 266.5 Q178 270 188 266" stroke="rgba(170,90,64,0.45)" strokeWidth="1.5" fill="none" />
          </g>
          <g className="vf-mouth vf-mouth-serious">
            <path d="M162 264.5 Q180 269.5 198 264.5" stroke="#8a4a3a" strokeWidth="3.4" fill="none" strokeLinecap="round" />
            <path d="M166 268 Q180 272 194 268" stroke="rgba(170,90,64,0.45)" strokeWidth="1.5" fill="none" />
          </g>

          {/* blush (happy/excited) */}
          <g className="vf-blush">
            <ellipse cx="116" cy="230" rx="13" ry="7.5" fill="rgba(224,88,88,0.15)" />
            <ellipse cx="244" cy="230" rx="13" ry="7.5" fill="rgba(224,88,88,0.15)" />
          </g>
        </g>

        {/* front hair — side curtains framing the hairline */}
        <path
          d="M88 152 C86 112 112 84 150 80 C132 90 128 118 126 150 C124 172 120 190 112 204 C106 210 100 192 96 170 C92 164 90 158 88 152 Z"
          fill="url(#vfHairFrontG)"
        />
        <path
          d="M272 152 C274 112 248 84 210 80 C228 90 232 118 234 150 C236 172 240 190 248 204 C254 210 260 192 264 170 C268 164 270 158 272 152 Z"
          fill="url(#vfHairFrontG)"
        />
        <path
          d="M128 66 C142 62 158 60 180 60 C202 60 218 62 232 66 C216 76 196 80 180 80 C164 80 144 76 128 66 Z"
          fill="url(#vfHairFrontG)"
        />
      </g>
    </svg>
  );
};

export default SuperAIAvatar;