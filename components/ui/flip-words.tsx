"use client"

import { AnimatePresence, motion } from "framer-motion"
import * as React from "react"
import { cn } from "@/lib/cn"

type FlipWordsProps = Omit<React.ComponentProps<"span">, "children"> & {
  words: string[]
  duration?: number
}

function FlipWords({
  ref,
  words,
  duration = 3000,
  className,
  ...props
}: FlipWordsProps) {
  const localRef = React.useRef<HTMLSpanElement>(null)
  React.useImperativeHandle(ref as any, () => localRef.current as HTMLSpanElement)

  const [index, setIndex] = React.useState(0)

  React.useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length)
    }, duration)
    return () => clearInterval(id)
  }, [duration, words.length])

  return (
    <span
      data-slot="flip-words"
      ref={localRef}
      className="inline-block relative"
      style={{ minHeight: "1.2em", verticalAlign: "bottom" }}
      {...(props as any)}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          className={cn("inline-block", className)}
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -30, filter: "blur(6px)" }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export { FlipWords, type FlipWordsProps }
export default FlipWords
