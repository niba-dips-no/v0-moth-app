"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/hooks/use-translation"
import Image from "next/image"

export default function InfoPage() {
  const { t } = useTranslation()

  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">{t("readMore")}</h1>

      <Tabs defaultValue="project" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="project">{t("project")}</TabsTrigger>
          <TabsTrigger value="species">{t("species")}</TabsTrigger>
          <TabsTrigger value="sponsors">{t("sponsors")}</TabsTrigger>
          <TabsTrigger value="contact">{t("contact")}</TabsTrigger>
        </TabsList>

        <TabsContent value="project">
          <Card>
            <CardHeader>
              <CardTitle>{t("projectTitle")}</CardTitle>
              <CardDescription>{t("projectSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-video w-full">
                <Image
                  src="/placeholder.svg?height=300&width=500"
                  alt="Project"
                  fill
                  className="object-cover rounded-md"
                />
              </div>

              <p>{t("projectDescription1")}</p>
              <p>{t("projectDescription2")}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="species">
          <Card>
            <CardHeader>
              <CardTitle>{t("speciesTitle")}</CardTitle>
              <CardDescription>{t("speciesSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-video w-full">
                <Image
                  src="/placeholder.svg?height=300&width=500"
                  alt="Species"
                  fill
                  className="object-cover rounded-md"
                />
              </div>

              <p>{t("speciesDescription1")}</p>
              <p>{t("speciesDescription2")}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sponsors">
          <Card>
            <CardHeader>
              <CardTitle>{t("sponsorsTitle")}</CardTitle>
              <CardDescription>{t("sponsorsSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32">
                    <Image
                      src="/placeholder.svg?height=100&width=100"
                      alt="Sponsor 1"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-center mt-2">Sponsor 1</p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32">
                    <Image
                      src="/placeholder.svg?height=100&width=100"
                      alt="Sponsor 2"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-center mt-2">Sponsor 2</p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32">
                    <Image
                      src="/placeholder.svg?height=100&width=100"
                      alt="Sponsor 3"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-center mt-2">Sponsor 3</p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32">
                    <Image
                      src="/placeholder.svg?height=100&width=100"
                      alt="Sponsor 4"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-center mt-2">Sponsor 4</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>{t("contactTitle")}</CardTitle>
              <CardDescription>{t("contactSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{t("contactDescription")}</p>

              <div className="space-y-2">
                <p>
                  <strong>Email:</strong> contact@malerjakt.no
                </p>
                <p>
                  <strong>Phone:</strong> +47 123 45 678
                </p>
                <p>
                  <strong>Address:</strong> University of Oslo, Department of Biology, 0316 Oslo, Norway
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
