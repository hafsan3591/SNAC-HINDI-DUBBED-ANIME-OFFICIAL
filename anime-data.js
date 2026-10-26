// anime-data.js — SNAC ANIME Database
// এখানে কিছু রাখার দরকার নেই। Admin Panel থেকে anime add করবেন, তা Firebase-এ সেভ হবে।

const DEFAULT_TELEGRAM = "https://t.me/SNAC_hindi_anime";

const animeList = [];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { animeList, DEFAULT_TELEGRAM };
}