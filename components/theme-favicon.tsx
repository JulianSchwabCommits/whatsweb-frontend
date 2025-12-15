"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeFavicon() {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return

        const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement
        if (favicon) {
            // Use white icon for dark theme, black icon for light theme
            favicon.href = resolvedTheme === "dark" ? "/white-whatsweb.ico" : "/black-whatsweb.ico"
        }
    }, [resolvedTheme, mounted])

    return null
}
