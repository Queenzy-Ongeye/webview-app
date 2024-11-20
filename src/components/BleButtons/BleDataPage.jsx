'use client'

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge, ChevronDown, ChevronUp, Info } from 'lucide-react'
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "../reusableCards/utils"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../reusableCards/cards"
import { useLocation } from "react-router-dom"

// Tooltip components
const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

// ScrollArea component (simplified for this example)
const ScrollArea = ({ className, children, ...props }) => (
  <div className={cn("overflow-auto", className)} {...props}>
    {children}
  </div>
)

// CharacteristicCard component
const CharacteristicCard = ({ characteristic, uuid }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-semibold text-primary">
            {characteristic.name || "Unnamed Characteristic"}
          </CardTitle>
          <Badge className="font-mono text-xs">
            {uuid}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {characteristic.desc && (
            <p className="text-sm text-muted-foreground">{characteristic.desc}</p>
          )}
          {characteristic.realVal !== undefined && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Value:</span>
              <code className="px-2 py-1 bg-muted rounded-md text-sm">{characteristic.realVal.toString()}</code>
            </div>
          )}
          {characteristic.properties && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Properties:</span>
              <span className="text-sm">{characteristic.properties}</span>
            </div>
          )}
          {characteristic.descMap && Object.keys(characteristic.descMap).length > 0 && (
            <>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center text-sm font-medium text-primary hover:underline"
              >
                {isExpanded ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
                {isExpanded ? "Hide" : "Show"} Descriptors
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ScrollArea className="h-[100px] w-full rounded-md border p-4">
                      <div className="space-y-2">
                        {Object.entries(characteristic.descMap).map(([descUuid, descItem]) => (
                          <div key={descUuid} className="flex justify-between items-center">
                            <code className="text-xs font-mono text-muted-foreground">{descUuid}</code>
                            <span className="text-sm">{descItem.desc}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ServiceCard component
const ServiceCard = ({ serviceData }) => (
  <Card>
    <CardHeader>
      <div className="flex justify-between items-start">
        <CardTitle>{serviceData.serviceNameEnum.replace(/_/g, " ")}</CardTitle>
        <Badge className="font-mono text-xs">
          {serviceData.uuid}
        </Badge>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {Object.entries(serviceData.characterMap).map(([uuid, characteristic]) => (
          <CharacteristicCard key={uuid} uuid={uuid} characteristic={characteristic} />
        ))}
      </div>
    </CardContent>
  </Card>
)

// Main DeviceDataPage component
export default function BleDataPage() {
  const location = useLocation();
  // const { deviceData = [] } = location.state || {};
  const {deviceData} = location.state || {}; 
  const categorizedData = useMemo(() => {
    const categories = {
      ATT: [],
      DTA: [],
      DIA: [],
      CMD: [],
      STS: [],
    }

    deviceData.forEach((serviceData) => {
      const category = serviceData.serviceNameEnum.split("_")[0]
      if (categories[category]) {
        categories[category].push(serviceData)
      }
    })

    return categories
  }, [deviceData])

  const availableCategories = Object.keys(categorizedData).filter(
    (category) => categorizedData[category].length > 0
  )

  if (deviceData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card>
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>No device data was found to display.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Device Data</h1>
      <TabsPrimitive.Tabs defaultValue={availableCategories[0]}>
        <TabsPrimitive.TabsList className="grid w-full grid-cols-5">
          {availableCategories.map((category) => (
            <TabsPrimitive.TabsTrigger key={category} value={category}>
              {category}
            </TabsPrimitive.TabsTrigger>
          ))}
        </TabsPrimitive.TabsList>
        {availableCategories.map((category) => (
          <TabsPrimitive.TabsContent key={category} value={category}>
            <div className="grid gap-6 mt-6">
              {categorizedData[category].map((serviceData, index) => (
                <ServiceCard key={`${serviceData.uuid}-${index}`} serviceData={serviceData} />
              ))}
            </div>
          </TabsPrimitive.TabsContent>
        ))}
      </TabsPrimitive.Tabs>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="fixed bottom-4 right-4 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors">
              <Info className="h-6 w-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Device data categories and their characteristics</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}