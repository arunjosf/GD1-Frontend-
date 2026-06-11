import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { getToken } from '../api/auth';

const NavigationContext = createContext(null);

export function NavigationProvider({ children }) {
  const [navigationMode, setNavigationMode] = useState('none'); // 'none' | 'fullscreen' | 'floating'
  const [pickup, setPickup] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [currentGpsPos, setCurrentGpsPos] = useState(null);
  const [gpsWatcherId, setGpsWatcherId] = useState(null);
  const trackingConnectionRef = useRef(null);

  useEffect(() => {
    // Connect to TrackingHub whenever we have a pickup (not just during active navigation)
    // This ensures location updates flow as soon as navigation starts OR as a background tracker
    const shouldConnect = pickup?.bookingId && 
      (navigationMode === 'fullscreen' || navigationMode === 'floating' || navigationMode === 'background');
    if (!shouldConnect) return;

    const token = getToken('AccessToken');
    if (!token) return;

    console.log('[NavCtx] Connecting TrackingHub for bookingId:', pickup.bookingId);

    const connection = new HubConnectionBuilder()
      .withUrl("https://localhost:7108/hubs/tracking", { accessTokenFactory: () => token })
      .configureLogging(LogLevel.Warning)
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        console.log('[NavCtx] TrackingHub connected for bookingId:', pickup.bookingId);
        trackingConnectionRef.current = connection;
      })
      .catch(err => console.error('[NavCtx] TrackingHub connection failed:', err));

    return () => {
      if (trackingConnectionRef.current) {
        trackingConnectionRef.current.stop();
        trackingConnectionRef.current = null;
      }
    };
  }, [navigationMode, pickup?.bookingId]);

  useEffect(() => {
    if (trackingConnectionRef.current && currentGpsPos && pickup?.bookingId) {
      console.log('[NavCtx] Sending location update:', currentGpsPos, 'for bookingId:', pickup.bookingId);
      trackingConnectionRef.current.invoke("UpdateLocation", Number(pickup.bookingId), currentGpsPos[0], currentGpsPos[1])
        .catch(err => console.error('[NavCtx] Error sending location update:', err));
    }
  }, [currentGpsPos, pickup]);


  const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchRoute = async (startLat, startLon, endLat, endLon) => {
    const sLat = parseFloat(startLat);
    const sLon = parseFloat(startLon);
    const eLat = parseFloat(endLat);
    const eLon = parseFloat(endLon);

    if (isNaN(sLat) || isNaN(sLon) || isNaN(eLat) || isNaN(eLon)) {
      return;
    }

    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${sLon},${sLat};${eLon},${eLat}?overview=full&geometries=geojson`);
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setRouteCoords(coords);
          setDistance((route.distance / 1000).toFixed(1));
          setDuration(Math.round(route.duration / 60));
          return;
        }
      }
    } catch (err) {
      console.warn("OSRM Router failed, using Haversine fallback...", err);
    }

    const dist = calculateHaversineDistance(sLat, sLon, eLat, eLon);
    setDistance(dist.toFixed(1));
    setDuration(Math.round((dist / 40) * 60));
    setRouteCoords([[sLat, sLon], [eLat, eLon]]);
  };

  const startNavigation = (pickupDetails) => {
    if (!pickupDetails?.pickupLatitude || !pickupDetails?.pickupLongitude) {
      toast.error("Coordinates unresolved for this pickup.");
      return;
    }

    // Stop existing navigation if any
    if (gpsWatcherId !== null) {
      navigator.geolocation.clearWatch(gpsWatcherId);
    }

    setPickup(pickupDetails);
    setNavigationMode('fullscreen');

    if ("geolocation" in navigator) {
      // Immediate lookup to avoid blank start coordinates
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentGpsPos([latitude, longitude]);
          
          const isTransit = ['InTransit', 'INTRANSIT', 9, '9'].includes(pickupDetails.status);
          const destLat = isTransit ? pickupDetails.lotLatitude : pickupDetails.pickupLatitude;
          const destLon = isTransit ? pickupDetails.lotLongitude : pickupDetails.pickupLongitude;

          if (destLat && destLon) {
            fetchRoute(latitude, longitude, destLat, destLon);
          }
        },
        (error) => console.warn("Initial positioning error", error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userPos = [latitude, longitude];
          setCurrentGpsPos(userPos);
          
          const isTransit = ['InTransit', 'INTRANSIT', 9, '9'].includes(pickupDetails.status);
          const destLat = isTransit ? pickupDetails.lotLatitude : pickupDetails.pickupLatitude;
          const destLon = isTransit ? pickupDetails.lotLongitude : pickupDetails.pickupLongitude;

          if (destLat && destLon) {
            fetchRoute(latitude, longitude, destLat, destLon);
          }
        },
        (error) => {
          console.warn("GPS Tracking Warning:", error);
          // Do not call stopNavigation(), just warn
          // toast.error("GPS tracking issue: " + error.message, { id: 'gps-error' });
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 }
      );
      setGpsWatcherId(watchId);
    } else {
      toast.error("Geolocation is not supported by this device.");
      stopNavigation();
    }
  };

  // Start background GPS tracking (without full navigation UI)
  const startBackgroundTracking = (pickupDetails) => {
    if (!pickupDetails?.bookingId) return;

    if (gpsWatcherId !== null) {
      navigator.geolocation.clearWatch(gpsWatcherId);
    }

    setPickup(pickupDetails);
    setNavigationMode('background');

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentGpsPos([latitude, longitude]);
        },
        (error) => console.warn('[NavCtx] Background GPS initial error:', error),
        { enableHighAccuracy: false, maximumAge: 30000, timeout: 10000 }
      );

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentGpsPos([latitude, longitude]);
        },
        (error) => console.warn('[NavCtx] Background GPS watch error:', error),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 }
      );
      setGpsWatcherId(watchId);
    }
  };

  const stopNavigation = () => {
    if (gpsWatcherId !== null) {
      navigator.geolocation.clearWatch(gpsWatcherId);
      setGpsWatcherId(null);
    }
    setNavigationMode('none');
    setPickup(null);
    setRouteCoords([]);
    setDistance(null);
    setDuration(null);
    setCurrentGpsPos(null);
  };

  useEffect(() => {
    return () => {
      if (gpsWatcherId !== null) {
        navigator.geolocation.clearWatch(gpsWatcherId);
      }
    };
  }, [gpsWatcherId]);

  return (
    <NavigationContext.Provider value={{
      navigationMode,
      setNavigationMode,
      pickup,
      routeCoords,
      distance,
      duration,
      currentGpsPos,
      startNavigation,
      stopNavigation,
      startBackgroundTracking
    }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  return useContext(NavigationContext);
}
