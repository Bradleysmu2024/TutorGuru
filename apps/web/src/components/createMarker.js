import { useRouter } from "vue-router";

export function createMarker({ google, map, assignment, tutorMarker, toast }) {
  const router = useRouter();
  const a = assignment;

  // create marker
  const marker = new google.maps.Marker({
    position: a.position,
    map,
    icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  });

  // create Vue-friendly DOM node for info window
  const wrapper = document.createElement("div");
  wrapper.style.fontSize = "14px";
  wrapper.style.maxWidth = "250px";
  wrapper.style.display = "flex";
  wrapper.style.flexDirection = "column";
  wrapper.style.gap = "6px";

  const fields = [
    `📘 <b>${a.subject || ""}</b>`,
    `Level: ${a.level || ""}`,
    `Title: ${a.title || ""}`,
    a.formattedAddress || "",
  ];
  fields.forEach(text => {
    const el = document.createElement("div");
    el.innerHTML = text;
    wrapper.appendChild(el);
  });

  const buttonRow = document.createElement("div");
  buttonRow.style.display = "flex";
  buttonRow.style.gap = "4px";
  buttonRow.style.flexWrap = "wrap";

  const buttons = [
    { label: "🚗 Drive", mode: google.maps.TravelMode.DRIVING },
    { label: "🚶 Walk", mode: google.maps.TravelMode.WALKING },
    { label: "🚇 Transit", mode: google.maps.TravelMode.TRANSIT },
  ];

  buttons.forEach(btnInfo => {
    const btn = document.createElement("button");
    btn.textContent = btnInfo.label;
    btn.className = "btn btn-sm btn-outline-primary";
    btn.onclick = () => handleRoute(btnInfo.mode);
    buttonRow.appendChild(btn);
  });

  const applyBtn = document.createElement("button");
  applyBtn.textContent = "📋 Apply";
  applyBtn.className = "btn btn-sm btn-outline-warning";
  applyBtn.onclick = () => router.push("/dashboard");
  buttonRow.appendChild(applyBtn);

  wrapper.appendChild(buttonRow);

  const travelInfoEl = document.createElement("div");
  travelInfoEl.style.marginTop = "4px";
  wrapper.appendChild(travelInfoEl);

  const infoWindow = new google.maps.InfoWindow({ content: wrapper });

  marker.addListener("click", () => {
    infoWindow.open(map, marker);
  });

  function handleRoute(mode) {
    if (!tutorMarker.value) {
      toast.warning("Please set your location first");
      return;
    }

    const origin = tutorMarker.value.getPosition();
    const destination = a.position;

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({ map });

    directionsService.route(
      { origin, destination, travelMode: mode },
      (result, status) => {
        if (status === "OK") {
          directionsRenderer.setDirections(result);
          const leg = result.routes[0].legs[0];
          travelInfoEl.textContent = `${mode}: ${leg.distance.text}, ${leg.duration.text}`;
        } else {
          travelInfoEl.textContent = "Unable to find route.";
        }
      }
    );
  }

  return marker;
}
