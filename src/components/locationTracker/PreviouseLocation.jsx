import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Clock, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "../reusableCards/cards"
import { ScrollArea } from "../reusableCards/scroll-area"
import { Button } from "../reusableCards/Buttons"
import { Badge } from "../reusableCards/Badge"
import { useNavigate } from 'react-router-dom'

export default function PreviousLocations() {
  const [locations, setLocations] = useState([])
  const router = useNavigate()

  useEffect(() => {
    const storedLocations = localStorage.getItem('previousLocations')
    if (storedLocations) {
      setLocations(JSON.parse(storedLocations))
    }
  }, [])

  const handleSelectLocation = (location) => {
    router(`/?lat=${location.latitude}&lng=${location.longitude}`)
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <CardTitle className="text-3xl font-bold text-center sm:text-left">Previous Locations</CardTitle>
          <Button
            onClick={() => router('/scan-data')}
            size="sm"
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Map
          </Button>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No previous locations recorded.</p>
          ) : (
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <ul className="space-y-4">
                {locations.map((location, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    onClick={() => handleSelectLocation(location)}
                    className="bg-card hover:bg-accent transition-colors duration-200 p-4 rounded-lg shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-semibold">{location.name}</h3>
                          {location.isStopover && (
                            <Badge variant="secondary" className="mt-1">Stopover</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(location.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
};