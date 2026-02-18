export default defineNuxtPlugin(() => {
  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey) e.preventDefault()
  }

  const onKeydown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase()
    const isZoomKey =
      (e.ctrlKey || e.metaKey) && (key === "+" || key === "-" || key === "=" || key === "0")

    if (isZoomKey) e.preventDefault()
  }

  window.addEventListener("wheel", onWheel, { passive: false })
  window.addEventListener("keydown", onKeydown)

  // optional cleanup (Nuxt usually keeps it for app lifetime)
})
