import { useRef, useEffect, useState } from 'react'
import { Tooltip } from 'antd'
import { useSidebar } from '../context/SidebarContext'
import './EllipsisTooltip.css'

/**
 * Smart tooltip component that only shows tooltip when text is truncated
 * Uses div with explicit max-width for reliable flex layout measurement
 * 
 * @param {string} text - The text to display
 * @param {string} placement - Tooltip placement (default: 'right')
 * @param {object} tooltipProps - Additional props for Ant Design Tooltip
 */
export default function EllipsisTooltip({ text, placement = 'right', ...tooltipProps }) {
  const textRef = useRef(null)
  const [isOverflow, setIsOverflow] = useState(false)
  const { collapsed } = useSidebar()

  const checkOverflow = () => {
    const el = textRef.current
    if (el) {
      // Use requestAnimationFrame to ensure layout is painted
      requestAnimationFrame(() => {
        if (el) {
          // Check if text is truncated using scrollWidth > clientWidth
          const truncated = el.scrollWidth > el.clientWidth
          setIsOverflow(truncated)
        }
      })
    }
  }

  useEffect(() => {
    // Delay initial check to ensure layout is painted
    const timeoutId = setTimeout(() => {
      checkOverflow()
    }, 100)

    // Re-check on window resize
    const handleResize = () => {
      setTimeout(checkOverflow, 100)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [text])

  // Re-check when sidebar collapse state changes
  useEffect(() => {
    // Delay to allow sidebar animation to complete (0.2s transition + buffer)
    const timeoutId = setTimeout(() => {
      checkOverflow()
    }, 300)
    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsed])

  // Content using div with explicit max-width for reliable measurement
  const content = (
    <div ref={textRef} className="sidebar-menu-label">
      {text}
    </div>
  )

  // Only show tooltip if text is actually truncated
  if (isOverflow) {
    return (
      <Tooltip 
        title={text} 
        placement={placement}
        mouseEnterDelay={0.1}
        {...tooltipProps}
      >
        {content}
      </Tooltip>
    )
  }

  // Return plain text without tooltip if not truncated
  return content
}

