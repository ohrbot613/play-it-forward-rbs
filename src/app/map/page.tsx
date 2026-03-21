"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  CATEGORIES,
  getCategoryEmoji,
  getCategoryLabel,
  formatDistance,
  getDistance,
  distanceKm,
  type Game,
  type GameCategory,
} from "@/lib/data";
import { fetchGames } from "@/lib/queries";
import {
  MapPin,
  X,
  Star,
  Users,
  Navigation,
  List,
  Locate,
  Filter,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

// RBS center
const CENTER_LAT = 31.738;
const CENTER_LNG = 34.9875;
const DEFAULT_ZOOM = 14.5;

// Category colors for markers
const CATEGORY_COLORS: Record<GameCategory, string> = {
  "board-games": "#7c3aed",
  "outdoor-toys": "#22c55e",
  "lego-building": "#f97316",
  magnets: "#3b82f6",
  playmobil: "#e8795a",
  puzzles: "#2dd4bf",
  other: "#9ca3af",
};

const RADIUS_OPTIONS = [
  { label: "1km", value: 1 },
  { label: "2km", value: 2 },
  { label: "5km", value: 5 },
  { label: "10km", value: 10 },
];

function buildGeoJSON(games: Game[]) {
  return {
    type: "FeatureCollection" as const,
    features: games.map((game) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [game.currentHolder.lng, game.currentHolder.lat],
      },
      properties: {
        id: game.id,
        title: game.title,
        category: game.category,
        emoji: getCategoryEmoji(game.category),
        color: CATEGORY_COLORS[game.category],
        rating: game.rating,
        ownershipType: game.ownershipType,
      },
    })),
  };
}

function createRadiusGeoJSON(
  lat: number,
  lng: number,
  radiusKm: number
): GeoJSON.Feature {
  const points = 64;
  const coords: [number, number][] = [];
  const earthRadius = 6371;
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dLat = (radiusKm / earthRadius) * (180 / Math.PI);
    const dLng =
      (radiusKm / (earthRadius * Math.cos((lat * Math.PI) / 180))) *
      (180 / Math.PI);
    coords.push([lng + dLng * Math.cos(angle), lat + dLat * Math.sin(angle)]);
  }
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coords] },
    properties: {},
  };
}

export default function MapPage() {
  const { t } = useLanguage();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [hasToken, setHasToken] = useState(true);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [radiusKm, setRadiusKm] = useState(2);
  const [categoryFilter, setCategoryFilter] = useState<GameCategory | "all">(
    "all"
  );
  const [showFilters, setShowFilters] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [gamesLoading, setGamesLoading] = useState(true);

  // Live game data — wired to fetchGames() Supabase query (REC-224).
  // Returns [] gracefully when the Supabase anon key is not yet configured.
  const [allGames, setAllGames] = useState<Game[]>([]);
  const allGamesRef = useRef<Game[]>([]);
  useEffect(() => {
    setGamesLoading(true);
    fetchGames()
      .then((liveGames) => {
        setAllGames(liveGames);
        allGamesRef.current = liveGames;
      })
      .catch((err) => {
        console.error("[map] fetchGames error:", err);
      })
      .finally(() => {
        setGamesLoading(false);
      });
  }, []);

  // Filter games
  const userLat = userLocation?.lat ?? CENTER_LAT;
  const userLng = userLocation?.lng ?? CENTER_LNG;

  const filteredGames = useMemo(() => {
    return allGames.filter((g) => {
      if (!g.available) return false;
      if (categoryFilter !== "all" && g.category !== categoryFilter)
        return false;
      const d = distanceKm(
        userLat,
        userLng,
        g.currentHolder.lat,
        g.currentHolder.lng
      );
      if (d > radiusKm) return false;
      return true;
    });
  }, [allGames, categoryFilter, radiusKm, userLat, userLng]);

  const gamesWithinRadius = filteredGames.length;

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setHasToken(false);
      return;
    }
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [CENTER_LNG, CENTER_LAT],
      zoom: DEFAULT_ZOOM,
      pitch: 0,
      attributionControl: false,
      maxZoom: 18,
      minZoom: 11,
    });

    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    map.on("load", () => {
      setMapReady(true);

      // Radius circle source + layer
      map.addSource("radius-circle", {
        type: "geojson",
        data: createRadiusGeoJSON(CENTER_LAT, CENTER_LNG, 2),
      });

      map.addLayer({
        id: "radius-fill",
        type: "fill",
        source: "radius-circle",
        paint: {
          "fill-color": "#7c3aed",
          "fill-opacity": 0.06,
        },
      });

      map.addLayer({
        id: "radius-border",
        type: "line",
        source: "radius-circle",
        paint: {
          "line-color": "#7c3aed",
          "line-width": 1.5,
          "line-dasharray": [4, 3],
          "line-opacity": 0.3,
        },
      });

      // Cluster source
      map.addSource("games", {
        type: "geojson",
        data: buildGeoJSON(allGamesRef.current.filter((g) => g.available)),
        cluster: true,
        clusterMaxZoom: 16,
        clusterRadius: 50,
      });

      // Cluster circles
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "games",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#7c3aed",
          "circle-radius": [
            "step",
            ["get", "point_count"],
            18,
            5,
            22,
            10,
            26,
          ],
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Cluster count labels
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "games",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 13,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      // Click cluster → zoom in
      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        if (!features.length) return;
        const clusterId = features[0].properties?.cluster_id;
        const source = map.getSource("games") as mapboxgl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom === undefined || zoom === null) return;
          const geometry = features[0].geometry;
          if (geometry.type === "Point") {
            map.easeTo({
              center: geometry.coordinates as [number, number],
              zoom: zoom,
              duration: 500,
            });
          }
        });
      });

      // Cursor change on hover
      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update radius circle when radius or user location changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const src = map.getSource("radius-circle") as mapboxgl.GeoJSONSource;
    if (src) {
      src.setData(
        createRadiusGeoJSON(userLat, userLng, radiusKm) as GeoJSON.GeoJSON
      );
    }
  }, [radiusKm, userLat, userLng, mapReady]);

  // Update game markers (HTML markers for emojis)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Update cluster source data
    const src = map.getSource("games") as mapboxgl.GeoJSONSource;
    if (src) {
      src.setData(buildGeoJSON(filteredGames) as GeoJSON.GeoJSON);
    }

    // Remove old individual markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // We use a layer event listener for unclustered points
    // Remove old listener if any
    const handleUnclusteredClick = (
      e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }
    ) => {
      if (!e.features?.length) return;
      const props = e.features[0].properties;
      if (!props?.id) return;
      const game = allGamesRef.current.find((g) => g.id === props.id);
      if (game) {
        setSelectedGame(game);
        const geometry = e.features[0].geometry;
        if (geometry.type === "Point") {
          map.easeTo({
            center: geometry.coordinates as [number, number],
            offset: [0, -80],
            duration: 400,
          });
        }
      }
    };

    // Add unclustered point layer if not exists
    if (!map.getLayer("unclustered-point")) {
      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "games",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": 10,
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "unclustered-label",
        type: "symbol",
        source: "games",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "text-field": ["get", "emoji"],
          "text-size": 14,
          "text-anchor": "center",
          "text-allow-overlap": true,
        },
      });

      map.on("click", "unclustered-point", handleUnclusteredClick);
      map.on("click", "unclustered-label", handleUnclusteredClick);

      map.on("mouseenter", "unclustered-point", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "unclustered-point", () => {
        map.getCanvas().style.cursor = "";
      });
    }
  }, [filteredGames, mapReady]);

  // User location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const el = document.createElement("div");
    el.innerHTML = `
      <div style="position:relative;width:20px;height:20px;">
        <div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2);position:relative;z-index:2;"></div>
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.25);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
      </div>
    `;

    const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
      .setLngLat([userLng, userLat])
      .addTo(map);

    userMarkerRef.current = marker;
  }, [userLat, userLng, mapReady]);

  // Request user geolocation
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setLocating(false);
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [loc.lng, loc.lat],
            zoom: DEFAULT_ZOOM,
            duration: 1200,
          });
        }
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return (
    <div className="relative h-[calc(100vh-4rem)] overflow-hidden">
      {/* Map container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Ping animation style */}
      <style jsx global>{`
        @keyframes ping {
          75%,
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `}</style>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 glass rounded-2xl px-4 py-3 elevation-2">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {userLocation ? t("map.your_location") : t("map.default_location")}
              </span>
              <span className="text-2xs text-muted-foreground ml-auto">
                {t("map.games_within_radius", { count: gamesWithinRadius, radius: radiusKm })}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "h-11 w-11 rounded-2xl glass elevation-2 flex items-center justify-center transition-colors",
              showFilters && "bg-primary text-white"
            )}
          >
            <Filter className="h-5 w-5" />
          </button>
          <Link
            href="/"
            className="h-11 w-11 rounded-2xl glass elevation-2 flex items-center justify-center"
          >
            <List className="h-5 w-5 text-foreground" />
          </Link>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mt-2 glass rounded-2xl p-4 elevation-2 overflow-hidden"
            >
              {/* Category pills */}
              <p className="text-2xs font-medium text-muted-foreground mb-2">
                {t("map.filter_category")}
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <button
                  onClick={() => setCategoryFilter("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                    categoryFilter === "all"
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {t("map.filter_all")}
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategoryFilter(cat.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                      categoryFilter === cat.value
                        ? "text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                    style={
                      categoryFilter === cat.value
                        ? { backgroundColor: CATEGORY_COLORS[cat.value] }
                        : undefined
                    }
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>

              {/* Radius pills */}
              <p className="text-2xs font-medium text-muted-foreground mb-2">
                {t("map.filter_radius")}
              </p>
              <div className="flex gap-1.5">
                {RADIUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRadiusKm(opt.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                      radiusKm === opt.value
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Games within radius badge */}
              {gamesWithinRadius === 0 && (
                <p className="text-xs text-coral mt-3 text-center">
                  {t("map.no_games_radius")}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Locate me button */}
      <button
        onClick={requestLocation}
        disabled={locating}
        className="absolute bottom-24 right-4 z-10 h-11 w-11 rounded-full glass elevation-3 flex items-center justify-center transition-transform active:scale-95"
      >
        <Locate
          className={cn(
            "h-5 w-5",
            locating ? "animate-spin text-primary" : "text-foreground"
          )}
        />
      </button>

      {/* Recenter button */}
      <button
        onClick={() => {
          mapRef.current?.flyTo({
            center: [userLng, userLat],
            zoom: DEFAULT_ZOOM,
            duration: 800,
          });
        }}
        className="absolute bottom-24 left-4 z-10 h-11 w-11 rounded-full glass elevation-3 flex items-center justify-center transition-transform active:scale-95"
      >
        <Navigation className="h-5 w-5 text-primary" />
      </button>

      {/* Bottom Sheet - Selected Game */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl elevation-4 px-4 pt-3 pb-6"
          >
            <div className="flex justify-center mb-3">
              <div className="h-1 w-8 rounded-full bg-border" />
            </div>
            <button
              onClick={() => setSelectedGame(null)}
              className="absolute top-3 right-4 h-7 w-7 rounded-full bg-muted flex items-center justify-center"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <Link href={`/game/${selectedGame.id}`}>
              <div className="flex gap-3">
                <div className="h-20 w-20 rounded-2xl overflow-hidden shrink-0 relative">
                  {selectedGame.photos[0] ? (
                    <Image
                      src={selectedGame.photos[0]}
                      alt={selectedGame.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary/10 to-sunshine/10 flex items-center justify-center">
                      <span className="text-2xl">
                        {getCategoryEmoji(selectedGame.category)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base truncate">
                    {selectedGame.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {getCategoryLabel(selectedGame.category)}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-sunshine text-sunshine" />
                      {selectedGame.rating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {selectedGame.minPlayers}-{selectedGame.maxPlayers}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {formatDistance(selectedGame, userLat, userLng)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span
                      className={cn(
                        "text-2xs font-medium px-2 py-0.5 rounded-full",
                        selectedGame.ownershipType === "lent"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                      )}
                    >
                      {selectedGame.ownershipType === "lent"
                        ? "On Loan"
                        : "Community Game"}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No token fallback — clean demo-safe placeholder */}
      {!hasToken && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-50">
          <div className="text-center p-8">
            <MapPin className="h-14 w-14 text-primary/30 mx-auto mb-4" />
            <h3 className="font-bold text-xl mb-1">{t("map.no_token_title")}</h3>
            <p className="text-sm text-primary font-medium mb-3">{t("map.no_token_coming_soon")}</p>
            <p className="text-xs text-muted-foreground">{t("map.no_token_neighborhoods")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
