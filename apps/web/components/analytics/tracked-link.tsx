"use client"

import Link from "next/link"
import { trackEvent } from "@/lib/analytics"

type TrackedLinkProps = {
  href: string
  area: string
  year: number
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}

export function TrackedReportLink({
  href,
  area,
  year,
  className,
  style,
  children,
}: TrackedLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      style={style}
      onClick={() => trackEvent.relatorioAno(area, year)}
    >
      {children}
    </Link>
  )
}

type TrackedExternalLinkProps = {
  href: string
  area: string
  label: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}

export function TrackedExternalLink({
  href,
  area,
  label,
  className,
  style,
  children,
}: TrackedExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      onClick={() => trackEvent.fontClick(area, label)}
    >
      {children}
    </a>
  )
}
