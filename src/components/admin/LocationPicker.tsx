
'use client';

import * as React from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import type { Location } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Fullscreen, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card } from '../ui/card';
import { Label } from '../ui/label';


const MapControl = ({
    onLocationSelect,
    initialLocation,
}: {
    onLocationSelect: (location: Location) => void;
    initialLocation: Location | null;
}) => {
    const map = useMap();
    const geocodingLibrary = useMapsLibrary('geocoding');
    const [geocoder, setGeocoder] = React.useState<google.maps.Geocoder | null>(null);
    const [markerPos, setMarkerPos] = React.useState<Location | null>(initialLocation);
    
    React.useEffect(() => {
        if (geocodingLibrary) {
            setGeocoder(new geocodingLibrary.Geocoder());
        }
    }, [geocodingLibrary]);

    React.useEffect(() => {
        if (!map) return;
        
        const clickListener = map.addListener('click', async (e: google.maps.MapMouseEvent) => {
            if (e.latLng && geocoder) {
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                try {
                    const response = await geocoder.geocode({ location: { lat, lng } });
                    if (response.results[0]) {
                        const newLocation = { lat, lng, label: response.results[0].formatted_address };
                        setMarkerPos(newLocation);
                        onLocationSelect(newLocation);
                    }
                } catch (error) {
                    console.error('Geocoder failed:', error);
                }
            }
        });

        return () => {
            google.maps.event.removeListener(clickListener);
        };

    }, [map, onLocationSelect, geocoder]);

    React.useEffect(() => {
        if(initialLocation) {
            setMarkerPos(initialLocation);
            if (map) {
                map.setCenter({ lat: initialLocation.lat, lng: initialLocation.lng });
                map.setZoom(15);
            }
        }
    }, [initialLocation, map]);

    return (
        <>
            {markerPos && <AdvancedMarker position={markerPos} />}
        </>
    );
};


const LocationPicker = ({ open, onOpenChange, onLocationSelect, initialLocation }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLocationSelect: (location: Location) => void;
    initialLocation: Location | null;
}) => {
    const [selectedLocation, setSelectedLocation] = React.useState<Location | null>(null);
    const [inputValue, setInputValue] = React.useState('');
    const [suggestions, setSuggestions] = React.useState<google.maps.places.AutocompletePrediction[]>([]);
    const { toast } = useToast();
    
    const placesLibrary = useMapsLibrary('places');
    const geocodingLibrary = useMapsLibrary('geocoding');
    const [autocompleteService, setAutocompleteService] = React.useState<google.maps.places.AutocompleteService | null>(null);
    const [geocoder, setGeocoder] = React.useState<google.maps.Geocoder | null>(null);
    
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    React.useEffect(() => {
        if (placesLibrary) {
            setAutocompleteService(new placesLibrary.AutocompleteService());
        }
        if (geocodingLibrary) {
            setGeocoder(new geocodingLibrary.Geocoder());
        }
    }, [placesLibrary, geocodingLibrary]);

    React.useEffect(() => {
        if (open) {
            setSelectedLocation(initialLocation);
            setInputValue(initialLocation?.label || '');
        } else {
            setSuggestions([]);
        }
    }, [open, initialLocation]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        if (autocompleteService && value.length > 2) {
            autocompleteService.getPlacePredictions({ input: value }, (predictions, status) => {
                if (status === 'OK' && predictions) {
                    setSuggestions(predictions);
                } else {
                    setSuggestions([]);
                }
            });
        } else {
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = (prediction: google.maps.places.AutocompletePrediction) => {
        setInputValue(prediction.description);
        setSuggestions([]);

        if (geocoder && prediction.place_id) {
            geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
                if (status === 'OK' && results && results[0].geometry) {
                    const { location } = results[0].geometry;
                    const newLocation = { lat: location.lat(), lng: location.lng(), label: prediction.description };
                    setSelectedLocation(newLocation);
                } else {
                    toast({title: 'Geocoding Error', description: 'Could not find location details.', variant: 'destructive'})
                }
            });
        }
    };
    
    const handleConfirm = () => {
        if (selectedLocation) {
            onLocationSelect(selectedLocation);
        }
        onOpenChange(false);
    };

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
    
    const mapContainerRef = React.useRef<HTMLDivElement>(null);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            mapContainerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0">
                 <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Select a Location</DialogTitle>
                </DialogHeader>
                <div className="flex-grow relative px-6 pb-2" ref={mapContainerRef}>
                    <APIProvider apiKey={apiKey} solutionChannel="GMP_visgl_rgm_v1_A">
                        <Map
                            defaultCenter={initialLocation || { lat: 23.8103, lng: 90.4125 }}
                            defaultZoom={13}
                            mapId="tour-console-map"
                            gestureHandling={'greedy'}
                            disableDefaultUI={true}
                            className="h-full w-full rounded-md"
                        >
                           <MapControl initialLocation={selectedLocation} onLocationSelect={setSelectedLocation} />
                        </Map>
                         <div className="absolute top-2 left-8">
                            <div className="relative">
                               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search for a location..."
                                    value={inputValue}
                                    onChange={handleInputChange}
                                    className="pl-10 w-72"
                                />
                                {suggestions.length > 0 && (
                                    <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto">
                                        <div className="p-2">
                                            {suggestions.map(suggestion => (
                                            <div
                                                key={suggestion.place_id}
                                                onClick={() => handleSuggestionClick(suggestion)}
                                                className="p-2 text-sm rounded-md cursor-pointer hover:bg-accent"
                                            >
                                                {suggestion.description}
                                            </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}
                            </div>
                         </div>
                         <Button variant="outline" size="icon" className="absolute top-2 right-8" onClick={toggleFullScreen}>
                             <Fullscreen className="h-4 w-4" />
                         </Button>
                    </APIProvider>
                </div>
                 <div className="px-6 pb-6 space-y-2">
                    <Label>Selected Location</Label>
                    <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground truncate flex items-center">
                        {selectedLocation?.label || 'No location selected'}
                    </div>
                 </div>
                 <DialogFooter className="p-6 pt-0">
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleConfirm} disabled={!selectedLocation}>Confirm Location</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const LocationPickerWrapper = (props: any) => (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!} libraries={['places', 'geocoding']}>
        <LocationPicker {...props} />
    </APIProvider>
);

export default LocationPickerWrapper;
