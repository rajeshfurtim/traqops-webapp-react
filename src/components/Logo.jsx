import React from 'react'

/**
 * TraqOps Logo Component
 * Modern enterprise logo with central circle and four curved segments in pinwheel pattern
 * Dark purple/plum color scheme (#6B4C93)
 */
export default function Logo({ size = 40, className = '', variant = 'full' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
    >
      {/* Central Circle */}
      <circle cx="32" cy="32" r="8" fill="#6B4C93" />
      
      {/* Top Right Segment - curved segment pointing to top-right corner */}
      <path
        d="M 32 32 L 32 24 A 8 8 0 0 1 40 32 L 58 6 A 26 26 0 0 1 50 2 L 32 24 Z"
        fill="#6B4C93"
      />
      
      {/* Bottom Right Segment - curved segment pointing to bottom-right corner */}
      <path
        d="M 32 32 L 40 32 A 8 8 0 0 1 32 40 L 62 58 A 26 26 0 0 1 58 62 L 32 40 Z"
        fill="#6B4C93"
      />
      
      {/* Bottom Left Segment - curved segment pointing to bottom-left corner */}
      <path
        d="M 32 32 L 32 40 A 8 8 0 0 1 24 32 L 6 62 A 26 26 0 0 1 2 58 L 24 32 Z"
        fill="#6B4C93"
      />
      
      {/* Top Left Segment - curved segment pointing to top-left corner */}
      <path
        d="M 32 32 L 24 32 A 8 8 0 0 1 32 24 L 2 6 A 26 26 0 0 1 6 2 L 32 24 Z"
        fill="#6B4C93"
      />
    </svg>
  )
}
