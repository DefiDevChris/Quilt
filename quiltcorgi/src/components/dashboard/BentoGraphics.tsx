import React from 'react';

interface GraphicProps extends React.SVGProps<SVGSVGElement> {}

const baseProps = {
  viewBox: "0 0 100 100",
  fill: "none",
  strokeWidth: 3,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function NewDesignGraphic(props: GraphicProps) {
  return (
    <svg {...baseProps} {...props}>
      {/* Fabric Block / Canvas */}
      <rect x="15" y="35" width="50" height="50" rx="4" />
      <rect x="23" y="43" width="34" height="34" rx="2" strokeWidth="2" strokeDasharray="4 4" />
      
      {/* Spool Top Cap */}
      <rect x="65" y="15" width="24" height="6" rx="2" />
      {/* Spool Body */}
      <rect x="70" y="21" width="14" height="48" />
      {/* Spool Bottom Cap */}
      <rect x="65" y="69" width="24" height="6" rx="2" />
      
      {/* Thread wraps around the spool body */}
      <line x1="70" y1="30" x2="84" y2="35" strokeWidth="2" />
      <line x1="70" y1="40" x2="84" y2="45" strokeWidth="2" />
      <line x1="70" y1="50" x2="84" y2="55" strokeWidth="2" />
      <line x1="70" y1="60" x2="84" y2="65" strokeWidth="2" />
      
      {/* Needle piercing the fabric */}
      <line x1="55" y1="20" x2="35" y2="60" />
      <ellipse cx="53" cy="24" rx="1.5" ry="4" transform="rotate(-26.5 53 24)" strokeWidth="2" />
      
      {/* Loose thread connecting spool and needle */}
      <path d="M 84 40 C 95 30, 90 5, 75 10 C 60 15, 65 30, 53 24" />
    </svg>
  );
}

export function PhotoToPatternGraphic(props: GraphicProps) {
  return (
    <svg {...baseProps} {...props}>
      {/* Outer Viewfinder Frame */}
      <path d="M 20 35 L 20 20 L 35 20" />
      <path d="M 80 35 L 80 20 L 65 20" />
      <path d="M 20 65 L 20 80 L 35 80" />
      <path d="M 80 65 L 80 80 L 65 80" />

      {/* Center Quilt Block (Churndash style) */}
      <rect x="35" y="35" width="30" height="30" rx="2" />
      <line x1="45" y1="35" x2="45" y2="65" />
      <line x1="55" y1="35" x2="55" y2="65" />
      <line x1="35" y1="45" x2="65" y2="45" />
      <line x1="35" y1="55" x2="65" y2="55" />
      
      {/* Scanning Laser Line */}
      <line x1="10" y1="50" x2="90" y2="50" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
      
      {/* Small focus nodes */}
      <circle cx="50" cy="50" r="2" fill="currentColor" />
    </svg>
  );
}

export function MyQuiltbookGraphic(props: GraphicProps) {
  return (
    <svg {...baseProps} {...props}>
      {/* Open Book Cover */}
      <path d="M 50 85 C 35 85, 20 80, 15 75 L 15 25 C 25 30, 40 33, 50 35 C 60 33, 75 30, 85 25 L 85 75 C 80 80, 65 85, 50 85 Z" />
      {/* Book Spine Center Line */}
      <line x1="50" y1="35" x2="50" y2="85" />
      
      {/* Page depth markers (left & right) */}
      <path d="M 15 75 L 15 80 C 25 84, 38 87, 50 88 C 62 87, 75 84, 85 80 L 85 75" />
      <line x1="50" y1="85" x2="50" y2="88" />

      {/* Quilt Block Pattern on Right Page */}
      <rect x="58" y="45" width="20" height="26" rx="1" strokeWidth="2" />
      <line x1="58" y1="58" x2="78" y2="58" strokeWidth="2" />
      <line x1="68" y1="45" x2="68" y2="71" strokeWidth="2" />
      <line x1="58" y1="45" x2="68" y2="58" strokeWidth="1.5" />
      <line x1="78" y1="45" x2="68" y2="58" strokeWidth="1.5" />

      {/* Text lines on Left Page */}
      <line x1="22" y1="45" x2="42" y2="45" strokeWidth="2" />
      <line x1="22" y1="55" x2="38" y2="55" strokeWidth="2" />
      <line x1="22" y1="65" x2="40" y2="65" strokeWidth="2" />
    </svg>
  );
}

export function BrowsePatternsGraphic(props: GraphicProps) {
  return (
    <svg {...baseProps} {...props}>
      {/* 2x2 Grid representing browsing patterns */}
      <rect x="15" y="15" width="70" height="70" rx="4" />
      <line x1="50" y1="15" x2="50" y2="85" />
      <line x1="15" y1="50" x2="85" y2="50" />

      {/* Top Left: Log Cabin Pattern */}
      <rect x="23" y="23" width="10" height="10" />
      <path d="M 38 20 L 38 38 L 20 38" strokeWidth="2" />
      <path d="M 45 15 L 45 45 L 15 45" strokeWidth="2" />

      {/* Top Right: Flying Geese & Triangles */}
      <path d="M 50 15 L 85 50" />
      <path d="M 50 50 L 85 15" />
      <circle cx="67.5" cy="32.5" r="4" fill="currentColor" />

      {/* Bottom Left: Four Patch */}
      <rect x="23" y="58" width="10" height="10" />
      <rect x="33" y="68" width="10" height="10" />

      {/* Bottom Right: Stripes/Piecing */}
      <line x1="55" y1="58" x2="80" y2="58" strokeWidth="2" />
      <line x1="55" y1="68" x2="80" y2="68" strokeWidth="2" />
      <line x1="55" y1="78" x2="80" y2="78" strokeWidth="2" />
    </svg>
  );
}

export function CommunityGraphic(props: GraphicProps) {
  return (
    <svg {...baseProps} {...props}>
      {/* Heart made of patchwork blocks. Beautiful, symmetrical vector heart. */}
      {/* A standard heart mathematically is represented cleanly via Beziers. */}
      <path d="M 50 85 C 50 85, 15 60, 15 35 C 15 20, 30 10, 45 20 C 50 24, 50 24, 50 24 C 50 24, 50 24, 55 20 C 70 10, 85 20, 85 35 C 85 60, 50 85, 50 85 Z" />
      
      {/* Patchwork seam lines across the heart */}
      <path d="M 15 45 C 35 40, 65 40, 85 45" />
      <path d="M 33 22 L 35 70" />
      <path d="M 67 22 L 65 70" />

      {/* Stitching dashes across the seams */}
      <line x1="25" y1="46" x2="25" y2="40" strokeWidth="2" />
      <line x1="45" y1="43" x2="45" y2="37" strokeWidth="2" />
      <line x1="55" y1="43" x2="55" y2="37" strokeWidth="2" />
      <line x1="75" y1="46" x2="75" y2="40" strokeWidth="2" />

      {/* Sub-block lines */}
      <line x1="33" y1="55" x2="50" y2="42" />
      <line x1="67" y1="55" x2="50" y2="42" />
    </svg>
  );
}
