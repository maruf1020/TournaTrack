
'use client';

import * as React from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import type { Location } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

const Directions = ({ start, end }: { start: Location, end: Location }) => {
    const map = useMap();
    const routesLibrary = useMapsLibrary('routes');
    const [directionsService, setDirectionsService] = React.useState<google.maps.DirectionsService | null>(null);
    const [directionsRenderer, setDirectionsRenderer] = React.useState<google.maps.DirectionsRenderer | null>(null);

    React.useEffect(() => {
        if (!routesLibrary || !map) return;
        setDirectionsService(new routesLibrary.DirectionsService());
        setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map }));
    }, [routesLibrary, map]);

    React.useEffect(() => {
        if (!directionsService || !directionsRenderer) return;

        directionsService.route({
            origin: { lat: start.lat, lng: start.lng },
            destination: { lat: end.lat, lng: end.lng },
            travelMode: google.maps.TravelMode.DRIVING,
        }).then(response => {
            directionsRenderer.setDirections(response);
        });

    }, [directionsService, directionsRenderer, start, end]);

    return null; // The renderer draws on the map, so this component doesn't render anything itself
};

const MapDisplay = ({ startLocation, endLocation }: {
    startLocation: Location,
    endLocation?: Location | null
}) => {
    const map = useMap();

    React.useEffect(() => {
      if (map && startLocation) {
        if (endLocation) {
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(new google.maps.LatLng(startLocation.lat, startLocation.lng));
            bounds.extend(new google.maps.LatLng(endLocation.lat, endLocation.lng));
            map.fitBounds(bounds, 50); // 50px padding
        } else {
            map.setCenter({ lat: startLocation.lat, lng: startLocation.lng });
            map.setZoom(14);
        }
      }
    }, [map, startLocation, endLocation]);

    return (
        <>
            <AdvancedMarker position={startLocation} title="Start Location" />
            {endLocation && <AdvancedMarker position={endLocation} title="End Location" />}
            {endLocation && <Directions start={startLocation} end={endLocation} />}
        </>
    )
}


const ProgramMapViewer = ({ open, onOpenChange, startLocation, endLocation }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    startLocation: Location;
    endLocation?: Location | null;
}) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return (
             <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Configuration Error</DialogTitle></DialogHeader>
                    <p>Google Maps API key is missing. Please add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to your .env file.</p>
                </DialogContent>
            </Dialog>
        );
    }
    
    // Determine the center and zoom for the map
    let center = { lat: startLocation.lat, lng: startLocation.lng };
    let zoom = 14;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-4">
                 <DialogHeader>
                    <DialogTitle>Location Map</DialogTitle>
                </DialogHeader>
                <div className="flex-grow relative">
                    <APIProvider apiKey={apiKey} solutionChannel="GMP_visgl_rgm_v1_A" libraries={['routes']}>
                        <Map
                            defaultCenter={center}
                            defaultZoom={zoom}
                            mapId="program-map-viewer"
                            gestureHandling={'greedy'}
                            disableDefaultUI={true}
                            className="h-full w-full rounded-md"
                        >
                            <MapDisplay startLocation={startLocation} endLocation={endLocation} />
                        </Map>
                    </APIProvider>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ProgramMapViewer;
