/* Country, city and airport-code matching for the search fields.
 *
 * Typing "France" or "United Kingdom" in From or To now works, alongside the
 * city name and the IATA code that already worked. A country match is exact:
 * the query has to be the country's name or one of its listed alternatives, so
 * a city called "Chile" could never be swallowed by a country search.
 *
 * Country per city comes from the public airport dataset the site already
 * credits in city-map.js, matched on the airport coordinates. Cities the table
 * does not know simply fall back to the old text search, never to a wrong flag.
 */
(function (w) {
  "use strict";

  function norm(s) {
    return String(s == null ? "" : s).toLowerCase().normalize("NFD")
      .replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  }

  /* Same folding the video pipeline uses, so both sides agree on what a city is. */
  var ALIAS = {
    "london luton": "london", "london stansted": "london", "london biggin hill": "london",
    "london city": "london", "london heathrow": "london", "london gatwick": "london",
    "biggin hill": "london", "london oxford": "oxford", "amsterdam schiphol": "amsterdam",
    "palma de mallorca": "palma", "toulon hyeres": "toulon", "cape town international": "cape-town",
    "cannes mandelieu": "cannes", "olbia costa smeralda": "olbia", "nice cote d azur international": "nice",
    "zaventem": "brussels", "brussels south": "brussels", "kortrijk wevelgem": "wevelgem",
    "milano": "milan", "roma": "rome", "wien": "vienna", "koln": "cologne", "zurich kloten": "zurich",
    "larnarca": "larnaca", "birmingham international": "birmingham", "geneva international": "geneva",
    "malaga costa del sol": "malaga", "genova": "genoa", "napoli": "naples",
    "montpellier mediterranee": "montpellier", "providenciales island": "turks-and-caicos",
    "fort lauderdale executive": "fort-lauderdale", "alc": "alicante", "bcn": "barcelona"
  };

  function slug(raw) {
    if (!raw) return null;
    var s = String(raw).split(",")[0].split("(")[0].split("/")[0];
    s = norm(s);
    if (ALIAS[s]) return ALIAS[s];
    return s.replace(/ /g, "-");
  }

  /* city slug -> ISO country code */
  var CITY = {"aberdeen":"GB","alicante":"ES","amsterdam":"NL","antigua":"AG","antwerp":"BE","aspen":"US","athens":"GR","austin":"US","barcelona":"ES","belfast":"GB","berlin":"DE","beziers":"FR","biarritz":"FR","birmingham":"GB","bodrum":"TR","bologna":"IT","bremen":"DE","bridgetown":"BB","brindisi":"IT","brussels":"BE","cabo-san-lucas":"MX","cagliari":"IT","calgary":"CA","cannes":"FR","cape-town":"ZA","carlsbad":"US","castres":"FR","college-station":"US","cologne":"DE","dalaman":"TR","dallas":"US","denver":"US","dortmund":"DE","dubai":"AE","dublin":"IE","dubrovnik":"HR","dusseldorf":"DE","eagle":"US","eau-claire":"US","edinburgh":"GB","erfurt":"DE","farnborough":"GB","faro":"PT","figari":"FR","fort-lauderdale":"US","fort-worth":"US","frankfurt":"DE","geneva":"CH","genoa":"IT","girona":"ES","glasgow":"GB","guernsey":"GG","hamburg":"DE","heraklion":"GR","houston":"US","ibiza":"ES","innsbruck":"AT","istanbul":"TR","johannesburg":"ZA","lake-tahoe":"US","lamezia":"IT","larnaca":"CY","las-vegas":"US","le-castellet":"FR","liege":"BE","london":"GB","lugano":"CH","lyon":"FR","malaga":"ES","manchester":"GB","maun":"BW","mauritius":"MU","miami":"US","milan":"IT","milwaukee":"US","monchengladbach":"DE","montpellier":"FR","montreal":"CA","munich":"DE","munster":"DE","naples":"IT","nassau":"BS","nevers":"FR","nice":"FR","norwich":"GB","nottingham":"GB","olbia":"IT","oxford":"GB","palma":"ES","paphos":"CY","paris":"FR","perugia":"IT","pisa":"IT","port-elizabeth":"ZA","pula":"HR","regina":"CA","rimini":"IT","rome":"IT","rotterdam":"NL","salt-lake-city":"US","salzburg":"AT","san-sebastian":"ES","santa-ana":"US","sault-ste-marie":"CA","scottsdale":"US","sion":"CH","southend":"GB","split":"HR","szczecin":"PL","tenerife":"ES","teterboro":"US","thessaloniki":"GR","tivat":"ME","toronto":"CA","toulon":"FR","turks-and-caicos":"TC","van-nuys":"US","venice":"IT","vienna":"AT","vigo":"ES","washington":"US","waukesha":"US","wevelgem":"BE","zurich":"CH"};

  var COUNTRY = {
    AE: ["United Arab Emirates", "uae", "emirates"],
    AG: ["Antigua and Barbuda", "antigua", "barbuda"],
    AT: ["Austria", "osterreich"],
    BB: ["Barbados"],
    BE: ["Belgium", "belgique", "belgie"],
    BS: ["Bahamas", "the bahamas"],
    BW: ["Botswana"],
    CA: ["Canada"],
    CH: ["Switzerland", "suisse", "schweiz", "svizzera"],
    CY: ["Cyprus"],
    DE: ["Germany", "deutschland"],
    ES: ["Spain", "espana"],
    FR: ["France"],
    GB: ["United Kingdom", "uk", "great britain", "britain", "england", "scotland", "wales", "northern ireland", "gb"],
    GG: ["Guernsey", "channel islands"],
    GR: ["Greece", "hellas"],
    HR: ["Croatia", "hrvatska"],
    IE: ["Ireland", "republic of ireland", "eire"],
    IT: ["Italy", "italia"],
    ME: ["Montenegro"],
    MU: ["Mauritius"],
    MX: ["Mexico"],
    NL: ["Netherlands", "the netherlands", "holland"],
    PL: ["Poland", "polska"],
    PT: ["Portugal"],
    TC: ["Turks and Caicos", "turks and caicos islands", "caicos"],
    TR: ["Turkey", "turkiye"],
    US: ["United States", "united states of america", "usa", "us", "america"],
    ZA: ["South Africa", "rsa"]
  };

  /* every accepted spelling -> code, exact match only */
  var BY_ALIAS = {};
  for (var cc in COUNTRY) {
    COUNTRY[cc].forEach(function (a) { BY_ALIAS[norm(a)] = this; }, cc);
    BY_ALIAS[norm(cc)] = cc;
  }

  function countryOf(airport) {
    var s = slug(airport);
    return s && CITY[s] ? CITY[s] : null;
  }

  /* Does this flight end match what the visitor typed? */
  function match(query, airport, iata) {
    var q = norm(query);
    if (!q) return true;
    var cc = BY_ALIAS[q];
    if (cc) return countryOf(airport) === cc;
    // not a country: the old behaviour, city name or airport code, unchanged
    return (String(airport || "") + " " + String(iata || "")).toLowerCase()
      .indexOf(String(query).trim().toLowerCase()) !== -1;
  }

  /* Country names to offer in the From/To suggestion lists, for the countries
     that actually have flights in the data right now. */
  function countriesPresent(rows, field) {
    var seen = {};
    (rows || []).forEach(function (r) {
      var c = countryOf(r[field]);
      if (c) seen[c] = (seen[c] || 0) + 1;
    });
    return Object.keys(seen).sort(function (a, b) { return seen[b] - seen[a]; })
      .map(function (c) { return { code: c, name: COUNTRY[c][0], n: seen[c] }; });
  }

  w.EL_PLACE = { match: match, slug: slug, countryOf: countryOf, countriesPresent: countriesPresent, COUNTRY: COUNTRY };
})(window);
