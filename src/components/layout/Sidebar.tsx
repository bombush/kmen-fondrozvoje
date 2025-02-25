"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Sidebar() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Link href="/" className="text-xl font-bold font-[family-name:var(--font-geist-sans)]">
        Fond Rozvoje
      </Link>
      <nav className="flex flex-col gap-2">
        <Link href="/projects">
          <Button variant="ghost" className="w-full justify-start">Projects</Button>
        </Link>
        <Link href="/users">
          <Button variant="ghost" className="w-full justify-start">Users</Button>
        </Link>
      </nav>
    </div>
  )
} 