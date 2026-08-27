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
  var CITY = {"aberdeen":"GB","aberdeen-international":"GB","abilene":"US","abu-dhabi":"AE","abuja":"NG","albenga":"IT","alexandria":"US","alicante":"ES","allentown":"US","altenrhein":"CH","amsterdam":"NL","amsterdam-schiphol":"NL","angelholm":"SE","antigua":"AG","antwerp":"BE","aruba":"AW","arusha":"TZ","asheville":"US","aspen":"US","athens":"GR","atlanta":"US","austin":"US","avignon":"FR","avignon-provence":"FR","bale":"FR","bangor":"US","banja-luka":"BA","barcelona":"ES","bari":"IT","bari-karol-wojtyla":"IT","barrie-orillia":"CA","beaufort-west":"ZA","bedford":"US","beef-island":"VG","belfast":"GB","belgrade":"RS","bellaire":"US","bellingham":"US","belmar":"US","bergen":"NO","berlin":"DE","bern":"CH","bern-belp":"CH","beziers":"FR","biarritz":"FR","birmingham":"GB","birmingham-international":"GB","bismarck":"US","blackpool":"GB","bloemfontain":"ZA","boca-raton":"US","bodrum":"TR","boise":"US","bol":"HR","bologna":"IT","bolzano":"IT","bordeaux":"FR","boston":"US","bozeman":"US","brac-island":"HR","branson":"US","brazzaville":"CG","bremen":"DE","bremerton":"US","bridgetown":"BB","brindisi":"IT","brisbane":"AU","bristol":"GB","brownsville":"US","brunswick":"US","brussels":"BE","bucharest":"RO","budapest":"HU","buffalo":"US","buochs":"CH","burbank":"US","burlington":"US","bydgoszcz":"PL","cabo-san-lucas":"MX","cagliari":"IT","cagliari-elmas":"IT","calgary":"CA","cambridge":"GB","cannes":"FR","cannes-mandelieu":"FR","cape-girardeau":"US","cape-town":"ZA","carlsbad":"US","cascais":"PT","casper":"US","castres":"FR","catania":"IT","cedar-rapids":"US","chambery":"FR","charleston":"US","charlotte":"US","charlottesville":"US","chicago":"US","chiredzi":"ZW","cleveland":"US","college-station":"US","cologne":"DE","colorado-springs":"US","columbia":"US","columbus":"US","concord":"US","copenhagen":"DK","cranfield":"GB","dalaman":"TR","dalaman-international":"TR","dallas":"US","dallas-fort-worth":"US","davenport":"US","dayton":"US","deauville":"FR","denver":"US","derry":"GB","des-moines":"US","detroit":"US","dinard":"FR","dortmund":"DE","dothan":"US","driggs":"US","dubai":"AE","dublin":"IE","dubrovnik":"HR","dubrovnik-cilipi":"HR","durban":"ZA","durham":"GB","dusseldorf":"DE","eagle":"US","eagle-river":"US","east-london":"ZA","east-midlands":"GB","eau-claire":"US","edinburgh":"GB","edinburgh-international":"GB","edmonton":"CA","erfurt":"DE","escanaba":"US","exeter":"GB","fairhope":"US","farmingdale":"US","farnborough":"GB","faro":"PT","fernandina-beach":"US","figari":"FR","figari-sud-corse":"FR","firenze":"IT","flagstaff":"US","florida-keys-marathon":"US","forli":"IT","fort-collins":"US","fort-lauderdale":"US","fort-myers":"US","fort-worth":"US","frankfurt":"DE","frankfurt-am-main":"DE","geneva":"CH","geneva-international":"CH","genoa":"IT","genoa-sestri":"IT","genova":"IT","george":"ZA","geraldton":"CA","gillette":"US","girona":"ES","giza":"EG","glasgow":"GB","glasgow-international":"GB","glens-falls":"US","gold-coast":"AU","gothenburg":"SE","graaff-reinet":"ZA","grand-cayman":"KY","grand-rapids":"US","grantley-adams-international":"BB","great-falls":"US","green-bay":"US","greenville":"US","grimsby":"GB","grosetto":"IT","guernsey":"GG","halifax":"CA","halmstad":"SE","hamburg":"DE","hartford":"US","heber":"US","heraklion":"GR","hoedspruit":"ZA","horseshoe-bay":"US","houston":"US","huntington":"US","hyannis":"US","ibiza":"ES","immokalee":"US","indianapolis":"US","innsbruck":"AT","inverness":"GB","istanbul":"TR","jackson":"US","jacksonville":"US","jeffersonville":"US","jerez-de-la-frontera":"ES","johannesburg":"ZA","kahului":"US","kalamata":"GR","kalamazoo":"US","kangerlussuaq":"GL","kefallinia-island":"GR","kelowna":"CA","kenora":"CA","kerkyra-island":"GR","kerrville":"US","kigali":"RW","killarney":"IE","kitchener":"CA","knoxville":"US","komati-power-station":"ZA","kortrijk-wevelgem-international":"BE","kos-island":"GR","krakow":"PL","la-mole":"FR","lake-tahoe":"US","lamezia":"IT","lamezia-terme-intl":"IT","larnaca":"CY","larnarca":"CY","las-vegas":"US","latrobe":"US","le-castellet":"FR","leeds":"GB","leipzig":"DE","lexington":"US","liege":"BE","limnos-island":"GR","lisbon":"PT","liverpool":"GB","liverpool-john-lennon":"GB","ljubljana":"SI","london":"GB","london-biggin-hill":"GB","london-luton":"GB","london-oxford":"GB","london-stansted":"GB","lugano":"CH","luxembourg":"LU","lyon":"FR","maastricht":"NL","madeira":"PT","madison":"US","madrid":"ES","mahe-island":"SC","mahon":"ES","malaga":"ES","malelane":"ZA","malta-international":"MT","manassas":"US","manchester":"GB","marco-island":"US","margate":"ZA","marrakech":"MA","marseille":"FR","maun":"BW","mauritius":"MU","melbourne":"AU","menorca-island":"ES","miami":"US","milan":"IT","milwaukee":"US","minneapolis":"US","minocqua-woodruff":"US","monchengladbach":"DE","monterey":"US","monticello":"US","montichiari":"IT","montpellier":"FR","montreal":"CA","montrose":"US","morristown":"US","mosinee":"US","mossel-bay":"ZA","mpumalanga":"ZA","mugla-milas-bodrum-international":"TR","munich":"DE","munster":"DE","muskoka":"CA","mykonos-island":"GR","nairobi":"KE","nancy":"FR","nantucket":"US","napa":"US","naples":"IT","napoli":"IT","nashville":"US","nassau":"BS","nevers":"FR","new-orleans":"US","new-york":"US","newcastle":"GB","newcastle-international":"GB","nice":"FR","nimes":"FR","norfolk":"US","norwich":"GB","nottingham":"GB","oakland":"US","oberpfaffenhofen":"DE","ogden":"US","oklahoma-city":"US","olbia":"IT","olbia-costa-smeralda":"IT","omaha":"US","orlando":"US","oslo":"NO","ostend":"BE","ottawa":"CA","oxford":"GB","ozona":"US","palermo":"IT","palm-springs":"US","palma":"ES","palma-de-mallorca":"ES","panama-city":"US","paphos":"CY","paphos-international":"CY","paris":"FR","paris-le-bourget":"FR","paros-island":"GR","parry-sound":"CA","pawtucket":"US","payerne":"CH","pecs-pogany":"HU","pemba":"MZ","pensacola":"US","peoria":"US","perpignan":"FR","perugia":"IT","pescara":"IT","philadelphia":"US","pierre":"US","pietermaritzburg":"ZA","pisa":"IT","pittsburgh":"US","plettenberg-bay":"ZA","plovdiv":"BG","podgorica":"ME","port-elizabeth":"ZA","port-louis":"MU","portland":"US","portsmouth":"US","prague":"CZ","preveza":"GR","prince-rupert":"CA","provo":"US","pula":"HR","punta-gorda":"US","quebec":"CA","rabat":"MA","raleigh":"US","regina":"CA","rennes":"FR","reykjavik":"IS","rifle":"US","riga":"LV","rimini":"IT","riviere-rouge":"CA","robertson":"ZA","rome":"IT","rome-ciampino-g-b-pastine":"IT","ronaldsway-isle-of-man":"IM","rotterdam":"NL","sabadell":"ES","saint-peter-port":"GG","salerno":"IT","salida":"US","salt-lake-city":"US","salzburg":"AT","san-antonio":"US","san-diego":"US","san-francisco":"US","san-jose-del-cabo":"MX","san-juan":"PR","san-sebastian":"ES","sandpoint":"US","santa-ana":"US","santa-barbara":"US","santa-fe":"US","santa-rosa":"US","santorini-island":"GR","sarasota":"US","saratoga":"US","sault-ste-marie":"CA","savannah":"US","scottsdale":"US","seattle":"US","sevierville":"US","shannon":"IE","sheboygan":"US","sion":"CH","skukuza":"ZA","sofia":"BG","southampton":"GB","southend":"GB","split":"HR","spokane":"US","st-louis":"US","st-paul":"US","state-college":"US","stavanger":"NO","stockholm":"SE","sydney":"AU","syracuse":"US","szczecin":"PL","tacoma":"US","tel-aviv":"IL","telluride":"US","tenerife":"ES","tenerife-south":"ES","teterboro":"US","thessaloniki":"GR","timisoara":"RO","tirana":"AL","tivat":"ME","torino":"IT","toronto":"CA","toulon":"FR","toulon-le-palyvestre":"FR","trapani":"IT","traverse-city":"US","trebbin":"DE","trenton":"US","tromso":"NO","truckee":"US","tswalo-game-reserve":"ZA","tunis":"TN","turks-and-caicos":"TC","upington":"ZA","valencia":"ES","valletta":"MT","van-nuys":"US","vancouver":"CA","venezia-tessera-marco-polo":"IT","venice":"IT","verona":"IT","victoria":"CA","victoria-falls":"ZW","vienna":"AT","vienna-international":"AT","vigo":"ES","vilanculo":"MZ","warsaw":"PL","washington":"US","waukesha":"US","weeze":"DE","west-palm-beach":"US","westhampton-beach":"US","wevelgem":"BE","white-plains":"US","wilkes-barre":"US","youngstown":"US","zakynthos-island":"GR","zanzibar":"TZ","zaventem":"BE","zemunik":"HR","zephyrhills":"US","zurich":"CH"};

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
    ZA: ["South Africa", "rsa"],
    AL: ["Albania", "shqiperia"],
    AU: ["Australia"],
    AW: ["Aruba"],
    BA: ["Bosnia and Herzegovina", "bosnia"],
    BG: ["Bulgaria"],
    CG: ["Republic of the Congo", "congo"],
    CZ: ["Czechia", "czech republic"],
    DK: ["Denmark", "danmark"],
    EG: ["Egypt"],
    GL: ["Greenland", "kalaallit nunaat"],
    HU: ["Hungary", "magyarorszag"],
    IL: ["Israel"],
    IM: ["Isle of Man"],
    IS: ["Iceland", "island"],
    KE: ["Kenya"],
    KY: ["Cayman Islands", "cayman"],
    LU: ["Luxembourg"],
    LV: ["Latvia", "latvija"],
    MA: ["Morocco", "maroc"],
    MT: ["Malta"],
    MZ: ["Mozambique"],
    NG: ["Nigeria"],
    NO: ["Norway", "norge"],
    PR: ["Puerto Rico"],
    RO: ["Romania", "romania"],
    RS: ["Serbia", "srbija"],
    RW: ["Rwanda"],
    SC: ["Seychelles"],
    SE: ["Sweden", "sverige"],
    SI: ["Slovenia", "slovenija"],
    TN: ["Tunisia"],
    TZ: ["Tanzania"],
    VG: ["British Virgin Islands", "bvi", "virgin islands"],
    ZW: ["Zimbabwe"]
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
