"use client"

import { useLanguage } from "@/components/language-provider"
import translations from "@/lib/translations"

export function useTranslation() {
  const { language } = useLanguage()

  const t = (key: string) => {
    return translations[language][key] || key
  }

  return { t }
}
