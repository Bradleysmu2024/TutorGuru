import { ref } from "vue";

/**
 * Composable for Singapore postal code validation and geocoding using OneMap API
 * Provides postal code validation, geocoding, and region detection
 *
 * @returns {Object} Geocoding utilities and state
 */
export function usePostalCodeGeocoding() {
  // Validation states
  const geocoding = ref(false);
  const postalError = ref("");
  const postalSuccess = ref(false);
  const geocodedData = ref(null);

  /**
   * Validate Singapore postal code format (6 digits)
   * @param {string} value - Postal code to validate
   * @returns {boolean} True if valid
   */
  const isValidSGPostal = (value) => /^\d{6}$/.test((value || "").trim());

  /**
   * Get Singapore region from postal district (first 2 digits)
   * @param {number} district - Postal district number (01-82)
   * @returns {string} Region name (Central, North, East, West, Northeast)
   */
  const getRegionFromPostalDistrict = (district) => {
    // Comprehensive Singapore postal district to region mapping
    // Based on Singapore's official postal district system (Districts 01-82)
    const regionMap = {
      // Central Region (Districts 01-11, 14-15)
      // Includes: CBD, Orchard, Marina Bay, Chinatown, City Hall, River Valley, Novena
      central: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15],

      // East Region (Districts 13, 16-18, 38-52)
      // Includes: Katong, Marine Parade, Bedok, Tampines, Pasir Ris, Changi, Geylang
      east: [
        13, 16, 17, 18, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51,
        52,
      ],

      // Northeast Region (Districts 19-20, 28, 53-57, 82)
      // Includes: Hougang, Punggol, Sengkang, Serangoon, Ang Mo Kio, Bishan
      northeast: [19, 20, 28, 53, 54, 55, 56, 57, 82],

      // North Region (Districts 25-27, 72-73, 77-78)
      // Includes: Woodlands, Yishun, Sembawang, Admiralty, Kranji
      north: [25, 26, 27, 72, 73, 77, 78],

      // West Region (Districts 12, 21-24, 60-71, 79-81)
      // Includes: Jurong, Choa Chu Kang, Bukit Batok, Clementi, Bukit Panjang, Tuas
      west: [
        12, 21, 22, 23, 24, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 79,
        80, 81,
      ],
    };

    for (const [region, districts] of Object.entries(regionMap)) {
      if (districts.includes(district)) {
        return region.charAt(0).toUpperCase() + region.slice(1); // Capitalize
      }
    }

    return "Central"; // Default fallback for any unmapped districts
  };

  /**
   * Geocode postal code using OneMap API
   * @param {string} postal - 6-digit postal code
   * @returns {Promise<Object>} Geocoded data with lat, lng, address, postalCode
   */
  const geocodePostalCode = async (postal) => {
    const cleaned = (postal || "").trim();
    if (!isValidSGPostal(cleaned)) {
      throw new Error("Please enter a valid 6-digit Singapore postal code.");
    }

    const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${cleaned}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to contact OneMap API.");

    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      throw new Error("No location found for that postal code.");
    }

    const result = data.results[0];
    const lat = parseFloat(result.LATITUDE);
    const lng = parseFloat(result.LONGITUDE);
    const address =
      result.ADDRESS ||
      `${result.BUILDING || ""} ${result.ROAD_NAME || ""}`.trim();

    return { lat, lng, formattedAddress: address, postalCode: cleaned };
  };

  /**
   * Validate and geocode postal code with full error handling
   * @param {string} postalCode - Postal code to validate and geocode
   * @param {Object} options - Options for geocoding
   * @param {boolean} options.includeCoordinates - Whether to include lat/lng (default: false)
   * @returns {Promise<Object>} Result with success status and data/error
   */
  const validateAndGeocode = async (postalCode, options = {}) => {
    const { includeCoordinates = false } = options;

    postalError.value = "";
    postalSuccess.value = false;
    geocodedData.value = null;

    const postal = (postalCode || "").trim();

    if (!postal) {
      postalError.value = "Please enter a postal code";
      return { success: false, error: postalError.value };
    }

    if (!isValidSGPostal(postal)) {
      postalError.value = "Please enter a valid 6-digit Singapore postal code";
      return { success: false, error: postalError.value };
    }

    geocoding.value = true;

    try {
      const result = await geocodePostalCode(postal);
      geocodedData.value = result;
      postalSuccess.value = true;

      // Auto-detect region from postal district
      const postalDistrict = parseInt(postal.substring(0, 2));
      const region = getRegionFromPostalDistrict(postalDistrict);

      const responseData = {
        postalCode: result.postalCode,
        formattedAddress: result.formattedAddress,
        location: region,
      };

      // Optionally include coordinates
      if (includeCoordinates) {
        responseData.lat = result.lat;
        responseData.lng = result.lng;
      }

      return { success: true, data: responseData };
    } catch (error) {
      postalError.value = error.message;
      geocodedData.value = null;
      return { success: false, error: error.message };
    } finally {
      geocoding.value = false;
    }
  };

  /**
   * Reset all validation states
   */
  const resetValidation = () => {
    postalError.value = "";
    postalSuccess.value = false;
    geocodedData.value = null;
    geocoding.value = false;
  };

  return {
    // State
    geocoding,
    postalError,
    postalSuccess,
    geocodedData,

    // Methods
    isValidSGPostal,
    getRegionFromPostalDistrict,
    geocodePostalCode,
    validateAndGeocode,
    resetValidation,
  };
}
