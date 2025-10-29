<template></template>

<script>
import { POINT_MARKER_ICON_CONFIG } from "../composables/mapSettings";
import { useRouter } from "vue-router";
import { useToast } from "../composables/useToast";

export default {
  props: {
    google: { type: Object, required: true },
    map: { type: Object, required: true },
    assignment: { type: Object, required: true },
    tutorMarker: { type: Object, default: null },
  },

  mounted() {
    const google = this.google;
    const map = this.map;
    const a = this.assignment;
    const router = useRouter();
    const toast = useToast();

    // Create marker
    const marker = new google.maps.Marker({
      position: a.position,
      map,
        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    });

    // --- Build InfoWindow content safely (no innerHTML) ---
    const contentDiv = document.createElement("div");
    contentDiv.style.fontSize = "14px";

    // Subject
    const subjectEl = document.createElement("div");
    subjectEl.textContent = `Subject: ${a.subject || ""}`;
    contentDiv.appendChild(subjectEl);

    // Level
    const levelEl = document.createElement("div");
    levelEl.textContent = `Level: ${a.level || ""}`;
    contentDiv.appendChild(levelEl);

    // Title
    const titleEl = document.createElement("div");
    titleEl.textContent = `Title: ${a.title || ""}`;
    contentDiv.appendChild(titleEl);

    // Address
    const addressEl = document.createElement("div");
    addressEl.textContent = `Address: ${a.formattedAddress || ""}`;
    addressEl.style.marginBottom = "8px";
    contentDiv.appendChild(addressEl);

    // Buttons container
    const btnGroup = document.createElement("div");
    btnGroup.style.marginBottom = "8px";

    const makeBtn = (label, classes, emoji) => {
      const btn = document.createElement("button");
      btn.textContent = `${emoji} ${label}`;
      btn.className = classes;
      btn.style.marginRight = "6px";
      return btn;
    };

    const driveBtn = makeBtn("Drive", "btn btn-sm btn-outline-primary", "🚗");
    const walkBtn = makeBtn("Walk", "btn btn-sm btn-outline-success", "🚶");
    const transitBtn = makeBtn("Transit", "btn btn-sm btn-outline-info", "🚇");
    const applyBtn = makeBtn("Apply", "btn btn-sm btn-outline-warning", "📋");

    btnGroup.append(driveBtn, walkBtn, transitBtn, applyBtn);
    contentDiv.appendChild(btnGroup);

    // Travel info
    const travelInfoEl = document.createElement("div");
    contentDiv.appendChild(travelInfoEl);

    // Create info window
    const infoWindow = new google.maps.InfoWindow({
      content: contentDiv, // ✅ DOM node, no HTML string
    });

    let directionsRenderer = null;

    // --- Handle marker click ---
    marker.addListener("click", () => {
      infoWindow.open(map, marker);

      // Attach safe event listeners (no innerHTML, no inline @click)
      const handleRoute = (mode) => {
        if (!this.tutorMarker) {
          toast.warning("Set your tutor location first", "Location Required");
          return;
        }

        const origin = this.tutorMarker.getPosition();
        const destination = a.position;

        // Remove old route
        if (directionsRenderer) {
          directionsRenderer.setMap(null);
        }

        this.showRoute(origin, destination, travelInfoEl, mode, (renderer) => {
          directionsRenderer = renderer;
        });
      };

      driveBtn.addEventListener("click", () =>
        handleRoute(google.maps.TravelMode.DRIVING)
      );
      walkBtn.addEventListener("click", () =>
        handleRoute(google.maps.TravelMode.WALKING)
      );
      transitBtn.addEventListener("click", () =>
        handleRoute(google.maps.TravelMode.TRANSIT)
      );

      applyBtn.addEventListener("click", () => router.push("/dashboard"));

      // Clear routes when InfoWindow closes
      infoWindow.addListener("closeclick", () => {
        if (directionsRenderer) {
          directionsRenderer.setMap(null);
          directionsRenderer = null;
          travelInfoEl.textContent = "";
        }
      });
    });
  },

  methods: {
    showRoute(origin, destination, travelInfoEl, mode, setRenderer) {
      const directionsService = new this.google.maps.DirectionsService();
      const directionsRenderer = new this.google.maps.DirectionsRenderer({
        map: this.map,
      });

      directionsService.route(
        {
          origin,
          destination,
          travelMode: mode,
        },
        (result, status) => {
          if (status === "OK") {
            directionsRenderer.setDirections(result);
            setRenderer(directionsRenderer);

            const leg = result.routes[0].legs[0];
            const distance = leg.distance.text;
            const duration = leg.duration.text;

            // ✅ Safe: textContent, not innerHTML
            travelInfoEl.textContent = `${mode}: ${distance}, ${duration}`;
          } else {
            travelInfoEl.textContent = "Unable to find route.";
          }
        }
      );
    },
  },
};
</script>
