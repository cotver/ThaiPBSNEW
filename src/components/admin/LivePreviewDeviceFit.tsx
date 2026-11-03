'use client'

import { useLivePreviewContext } from '@payloadcms/ui'
import { useEffect } from 'react'

const fitClass = 'ipj-device-fit'

// Payload's Live Preview "zoom" works like browser zoom: at 50% a 390px phone is rendered 780px
// wide, so the website lays out for the wrong screen. With a device size picked, we render the page
// at exactly that size and scale it down visually to fit the panel (styles in custom.scss).
export const LivePreviewDeviceFit = () => {
  const { breakpoint, isLivePreviewing, setZoom, size, zoom } = useLivePreviewContext()
  const width = Number(size?.width)
  const height = Number(size?.height)
  const isDevice = Boolean(isLivePreviewing && breakpoint && breakpoint !== 'responsive' && width > 0 && height > 0)

  // Our scaling replaces Payload's zoom; keep it at 100% so its own sizing stays neutral.
  useEffect(() => {
    if (isDevice && zoom !== 1) setZoom(1)
  }, [isDevice, setZoom, zoom])

  useEffect(() => {
    if (!isDevice) return

    let main: HTMLElement | null = null
    let observer: ResizeObserver | undefined
    let frame = 0

    const fit = () => {
      if (!main) return
      const style = getComputedStyle(main)
      const availableWidth = main.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
      const availableHeight = main.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
      const scale = Math.min(1, availableWidth / width, availableHeight / height)
      main.classList.add(fitClass)
      main.style.setProperty('--ipj-device-width', `${width}px`)
      main.style.setProperty('--ipj-device-height', `${height}px`)
      main.style.setProperty('--ipj-device-scale', String(Math.max(scale, 0.05)))
      main.dataset.deviceLabel = `${width} × ${height} · ${Math.round(scale * 100)}%`
    }

    // The preview panel mounts after the toggle, so wait for it.
    const attach = () => {
      main = document.querySelector<HTMLElement>('.live-preview-window__main')
      if (!main) {
        frame = requestAnimationFrame(attach)
        return
      }
      observer = new ResizeObserver(fit)
      observer.observe(main)
      fit()
    }
    attach()

    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      if (main) {
        main.classList.remove(fitClass)
        delete main.dataset.deviceLabel
      }
    }
  }, [height, isDevice, width])

  return null
}
