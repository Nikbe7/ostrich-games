# Ordlista för Rita & Gissa.
# Svårighetsgrad baseras på hur svårt ordet är att RITA och få andra att GISSA.
#
# LÄTT: Ikoniska former, tydliga silhuetter. Kräver bara några streck.
#       Alla vet exakt hur det ser ut. Ingen tvekan.
#
# MEDIUM: Konkreta saker som kräver mer detalj eller specifika drag
#         för att skilja dem från liknande saker. Fortfarande ritbart men
#         kräver lite eftertanke.
#
# SVÅR: Abstrakta koncept, känslor, handlingar, sammansatta ord eller
#       saker som kräver en hel scen för att kommunicera. Ritaren måste
#       vara kreativ och gissarna måste tänka utanför boxen.

DRAW_WORDS = {
    "easy": [
        # === Enkla föremål (ikoniska former) ===
        "Sol", "Måne", "Stjärna", "Moln", "Regnbåge", "Blixt", "Regn", "Snö",
        "Hjärta", "Cirkel", "Triangel", "Kvadrat", "Pil", "Kryss",
        "Hus", "Dörr", "Fönster", "Tak", "Skorsten", "Trappa", "Mur", "Bro",
        "Träd", "Blomma", "Gräs", "Löv", "Kvist", "Buske", "Stubbe", "Kotte",
        "Bok", "Boll", "Klocka", "Lampa", "Nyckel", "Lås", "Ring",
        "Penna", "Linjal", "Suddgummi", "Sax", "Tejp", "Gem",
        "Stol", "Bord", "Säng", "Soffa", "Kudde", "Matta", "Gardin", "Hylla",
        "Tallrik", "Glas", "Kopp", "Gaffel", "Kniv", "Sked", "Skål",
        "Gryta", "Stekpanna", "Kastrull", "Kanna",
        "Spegel", "Kam", "Tandborste", "Tvål", "Handduk",
        "Paraply", "Väska", "Hatt", "Keps", "Mössa",
        "Glasögon", "Solglasögon", "Örhänge", "Halsband", "Armband",
        "Krona", "Trollstav", "Yxa", "Hammare", "Spik", "Spade", "Kratta",
        "Hink", "Stege", "Såg",
        "Ljus", "Tändsticka", "Ficklampa", "Lykta",

        # === Djur (tydlig form, alla känner igen) ===
        "Katt", "Hund", "Fisk", "Fågel", "Mus", "Kanin", "Orm", "Groda",
        "Snigel", "Spindel", "Fjäril", "Bi", "Myra", "Nyckelpiga", "Mask",
        "Ko", "Gris", "Häst", "Får", "Get", "Höna", "Tupp", "Anka", "Gås",
        "Björn", "Varg", "Räv", "Älg", "Ren", "Ekorre", "Igelkott",
        "Lejon", "Tiger", "Apa", "Elefant", "Giraff", "Zebra",
        "Krokodil", "Sköldpadda", "Haj", "Val", "Delfin",
        "Pingvin", "Uggla", "Papegoja", "Svan", "Flamingo", "Örn",

        # === Mat & Dryck (omedelbart igenkännbar form) ===
        "Äpple", "Banan", "Päron", "Apelsin", "Citron", "Jordgubbe",
        "Vindruvor", "Körsbär", "Melon", "Ananas", "Morot", "Tomat",
        "Gurka", "Lök", "Svamp", "Paprika", "Majs", "Potatis",
        "Pizza", "Hamburgare", "Korv", "Pommes", "Taco",
        "Glass", "Tårta", "Muffin", "Kaka", "Bulle",
        "Ägg", "Ost", "Smörgås", "Bröd", "Pannkaka", "Våffla",
        "Popcorn", "Godis", "Choklad", "Chips", "Klubba", "Tuggummi",
        "Kaffe", "Te", "Juice", "Saft", "Läsk", "Mjölk",

        # === Fordon (simpla, ikoniska) ===
        "Bil", "Buss", "Tåg", "Båt", "Flygplan", "Cykel",
        "Lastbil", "Traktor", "Moped", "Motorcykel",
        "Skottkärra", "Vagn", "Sparkcykel", "Trehjuling", "Eka",
        "Raket", "Ubåt", "Taxi", "Ambulans", "Brandbil",

        # === Kläder (enkla plagg) ===
        "Byxor", "Tröja", "Klänning", "Kjol", "Skjorta", "Jacka",
        "Skor", "Stövlar", "Sandaler", "Vante", "Handske", "Halsduk",
        "Strumpor", "Slips", "Bälte",
        "Pyjamas", "Morgonrock", "Tofflor", "Gummistövlar", "Overall",
        "Bikini", "Badbyxor", "Regnjacka", "Poncho", "Förkläde",

        # === Kroppen (enkla delar) ===
        "Öga", "Mun", "Näsa", "Öra", "Hand", "Fot",
        "Tand", "Tunga", "Finger", "Tumme",

        # === Natur & Miljö (enkla scener) ===
        "Eld", "Vatten", "Is", "Sten", "Sand", "Berg",
        "Sjö", "Hav", "Strand", "Skog", "Ö", "Grotta",
        "Vulkan", "Vattenfall", "Kulle", "Äng",

        # === Enkla byggnader & platser ===
        "Kyrka", "Tält", "Igloo", "Stuga", "Slott", "Torn",
        "Fyr", "Kvarn", "Lada", "Garage",
        "Koja", "Vindskydd", "Friggebod", "Vedbod", "Hundkoja",
        "Kuvert", "Frimärke", "Affisch", "Skylt", "Flagga"
    ],
    "medium": [
        # === Föremål som kräver specifika detaljer ===
        "Kamera", "Kikare", "Mikroskop", "Teleskop", "Kompass", "Timglas",
        "Fickur", "Väckarklocka", "Termometer", "Förstoringsglas",
        "Skateboard", "Rullskridskor", "Skridskor", "Skidor", "Snowboard",
        "Surfbräda", "Kälke", "Pulka", "Gunga", "Rutschkana", "Karusell",
        "Ryggsäck", "Resväska", "Plånbok", "Portfölj",
        "Helikopter", "Ubåt", "Raket", "Segelbåt", "Kanot", "Kajak",
        "Luftballong", "Fallskärm", "Drönare", "Rymdskepp",
        "Ambulans", "Brandbil", "Polisbil", "Sopbil", "Grävmaskin",
        "Lyftkran", "Gaffeltruck", "Plogbil", "Husvagn", "Husbil",
        "Spårvagn", "Tunnelbana", "Linbana", "Flotte", "Färja",
        "Hörlurar", "Mikrofon", "Högtalare", "Radio", "Fjärrkontroll",
        "Skruvmejsel", "Skiftnyckel", "Vattenpass", "Måttband",
        "Pensel", "Färgburk", "Borrmaskin", "Motorsåg", "Domkraft", "Kofot",
        "Vattenkanna", "Blomkruka", "Brevlåda", "Sopkorg",
        "Kaffebryggare", "Brödrost", "Mikrovågsugn", "Mixer", "Blender",
        "Diskmaskin", "Tvättmaskin", "Dammsugare", "Strykjärn", "Symaskin",
        "Gräsklippare", "Snöskyffel", "Skottkärra",
        "Plånbok", "Mynt", "Sedel", "Spargris", "Kassaapparat",
        "Spruta", "Plåster", "Bandage", "Rullstol", "Kryckor",
        "Badring", "Flytväst", "Livboj", "Snorkel", "Dykmask", "Simfötter",
        "Hänglås", "Handklovar", "Kedja", "Bur", "Fälla",
        "Ankare", "Roder", "Åra", "Segel", "Mast",
        "Flagga", "Vimpel", "Fana", "Banderoll",
        "Toalettstol", "Duschmunstycke", "Badlakan", "Tvättställ",
        "Vedspis", "Kakelugn", "Eldstad", "Skorsten",
        "Vindflöjel", "Brevduva", "Fågelholk", "Bikupa", "Myrstack",
        "Spindelnät", "Kokosnöt", "Pumpa", "Vattenmelon",

        # === Vapen & Utrustning ===
        "Svärd", "Sköld", "Pilbåge", "Armborst", "Spjut", "Lans",
        "Slangbella", "Bumerang", "Katapult", "Kanon", "Pistol", "Gevär",
        "Dynamit", "Bomb", "Granat", "Mina",
        "Hjälm", "Rustning", "Ringbrynja",

        # === Djur (kräver mer detalj/specifik) ===
        "Kamel", "Noshörning", "Flodhäst", "Isbjörn",
        "Koala", "Känguru", "Bäver", "Utter", "Grävling", "Tvättbjörn",
        "Gepard", "Panter", "Puma", "Lodjur", "Hyena",
        "Gorilla", "Schimpans", "Orangutang", "Babian",
        "Struts", "Pelikan", "Tukan", "Hackspett", "Kolibri", "Korp",
        "Påfågel", "Falk", "Hök", "Gam", "Stork", "Häger",
        "Bläckfisk", "Sjöstjärna", "Sjöhäst", "Krabba", "Hummer", "Mussla",
        "Maneter", "Korall", "Räka", "Kräfta",
        "Kameleon", "Iguana", "Gecko", "Salamander",
        "Skorpion", "Trollslända", "Gräshoppa", "Syrsa", "Bönsyrsa",
        "Tusenfoting", "Fladdermus", "Mullvad", "Myrkott",
        "Valross", "Sjölejon", "Säl",
        "Sengångare", "Myrslok", "Bälta", "Skunk",
        "Lama", "Alpacka", "Jak", "Tapir", "Okapi",

        # === Instrument (specifik form) ===
        "Piano", "Gitarr", "Elgitarr", "Fiol", "Cello", "Kontrabas",
        "Harpa", "Banjo", "Ukulele",
        "Trummor", "Trumset", "Tamburin", "Maracas", "Xylofon", "Triangel",
        "Trumpet", "Trombon", "Tuba", "Saxofon", "Klarinett",
        "Tvärflöjt", "Blockflöjt", "Munspel", "Säckpipa", "Dragspel",
        "Orgel", "Synthesizer",

        # === Yrken & Roller (identifierbara via attribut) ===
        "Läkare", "Polis", "Brandman", "Astronaut", "Pilot",
        "Kock", "Bagare", "Frisör", "Clown", "Magiker",
        "Bonde", "Fiskare", "Jägare", "Snickare", "Målare",
        "Pirat", "Ninja", "Riddare", "Viking", "Cowboy",
        "Kung", "Drottning", "Prins", "Prinsessa",
        "Häxa", "Trollkarl", "Tomte", "Ängel",
        "Domare", "Servitör", "Smed", "Urmakare",
        "Fotograf", "Konstnär", "Skulptör", "Musiker",

        # === Fantasi & Mytologi (har tydlig visuell form) ===
        "Drake", "Enhörning", "Spöke", "Vampyr", "Zombie", "Mumie",
        "Robot", "Alien", "Dinosaurie", "Sjöjungfru",
        "Troll", "Dvärg", "Alv", "Fe", "Jätte",
        "Pegasus", "Fenix", "Griffin", "Minotauros",
        "Kentaur", "Cyklop", "Medusa", "Kraken",
        "Frankenstein", "Varulv", "Skelett", "Demon",

        # === Sport & Aktiviteter (tydlig pose/utrustning) ===
        "Fotboll", "Basket", "Tennis", "Golf", "Bowling",
        "Ishockey", "Boxning", "Brottning", "Fäktning", "Bågskytte",
        "Simning", "Dykning", "Segling", "Rodd", "Surfning",
        "Ridning", "Cykling", "Löpning", "Längdhopp", "Höjdhopp",
        "Stavhopp", "Gymnastik", "Tyngdlyftning", "Judo", "Karate",
        "Biljard", "Dart", "Schack", "Bordtennis", "Badminton",

        # === Mat (kräver mer detalj) ===
        "Sushi", "Soppa", "Spaghetti", "Lasagne", "Köttbullar",
        "Kebab", "Falafel", "Burrito", "Wok", "Paella",
        "Croissant", "Pretzel", "Baguette",
        "Räkmacka", "Smörgåstårta", "Palt", "Kåldolmar",

        # === Platser & Byggnader (specifika) ===
        "Bibliotek", "Museum", "Biograf", "Teater", "Restaurang",
        "Café", "Bageri", "Apotek", "Bank", "Postkontor",
        "Sjukhus", "Skola", "Fängelse", "Stadion", "Arena",
        "Djurpark", "Akvarium", "Cirkus", "Tivoli",
        "Pyramid", "Slott", "Borg", "Fästning", "Ruin",
        "Moské", "Tempel", "Katedral", "Pagod",
        "Skyskrapa", "Fabrik", "Silo", "Stall", "Växthus",
        "Fontän", "Staty", "Monument", "Gravsten"
    ],
    "hard": [
        # === Abstrakta koncept & Känslor ===
        # (Kräver kreativ visualisering, det finns ingen "rätt" bild)
        "Kärlek", "Hat", "Sorg", "Glädje", "Ilska", "Rädsla",
        "Ångest", "Stress", "Hopp", "Förtvivlan", "Nostalgi",
        "Avund", "Svartsjuka", "Skam", "Skuld", "Stolthet",
        "Mod", "Feghet", "Ensamhet", "Gemenskap", "Vänskap",
        "Tillit", "Svek", "Förlåtelse", "Hämnd", "Rättvisa",
        "Frihet", "Fångenskap", "Makt", "Vanmakt", "Kaos",
        "Ordning", "Harmoni", "Balans", "Obalans",
        "Tystnad", "Buller", "Lugn", "Panik", "Chock",
        "Hunger", "Törst", "Trötthet", "Sömnlöshet", "Smärta",
        "Lättnad", "Förvåning", "Förvirring", "Besvikelse",
        "Inspiration", "Kreativitet", "Fantasi", "Intuition",
        "Dröm", "Mardröm", "Minne", "Glömska",
        "Tur", "Otur", "Öde", "Slump", "Mirakel",
        "Lögn", "Sanning", "Hemlighet", "Mysterium",
        "Ironi", "Sarkasm", "Humor", "Skämt",

        # === Osynliga fenomen & Vetenskap ===
        "Tyngdkraft", "Magnetism", "Elektricitet", "Friktion",
        "Ljud", "Eko", "Vibration", "Våglängd", "Frekvens",
        "Ljus", "Skugga", "Reflektion", "Spegelbild",
        "Vind", "Lufttryck", "Vakuum", "Temperatur",
        "Hastighet", "Acceleration", "Fart", "Broms",
        "Tid", "Evighet", "Förflutet", "Framtid", "Nutid",
        "Evolution", "Klimatförändring", "Fotosyntes", "Gravitation",
        "DNA", "Gen", "Mutation", "Ämnesomsättning",
        "Energi", "Entropi", "Relativitet",
        "Atom", "Molekyl", "Kvantfysik",

        # === Sammansatta ord & Uttryck (svåra att gissa) ===
        "Tidsoptimist", "Tunnelseende", "Baksmälla", "Solsting",
        "Hjärntvättning", "Tankeläsning", "Drömfångare",
        "Fjärilseffekt", "Dominoeffekt", "Kedjereaktion",
        "Nålsöga", "Flaskhals", "Blindgata", "Återvändsgränd",
        "Synvilla", "Dubbelgångare", "Spökskrivare",
        "Pandoras ask", "Akilleshäl", "Gordisk knut",
        "Sisyfosarbete", "Pyrrhusseger",
        "Skyddsnät", "Säkerhetsbälte", "Livlina", "Räddningsplanka",
        "Sista utvägen", "Plan B", "Nödutgång",
        "Käpphäst", "Syndabock", "Gökunge",
        "Myrsteg", "Elefantsjukan", "Ormgrop",
        "Hästkrafter", "Kattliv", "Hundväder",
        "Snöbollseffekt", "Isbrytare", "Vindpust",

        # === Handlingar & Situationer (kräver hel scen) ===
        "Skratta", "Gråta", "Nysa", "Hicka", "Gäspa", "Snarka",
        "Drömma", "Sova", "Vakna", "Somna",
        "Sjunga", "Dansa", "Vissla", "Klappa",
        "Smyga", "Springa", "Klättra", "Hoppa", "Dyka", "Simma",
        "Flyga", "Falla", "Ramla", "Glida", "Halka", "Snubbla",
        "Gömma", "Söka", "Jaga", "Fly",
        "Bråka", "Slåss", "Kramas", "Pussas", "Hälsa",
        "Fira", "Gratulera", "Trösta", "Skrämma",
        "Baka", "Steka", "Grilla", "Koka", "Fritera",
        "Måla", "Rita", "Skulptera", "Sy", "Sticka", "Virka",
        "Plantera", "Vattna", "Skörda", "Klippa", "Beskära",
        "Städa", "Tvätta", "Stryka", "Damma", "Skura",
        "Fiska", "Jaga", "Campa", "Vandra", "Paddla",
        "Jogga", "Stretcha", "Meditera", "Yoga",

        # === Samhälle & Politik ===
        "Demokrati", "Diktatur", "Monarki",
        "Kapitalism", "Kommunism", "Socialism",
        "Revolution", "Strejk", "Demonstration", "Protest",
        "Val", "Folkomröstning", "Propaganda",
        "Censur", "Yttrandefrihet", "Pressfrihet",
        "Korruption", "Muta", "Skatteflykt",
        "Rättvisa", "Orättvisa", "Diskriminering",
        "Jämställdhet", "Jämlikhet", "Integration",
        "Inflation", "Deflation", "Recession",
        "Börskrasch", "Konkurs", "Monopol",

        # === Kända platser & Landmärken (kräver precision) ===
        "Eiffeltornet", "Frihetsgudinnan", "Kinesiska muren",
        "Colosseum", "Taj Mahal", "Stonehenge",
        "Pyramiderna", "Sfinxen", "Machu Picchu",
        "Lutande tornet", "Mount Everest", "Grand Canyon",
        "Niagarafallen", "Nordpolen", "Sydpolen",
        "Sahara", "Amazonas", "Bermudatriangeln",
        "Globen", "Öresundsbron", "Turning Torso",

        # === Kända karaktärer (kräver specifika drag) ===
        "Mona Lisa", "Snusmumriken", "Mumin",
        "Pippi Långstrump", "Karlsson på taket",
        "Nalle Puh", "Bamse", "Skalman",
        "Kalle Anka", "Musse Pigg",
        "Super Mario", "Pac-Man", "Pikachu",
        "Batman", "Superman", "Spiderman",
        "Darth Vader", "Yoda", "Harry Potter",
        "Gandalf", "Gollum", "Shrek", "Olaf",
        "Sherlock Holmes", "Robin Hood", "Zorro",
        "Jultomten", "Påskharen", "Tandfen",

        # === Svåra specifika saker ===
        "Kassaskåp", "Bankomat", "Kreditkort", "Aktie",
        "Diamant", "Guldgruva", "Skattkarta",
        "Kassettband", "Vinylskiva", "Grammofon",
        "Cementblandare", "Vinkelslip", "Högtryckstvätt",
        "Kärnkraftverk", "Vindkraftverk", "Solpanel",
        "Satellit", "Rymdstation", "Partikelaccelerator",
        "Röntgen", "Stetoskop", "Ultraljud",
        "Löparbana", "Startblock", "Målsnöre",
        "Kulstötning", "Släggkastning", "Spjutkastning",
        "Stavhopp", "Häcklöpning", "Diskuskastning",
        "Berg-och-dalbana", "Pariserhjul", "Cirkustält",
        "Trollerihatt", "Kristallkula", "Tarotkort"
    ]
}
