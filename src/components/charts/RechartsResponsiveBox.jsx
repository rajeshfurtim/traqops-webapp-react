import { useRef, useLayoutEffect, useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import { ResponsiveContainer } from 'recharts'

const MIN_PX = 8

/**
 * Recharts ResponsiveContainer measures its parent; during sidebar width animation
 * width/height can be 0 → "width(-1) height(-1)" warnings and heavy reflows.
 * This wrapper debounces ResizeObserver updates and only mounts the chart when size is valid.
 */
export default function RechartsResponsiveBox({ height, debounceMs = 100, children }) {
  const ref = useRef(null)
  const [dims, setDims] = useState(null)

  const measure = useCallback(() => {
    const el = ref.current
    if (!el) return
    const w = el.clientWidth
    const h = el.clientHeight
    if (w > MIN_PX && h > MIN_PX) {
      setDims({ width: w, height: h })
    } else {
      setDims(null)
    }
  }, [])

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    let timeoutId
    const onResize = () => {
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(measure, debounceMs)
    }

    const ro = new ResizeObserver(onResize)
    ro.observe(el)
    measure()

    return () => {
      window.clearTimeout(timeoutId)
      ro.disconnect()
    }
  }, [height, debounceMs, measure])

  return (
    <Box
      ref={ref}
      sx={{
        width: '100%',
        height,
        minHeight: height,
        minWidth: 0,
        position: 'relative',
        flexShrink: 0
      }}
    >
      {dims ? (
        <ResponsiveContainer width={dims.width} height={dims.height}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </Box>
  )
}
