#!/usr/bin/env python3
"""Build haw/mi/ty/sm article translations from EN + glossary, then emit articles-batch-6.js."""
from __future__ import annotations

import json
import re
from pathlib import Path

TMP = Path(__file__).resolve().parent
ROOT = TMP.parent
EN = json.loads((ROOT / "articles-en.json").read_text(encoding="utf-8"))
KO = json.loads((TMP / "ko.json").read_text(encoding="utf-8"))
OUT = ROOT / "articles-batch-6.js"

# --- Shared brand / literal passthrough ---
PASSTHROUGH = {
    "Totem Animals Calculator",
    "Totem Calculator",
    "Totem Connections",
    "Totem Connections Directory",
    "Totem Astrology",
    "Totem Astrology™",
    "TotemAstrology.com",
    "TotemAstrology.com™",
    "Travis Barrett LeBlanc",
    "Yin & Yang",
    "Yin &amp; Yang",
    "Nepal Time",
    "NPT",
    "FAQ",
    "Rainbow",
    "Shadow",
    "Same-As-Me",
    "Values Trine",
    "Mirror Opposite",
    "Leave blank:",
    "Page build 20260815",
    "Page build 20260883",
    "+1 (808) 378-6377",
    "WhatsApp & Telegram",
    "Facebook Page",
    "Instagram Page",
    "Email",
    "Name",
    "Message",
    "Booking",
    "USPTO",
    "TESS",
    "GoDaddy",
}

# Animal names per locale (aligned with existing UI batches where possible)
ANIMALS = {
    "ko": {
        "Squirrel": "다람쥐", "Buffalo": "버팔로", "Tiger": "호랑이", "Cat": "고양이",
        "Dragon": "용", "Snake": "뱀", "Serpent": "뱀", "Horse": "말", "Deer": "사슴",
        "Monkey": "원숭이", "Phoenix": "불사조", "Wolf": "늑대", "Bear": "곰",
    },
    "haw": {
        "Squirrel": "ʻIole lāʻau", "Buffalo": "Pipi hihiu", "Tiger": "Tiger", "Cat": "Pōpoki",
        "Dragon": "Dragon", "Snake": "Nahesa", "Serpent": "Nahesa", "Horse": "Lio", "Deer": "Dia",
        "Monkey": "Kekeko", "Phoenix": "Phoenix", "Wolf": "ʻĪlio hihiu", "Bear": "Pea",
    },
    "mi": {
        "Squirrel": "Kiore rākau", "Buffalo": "Pūru", "Tiger": "Taika", "Cat": "Ngeru",
        "Dragon": "Tarakona", "Snake": "Nākahi", "Serpent": "Nākahi", "Horse": "Hōiho", "Deer": "Tia",
        "Monkey": "Makimaki", "Phoenix": "Phoenix", "Wolf": "Wuruki", "Bear": "Pea",
    },
    "ty": {
        "Squirrel": "ʻĪore rāʻau", "Buffalo": "Puaʻatoro", "Tiger": "Tiga", "Cat": "Pīni",
        "Dragon": "Deragona", "Snake": "ʻŌphi", "Serpent": "ʻŌphi", "Horse": "Hōi", "Deer": "Dia",
        "Monkey": "Maki", "Phoenix": "Phoenix", "Wolf": "ʻUri", "Bear": "Bea",
    },
    "sm": {
        "Squirrel": "Isu maumau", "Buffalo": "Pafalo", "Tiger": "Taika", "Cat": "Pusi",
        "Dragon": "Tarako", "Snake": "Gata", "Serpent": "Gata", "Horse": "Solofanua", "Deer": "Tia",
        "Monkey": "Manuki", "Phoenix": "Phoenix", "Wolf": "Luko", "Bear": "Urosa",
    },
}

ELEMENTS = {
    "ko": {"Water": "수", "Wood": "목", "Fire": "화", "Earth": "토", "Metal": "금"},
    "haw": {"Water": "Wai", "Wood": "Lāʻau", "Fire": "Ahi", "Earth": "Honua", "Metal": "Metala"},
    "mi": {"Water": "Wai", "Wood": "Rākau", "Fire": "Ahi", "Earth": "Whenua", "Metal": "Konganuku"},
    "ty": {"Water": "Vai", "Wood": "Rāʻau", "Fire": "Auahi", "Earth": "Fenua", "Metal": "Metara"},
    "sm": {"Water": "Vai", "Wood": "Laʻau", "Fire": "Afi", "Earth": "Lalolagi", "Metal": "Uamea"},
}

PILLARS = {
    "ko": {"Spirit": "영", "Mind": "정신", "Heart": "마음", "Body": "몸",
           "Spiritual": "영적", "Mental": "정신적", "Emotional": "감정적", "Physical": "신체적"},
    "haw": {"Spirit": "ʻUhane", "Mind": "Noʻonoʻo", "Heart": "Naʻau", "Body": "Kino",
            "Spiritual": "ʻUhane", "Mental": "Noʻonoʻo", "Emotional": "Naʻau", "Physical": "Kino"},
    "mi": {"Spirit": "Wairua", "Mind": "Hinengaro", "Heart": "Ngākau", "Body": "Tinana",
           "Spiritual": "Wairua", "Mental": "Hinengaro", "Emotional": "Ngākau", "Physical": "Tinana"},
    "ty": {"Spirit": "Vārua", "Mind": "Manaʻo", "Heart": "ʻĀʻau", "Body": "Tino",
           "Spiritual": "Vārua", "Mental": "Manaʻo", "Emotional": "ʻĀʻau", "Physical": "Tino"},
    "sm": {"Spirit": "Agaga", "Mind": "Mafaufau", "Heart": "Loto", "Body": "Tino",
           "Spiritual": "Faaleagaga", "Mental": "Mafaufau", "Emotional": "Faalelagona", "Physical": "Faaletino"},
}

ROLES = {
    "ko": {"Seeker": "탐구자", "Mage": "마법사", "Royal": "왕족"},
    "haw": {"Seeker": "ʻImi", "Mage": "Kahuna", "Royal": "Aliʻi"},
    "mi": {"Seeker": "Kaitoro", "Mage": "Matakite", "Royal": "Ariki"},
    "ty": {"Seeker": "Te ʻimi", "Mage": "Te tahuʻa", "Royal": "Te ariʻi"},
    "sm": {"Seeker": "Le saili", "Mage": "Le taulaitu", "Royal": "Le tupu"},
}

# Exact short-string translations (EN value -> locale)
SHORT = {
    "Our Hope": {
        "haw": "Ko mākou Manaʻolana", "mi": "Tō Tātou Tūmanako", "ty": "To mātou Turaʻa", "sm": "Lo Tatou Faamoemoe",
    },
    "The System": {
        "haw": "Ka ʻŌnaehana", "mi": "Te Pūnaha", "ty": "Te ʻōpuʻaraʻa", "sm": "Le Faiga",
    },
    "How Totem Astrology Works": {
        "haw": "Pehea e Hana ai ʻo Totem Astrology", "mi": "Me Pēhea te Mahi a Totem Astrology",
        "ty": "Nahea e rave ai te Totem Astrology", "sm": "Pe faʻapefea ona galue Totem Astrology",
    },
    "Your Four Totem Guides": {
        "haw": "Kāu Mau Alakaʻi Totem ʻEhā", "mi": "Ō Kaiārahi Totem e Whā",
        "ty": "To ʻoe e maha aratai totem", "sm": "Ou Taiala Totem e Fa",
    },
    "Read more": {
        "haw": "Heluhelu hou aku", "mi": "Pānui anō", "ty": "A taiʻo faahou", "sm": "Faitau atili",
    },
    "The Five Elements": {
        "haw": "Nā ʻElima Mea", "mi": "Ngā Huānga e Rima", "ty": "Te pae mea", "sm": "O Elemene e Lima",
    },
    "Yin & Yang": {
        "haw": "Yin & Yang", "mi": "Yin & Yang", "ty": "Yin & Yang", "sm": "Yin & Yang",
    },
    "Values Triangles": {
        "haw": "Nā Huinakolu Waiwai", "mi": "Ngā Tapatoru Uara", "ty": "Te mau tapatoru faufaa", "sm": "Tafatolu Taua",
    },
    "Sacred Roles": {
        "haw": "Nā Kuleana Kapu", "mi": "Ngā Tūranga Tapu", "ty": "Te mau tiʻaraʻa moʻa", "sm": "Matafaioi Paia",
    },
    "Nepal Time": {
        "haw": "Manawa Nepal", "mi": "Wā Nepal", "ty": "Taime Nepal", "sm": "Taimi Nepal",
    },
    "How It Works — full overview": {
        "haw": "Pehea e Hana ai — nānā piha", "mi": "Me Pēhea te Mahi — tirohanga katoa",
        "ty": "Nahea e rave — hiʻopoa taatoa", "sm": "Pe faʻapefea ona galue — vaʻai atoa",
    },
    "What We Offer": {
        "haw": "Kā mākou Hāʻawi", "mi": "He aha tā mātou e Tuku ana", "ty": "Te mea e horoʻa nei mātou", "sm": "O le Matou Offa",
    },
    "Personal Reading": {
        "haw": "Heluhelu Pilikino", "mi": "Pānui Whaiaro", "ty": "Taiʻoraʻa taatoʻa", "sm": "Faitau Patino",
    },
    "Relationship Guide": {
        "haw": "Alakaʻi Pilina", "mi": "Aratohu Whanaungatanga", "ty": "Aratai fāriʻiraʻa", "sm": "Taiala Sofuaʻaga",
    },
    "Family Dynamics": {
        "haw": "Nā Dynamics ʻOhana", "mi": "Ngā Dynamika Whānau", "ty": "Te mau dinamika utuafare", "sm": "Dynamika Aiga",
    },
    "Business Goals": {
        "haw": "Nā Pahuhopu ʻOiʻoi", "mi": "Ngā Whāinga Pakihi", "ty": "Te mau fānaʻoraʻa ʻōhipa", "sm": "Sini Pisinisi",
    },
    "New Connections": {
        "haw": "Nā Pilina Hou", "mi": "Ngā Hononga Hou", "ty": "Te mau fāriʻiraʻa āpi", "sm": "Fesootaiga Fou",
    },
    "Totem Connections Directory": {
        "haw": "Papa Kuhikuhi Totem Connections", "mi": "Rārangi Totem Connections",
        "ty": "Lita Totem Connections", "sm": "Lisi Totem Connections",
    },
    "Book a Session": {
        "haw": "E Kākau i kahi Kau", "mi": "Pukapuka he Wātaka", "ty": "A tāpaʻo i te hoê taime", "sm": "Tusi se Sauniga",
    },
    "Your Reading, Step by Step": {
        "haw": "Kāu Heluhelu, ʻAnuʻu ma ʻAnuʻu", "mi": "Tō Pānui, Hipanga ia Hipanga",
        "ty": "To ʻoe taiʻoraʻa, tātaʻitahi", "sm": "Lau Faitau, Laasaga i Laasaga",
    },
    "Reach Out": {
        "haw": "E Hoʻokaʻaʻike Mai", "mi": "Whakapā Mai", "ty": "A parau mai", "sm": "Faʻafesoʻotaʻi Mai",
    },
    "Schedule": {
        "haw": "Papa Hana", "mi": "Wātaka", "ty": "Taime", "sm": "Taimi",
    },
    "Your Session": {
        "haw": "Kāu Kau", "mi": "Tō Wātaka", "ty": "To ʻoe taime", "sm": "Lau Sauniga",
    },
    "Integration": {
        "haw": "Hoʻohui", "mi": "Whakauru", "ty": "Faʻaʻohipa", "sm": "Tuʻufaʻatasia",
    },
    "Client Reflections": {
        "haw": "Nā Noʻonoʻo a nā mea kūʻai", "mi": "Ngā Whakaaro Kiritaki",
        "ty": "Te mau manaʻo a te mau tāata", "sm": "Manatu a Tagata Faʻatau",
    },
    "Words from the Circle": {
        "haw": "Nā ʻŌlelo mai ka Pōʻai", "mi": "Ngā Kupu nō te Porowhita",
        "ty": "Te mau parau mai te ʻōpuʻaraʻa", "sm": "Upu mai le Liʻo",
    },
    "Questions About the System?": {
        "haw": "Nā nīnau e pili ana i ka ʻŌnaehana?", "mi": "He pātai mō te Pūnaha?",
        "ty": "Te mau uira no nia i te ʻōpuʻaraʻa?", "sm": "Fesili e uiga i le Faiga?",
    },
    "Read the FAQ": {
        "haw": "Heluhelu i ka FAQ", "mi": "Pānuitia te FAQ", "ty": "A taiʻo i te FAQ", "sm": "Faitau le FAQ",
    },
    "Ready to Begin?": {
        "haw": "Mākaukau e hoʻomaka?", "mi": "Kua rite ki te tīmata?", "ty": "Ua tapura anei e haamata?", "sm": "Ua sauni e amata?",
    },
    "Schedule Your Session": {
        "haw": "E Hoʻonohonoho i kāu Kau", "mi": "Wātakahia tō Wātaka",
        "ty": "A tāpaʻo i to ʻoe taime", "sm": "Faʻatulaga lau Sauniga",
    },
    "Philosophy": {
        "haw": "Filosofia", "mi": "Philosophy", "ty": "Filosofi", "sm": "Filosofia",
    },
    "Spirit, Mind, Heart & Body": {
        "haw": "ʻUhane, Noʻonoʻo, Naʻau & Kino", "mi": "Wairua, Hinengaro, Ngākau & Tinana",
        "ty": "Vārua, Manaʻo, ʻĀʻau & Tino", "sm": "Agaga, Mafaufau, Loto & Tino",
    },
    "Year · Spirit": {
        "haw": "Makahiki · ʻUhane", "mi": "Tau · Wairua", "ty": "Matahiti · Vārua", "sm": "Tausaga · Agaga",
    },
    "Month · Mind": {
        "haw": "Mahina · Noʻonoʻo", "mi": "Marama · Hinengaro", "ty": "ʻAvaʻe · Manaʻo", "sm": "Masina · Mafaufau",
    },
    "Day · Heart": {
        "haw": "Lā · Naʻau", "mi": "Rā · Ngākau", "ty": "Mahana · ʻĀʻau", "sm": "Aso · Loto",
    },
    "Hour · Body": {
        "haw": "Hola · Kino", "mi": "Hāora · Tinana", "ty": "Hora · Tino", "sm": "Itula · Tino",
    },
    "Reveal your four guides": {
        "haw": "E hōʻike i kāu mau alakaʻi ʻehā", "mi": "Whakaaturia ō kaiārahi e whā",
        "ty": "A faaite i to ʻoe e maha aratai", "sm": "Faʻaalia ou taiala e fa",
    },
    "Explore Values Triangles": {
        "haw": "E ʻimi i nā Huinakolu Waiwai", "mi": "Tūhura ngā Tapatoru Uara",
        "ty": "A hiʻo i te mau tapatoru faufaa", "sm": "Suʻesuʻe Tafatolu Taua",
    },
    "Let's Connect": {
        "haw": "E Hoʻopili Kākou", "mi": "Tāua ka Hono", "ty": "A tātou fāriʻi", "sm": "Tatou Fesootaʻi",
    },
    "Get in Touch": {
        "haw": "E Hoʻokaʻaʻike Mai", "mi": "Whakapā Mai", "ty": "A parau mai", "sm": "Faʻafesoʻotaʻi Mai",
    },
    "Still Curious?": {
        "haw": "Ke nīnau mau nei?", "mi": "Kei te pākiki tonu?", "ty": "E manaʻo faahou anei?", "sm": "O loʻo fia iloa pea?",
    },
    "How It Works": {
        "haw": "Pehea e Hana ai", "mi": "Me Pēhea te Mahi", "ty": "Nahea e rave", "sm": "Pe faʻapefea ona galue",
    },
    "Contact": {
        "haw": "Hoʻokaʻaʻike", "mi": "Whakapā", "ty": "Parau mai", "sm": "Faʻafesoʻotaʻi",
    },
    "Why Totem Astrology": {
        "haw": "No ke aha ʻo Totem Astrology", "mi": "He aha i Totem Astrology ai",
        "ty": "No te aha te Totem Astrology", "sm": "Aiseā Totem Astrology",
    },
    "Hope, Understanding & Grace": {
        "haw": "Manaʻolana, Hoʻomaopopo & Lokomaikaʻi", "mi": "Tūmanako, Māramatanga & Aroha",
        "ty": "Turaʻa, ʻIte & Aroha", "sm": "Faamoemoe, Malamalama & Alofa",
    },
    "Four guides": {
        "haw": "Nā alakaʻi ʻehā", "mi": "Ngā kaiārahi e whā", "ty": "E maha aratai", "sm": "Taiala e fa",
    },
    "Five Elements": {
        "haw": "ʻElima Mea", "mi": "Huānga e Rima", "ty": "E pae mea", "sm": "Elemene e Lima",
    },
    "The Totem Pole": {
        "haw": "Ka Pou Totem", "mi": "Te Pou Totem", "ty": "Te pou totem", "sm": "Le Pou Totem",
    },
    "Elements": {
        "haw": "Nā Mea", "mi": "Ngā Huānga", "ty": "Te mau mea", "sm": "Elemene",
    },
    "Polarity": {
        "haw": "Polarity", "mi": "Polarity", "ty": "Polarité", "sm": "Polarity",
    },
    "Core Values": {
        "haw": "Nā Waiwai Kumu", "mi": "Ngā Uara Matua", "ty": "Te mau faufaa tumu", "sm": "Taua Autū",
    },
    "Archetypes": {
        "haw": "Nā Archetype", "mi": "Ngā Archetype", "ty": "Te mau archetype", "sm": "Archetype",
    },
    "Birth Time": {
        "haw": "Manawa Hānau", "mi": "Wā Whānau", "ty": "Taime fanau", "sm": "Taimi Fanau",
    },
    "Why We Shift to Nepal Time": {
        "haw": "No ke aha mākou e hoʻololi ai i ka Manawa Nepal", "mi": "He aha tā mātou e Neke ai ki te Wā Nepal",
        "ty": "No te aha mātou e tāui ai i te Taime Nepal", "sm": "Aiseā matou te Suia ai i le Taimi Nepal",
    },
    "See Your Totem Pole": {
        "haw": "E nānā i kāu Pou Totem", "mi": "Tirohia tō Pou Totem", "ty": "A hiʻo i to ʻoe pou totem", "sm": "Vaʻai i lau Pou Totem",
    },
    "Book a Reading": {
        "haw": "E Kākau i kahi Heluhelu", "mi": "Pukapuka he Pānui", "ty": "A tāpaʻo i te hoê taiʻoraʻa", "sm": "Tusi se Faitau",
    },
    "The Foundation": {
        "haw": "Ke Kahua", "mi": "Te Tūāpapa", "ty": "Te tumu", "sm": "Le Faavae",
    },
    "Four Universal Values": {
        "haw": "Nā Waiwai Universal ʻEhā", "mi": "Ngā Uara Ao e Whā", "ty": "E maha faufaa ao", "sm": "Taua Ao e Fa",
    },
    "Power & Prestige": {
        "haw": "Mana & Hanohano", "mi": "Mana & Prestige", "ty": "Mana & Hanahana", "sm": "Malosi & Mamalu",
    },
    "Stability & Security": {
        "haw": "Kūpaʻa & Palekana", "mi": "Pūmau & Haumarutanga", "ty": "Paari & Parururaʻa", "sm": "Mautu & Saogalemu",
    },
    "Inspiration & Idealism": {
        "haw": "Hoʻoikaika & Idealism", "mi": "Whakaawe & Idealism", "ty": "Haʻamānaʻo & Idealisme", "sm": "Faʻaosofia & Idealism",
    },
    "Peace & Harmony": {
        "haw": "Maluhia & Lokahi", "mi": "Rangimārie & Harmony", "ty": "Hau & Harmony", "sm": "Filemu & Harmony",
    },
    "How It Works": {
        "haw": "Pehea e Hana ai", "mi": "Me Pēhea te Mahi", "ty": "Nahea e rave", "sm": "Pe faʻapefea ona galue",
    },
    "The Four Primary Values": {
        "haw": "Nā Waiwai Primary ʻEhā", "mi": "Ngā Uara Matua e Whā", "ty": "E maha faufaa tumu", "sm": "Taua Autū e Fa",
    },
    "Continue to the Sacred Roles": {
        "haw": "E hoʻomau i nā Kuleana Kapu", "mi": "Haere tonu ki ngā Tūranga Tapu",
        "ty": "A haere i te mau tiʻaraʻa moʻa", "sm": "Faʻaauau i Matafaioi Paia",
    },
    "The Power Triangle": {
        "haw": "Ka Huinakolu Mana", "mi": "Te Tapatoru Mana", "ty": "Te tapatoru mana", "sm": "Le Tafatolu Malosi",
    },
    "The Security Triangle": {
        "haw": "Ka Huinakolu Palekana", "mi": "Te Tapatoru Haumarutanga", "ty": "Te tapatoru parururaʻa", "sm": "Le Tafatolu Saogalemu",
    },
    "The Inspiration Triangle": {
        "haw": "Ka Huinakolu Hoʻoikaika", "mi": "Te Tapatoru Whakaawe", "ty": "Te tapatoru haʻamānaʻo", "sm": "Le Tafatolu Faʻaosofia",
    },
    "The Harmony Triangle": {
        "haw": "Ka Huinakolu Lokahi", "mi": "Te Tapatoru Harmony", "ty": "Te tapatoru harmony", "sm": "Le Tafatolu Harmony",
    },
    "Rainbow Companions": {
        "haw": "Nā Hoa Ānuenue", "mi": "Ngā Hoa Āniwaniwa", "ty": "Te mau hoa Ānuenue", "sm": "Uo Nuanua",
    },
    "Yin & Yang Pairs": {
        "haw": "Nā Pāʻa Yin & Yang", "mi": "Ngā Takirua Yin & Yang", "ty": "Te mau pāpaʻi Yin & Yang", "sm": "Paʻaga Yin & Yang",
    },
    "Shadow Companions": {
        "haw": "Nā Hoa Aka", "mi": "Ngā Hoa Āta", "ty": "Te mau hoa ʻata", "sm": "Uo Ata",
    },
    "The Rainbow’s Inverse": {
        "haw": "Ke Inverse o ka Ānuenue", "mi": "Te Inverse o te Āniwaniwa",
        "ty": "Te inverse o te Ānuenue", "sm": "Le Inverse o le Nuanua",
    },
    "In Practice": {
        "haw": "Ma ka Hana", "mi": "I te Mahi", "ty": "I te faʻaʻohiparaʻa", "sm": "I le Faʻatinoga",
    },
    "Discover Your Four Animal Guides": {
        "haw": "E ʻike i kāu mau Alakaʻi Holoholona ʻEhā", "mi": "Kimihia ō Kaiārahi Kararehe e Whā",
        "ty": "A ite i to ʻoe e maha aratai animala", "sm": "Suʻe ou Taiala Manu e Fa",
    },
    "Book a Personal Reading": {
        "haw": "E Kākau i kahi Heluhelu Pilikino", "mi": "Pukapuka he Pānui Whaiaro",
        "ty": "A tāpaʻo i te hoê taiʻoraʻa taatoʻa", "sm": "Tusi se Faitau Patino",
    },
    "Meet Your Four Guides": {
        "haw": "E hālāwai me kāu mau Alakaʻi ʻEhā", "mi": "Tūtaki ki ō Kaiārahi e Whā",
        "ty": "A farerei i to ʻoe e maha aratai", "sm": "Feiloaʻi ma ou Taiala e Fa",
    },
    "Water": {"haw": "Wai", "mi": "Wai", "ty": "Vai", "sm": "Vai"},
    "Wood": {"haw": "Lāʻau", "mi": "Rākau", "ty": "Rāʻau", "sm": "Laʻau"},
    "Fire": {"haw": "Ahi", "mi": "Ahi", "ty": "Auahi", "sm": "Afi"},
    "Earth": {"haw": "Honua", "mi": "Whenua", "ty": "Fenua", "sm": "Lalolagi"},
    "Metal": {"haw": "Metala", "mi": "Konganuku", "ty": "Metara", "sm": "Uamea"},
    "Yang animals": {
        "haw": "Nā holoholona Yang", "mi": "Ngā kararehe Yang", "ty": "Te mau animala Yang", "sm": "Manu Yang",
    },
    "Yin animals": {
        "haw": "Nā holoholona Yin", "mi": "Ngā kararehe Yin", "ty": "Te mau animala Yin", "sm": "Manu Yin",
    },
    "Yang — the outward current": {
        "haw": "Yang — ke au i waho", "mi": "Yang — te au ki waho", "ty": "Yang — te au i waho", "sm": "Yang — le au i fafo",
    },
    "Yin — the inward current": {
        "haw": "Yin — ke au i loko", "mi": "Yin — te au ki roto", "ty": "Yin — te au i roto", "sm": "Yin — le au i totonu",
    },
    "Two modes, one whole": {
        "haw": "ʻElua ʻano, hoʻokahi holoʻokoʻa", "mi": "E rua momo, kotahi te katoa",
        "ty": "E piti huru, hoê taatoʻa", "sm": "Ituaiga e lua, tasi le atoa",
    },
    "Where Yin & Yang go next": {
        "haw": "Kahi e hele ai ʻo Yin & Yang ma hope", "mi": "Ki hea haere ai a Yin & Yang i muri",
        "ty": "Te vāhi e haere ai Yin & Yang i muri", "sm": "O fea e alu ai Yin & Yang i luma",
    },
    "See Yin & Yang On Your Totem Pole": {
        "haw": "E nānā iā Yin & Yang ma kāu Pou Totem", "mi": "Tirohia a Yin & Yang i tō Pou Totem",
        "ty": "A hiʻo i Yin & Yang i to ʻoe pou totem", "sm": "Vaʻai Yin & Yang i lau Pou Totem",
    },
    "See Both Times On Your Totem Pole": {
        "haw": "E nānā i nā manawa ʻelua ma kāu Pou Totem", "mi": "Tirohia ngā wā e rua i tō Pou Totem",
        "ty": "A hiʻo i te mau taime e piti i to ʻoe pou totem", "sm": "Vaʻai taimi e lua i lau Pou Totem",
    },
    "The Four Royals": {
        "haw": "Nā Aliʻi ʻEhā", "mi": "Ngā Ariki e Whā", "ty": "Te mau ariʻi e maha", "sm": "Tupu e Fa",
    },
    "Celestial & Earthly Realms": {
        "haw": "Nā Aupuni Lani & Honua", "mi": "Ngā Ao Rangi & Whenua",
        "ty": "Te mau basileia i te raʻi & i te fenua", "sm": "Malo Lagi & Lalolagi",
    },
    "The Celestial Realm": {
        "haw": "Ke Aupuni Lani", "mi": "Te Ao Rangi", "ty": "Te basileia i te raʻi", "sm": "Le Malo Lagi",
    },
    "The Earthly Realm": {
        "haw": "Ke Aupuni Honua", "mi": "Te Ao Whenua", "ty": "Te basileia i te fenua", "sm": "Le Malo Lalolagi",
    },
    "Explore the Values Triangles": {
        "haw": "E ʻimi i nā Huinakolu Waiwai", "mi": "Tūhura ngā Tapatoru Uara",
        "ty": "A hiʻo i te mau tapatoru faufaa", "sm": "Suʻesuʻe Tafatolu Taua",
    },
    "Not Sure Which Reading Fits?": {
        "haw": "ʻAʻole maopopo i ka heluhelu kūpono?", "mi": "Kāore e mōhio ko tēhea Pānui?",
        "ty": "Aita e papu i te taiʻoraʻa?", "sm": "Le mautinoa le Faitau?",
    },
    "Ask a Question": {
        "haw": "E nīnau i kahi nīnau", "mi": "Tono he Pātai", "ty": "A ui i te hoê uira", "sm": "Fai se Fesili",
    },
    "Trademark": {
        "haw": "Trademark", "mi": "Trademark", "ty": "Trademark", "sm": "Trademark",
    },
    "Copyright": {
        "haw": "Copyright", "mi": "Copyright", "ty": "Copyright", "sm": "Copyright",
    },
    "Permitted Use": {
        "haw": "Hoʻohana ʻAe ʻia", "mi": "Whakamahi Whakaaetia", "ty": "Faʻaʻohiparaʻa faatiahia", "sm": "Faʻaaoga Faʻatagaina",
    },
    "Readings & Disclaimer": {
        "haw": "Nā Heluhelu & Disclaimer", "mi": "Ngā Pānui & Disclaimer",
        "ty": "Te mau taiʻoraʻa & Disclaimer", "sm": "Faitau & Disclaimer",
    },
    "Registration Roadmap": {
        "haw": "Alanui Registration", "mi": "Mahere Rēhita", "ty": "Aʻamu registration", "sm": "Ala Registration",
    },
    "Trademark candidates": {
        "haw": "Nā moho Trademark", "mi": "Ngā kaitono Trademark", "ty": "Te mau candida Trademark", "sm": "Sui Trademark",
    },
    "Copyright candidates": {
        "haw": "Nā moho Copyright", "mi": "Ngā kaitono Copyright", "ty": "Te mau candida Copyright", "sm": "Sui Copyright",
    },
    "Before filing — quick checklist": {
        "haw": "Ma mua o ka waiho ʻana — papa kuhikuhi wikiwiki", "mi": "I mua i te tuku — rārangi tere",
        "ty": "Mamua i te tāpaʻoraʻa — lita vave", "sm": "Aʻo le faila — lisi vave",
    },
    "Last updated: July 3, 2026": {
        "haw": "Hoʻonui hope: Iulai 3, 2026", "mi": "Whakahoutanga whakamutunga: Hūrae 3, 2026",
        "ty": "Faʻahoʻohou hopeʻa: Tiurai 3, 2026", "sm": "Faʻafou mulimuli: Iulai 3, 2026",
    },
    "Service Interested In": {
        "haw": "Lawelawe e hoihoi ai", "mi": "Ratonga e hiahia ana", "ty": "Te raveʻa e manaʻo ai", "sm": "Auaunaga e fiafia i ai",
    },
    "Select a service…": {
        "haw": "E koho i kahi lawelawe…", "mi": "Tīpakohia he ratonga…", "ty": "A maiti i te hoê raveʻa…", "sm": "Filifili se auaunaga…",
    },
    "Other / Not Sure": {
        "haw": "ʻĒ aʻe / ʻAʻole maopopo", "mi": "Ētahi atu / Kāore e mōhio", "ty": "Te tahi / Aita e papu", "sm": "Isi / Le mautinoa",
    },
    "Send Message": {
        "haw": "E hoʻouna i ka memo", "mi": "Tukua te Karere", "ty": "A pūpū i te parau", "sm": "Auina le Feʻau",
    },
    "How it works": {
        "haw": "Pehea e hana ai", "mi": "Me pēhea te mahi", "ty": "Nahea e rave", "sm": "Pe faʻapefea ona galue",
    },
    "The bigger picture": {
        "haw": "Ke kiʻi nui aʻe", "mi": "Te whakaahua nui", "ty": "Te hohoʻa nui", "sm": "Le ata tele",
    },
    "Want a Personal Reading?": {
        "haw": "Makemake i kahi Heluhelu Pilikino?", "mi": "Kei te hiahia he Pānui Whaiaro?",
        "ty": "E hinaʻaro anei i te taiʻoraʻa taatoʻa?", "sm": "E te manaʻo i se Faitau Patino?",
    },
    "Five Connection Modes": {
        "haw": "ʻElima ʻAno Pilina", "mi": "E Rima Momo Hononga", "ty": "E pae huru fāriʻiraʻa", "sm": "Ituaiga Fesootaiga e Lima",
    },
    "How Matching Works": {
        "haw": "Pehea e Hana ai ka Matching", "mi": "Me Pēhea te Mahi o te Ōrite",
        "ty": "Nahea e rave ai te matching", "sm": "Pe faʻapefea ona galue le Matching",
    },
    "Connection Type": {
        "haw": "ʻAno Pilina", "mi": "Momo Hononga", "ty": "Huru fāriʻiraʻa", "sm": "Ituaiga Fesootaiga",
    },
    "Other connection types": {
        "haw": "Nā ʻano pilina ʻē aʻe", "mi": "Ētahi atu momo hononga", "ty": "Te tahi atu huru fāriʻiraʻa", "sm": "Isi ituaiga fesootaiga",
    },
    "Find Rainbow Matches": {
        "haw": "E ʻimi i nā Matches Ānuenue", "mi": "Kimihia ngā Ōrite Āniwaniwa",
        "ty": "A imi i te mau match Ānuenue", "sm": "Saili Matches Nuanua",
    },
    "Find Shadow Matches": {
        "haw": "E ʻimi i nā Matches Aka", "mi": "Kimihia ngā Ōrite Āta",
        "ty": "A imi i te mau match ʻata", "sm": "Saili Matches Ata",
    },
    "Find Mirror Opposite Matches": {
        "haw": "E ʻimi i nā Matches Mirror Opposite", "mi": "Kimihia ngā Ōrite Mirror Opposite",
        "ty": "A imi i te mau match Mirror Opposite", "sm": "Saili Matches Mirror Opposite",
    },
    "Find Values Trine Matches": {
        "haw": "E ʻimi i nā Matches Values Trine", "mi": "Kimihia ngā Ōrite Values Trine",
        "ty": "A imi i te mau match Values Trine", "sm": "Saili Matches Values Trine",
    },
    "Find Same-As-Me Matches": {
        "haw": "E ʻimi i nā Matches Same-As-Me", "mi": "Kimihia ngā Ōrite Same-As-Me",
        "ty": "A imi i te mau match Same-As-Me", "sm": "Saili Matches Same-As-Me",
    },
    "← How It Works": {
        "haw": "← Pehea e Hana ai", "mi": "← Me Pēhea te Mahi", "ty": "← Nahea e rave", "sm": "← Pe faʻapefea ona galue",
    },
    "← Totem Connections": {
        "haw": "← Totem Connections", "mi": "← Totem Connections", "ty": "← Totem Connections", "sm": "← Totem Connections",
    },
    "Learn more →": {
        "haw": "Aʻo hou aku →", "mi": "Ako anō →", "ty": "A haʻapiʻi faahou →", "sm": "Aʻoaʻo atili →",
    },
    "Find your people →": {
        "haw": "E ʻimi i kāu poʻe →", "mi": "Kimihia ō tāngata →", "ty": "A imi i to ʻoe taata →", "sm": "Saili ou tagata →",
    },
    "Reveal your totem animals →": {
        "haw": "E hōʻike i kāu mau holoholona totem →", "mi": "Whakaaturia ō kararehe totem →",
        "ty": "A faaite i to ʻoe mau animala totem →", "sm": "Faʻaalia ou manu totem →",
    },
    "get in touch": {
        "haw": "e hoʻokaʻaʻike mai", "mi": "whakapā mai", "ty": "a parau mai", "sm": "faʻafesoʻotaʻi mai",
    },
    "Why Nepal Time?": {
        "haw": "No ke aha ka Manawa Nepal?", "mi": "He aha te Wā Nepal?", "ty": "No te aha te Taime Nepal?", "sm": "Aiseā le Taimi Nepal?",
    },
    "book a session": {
        "haw": "e kākau i kahi kau", "mi": "pukapuka he wātaka", "ty": "a tāpaʻo i te hoê taime", "sm": "tusi se sauniga",
    },
    "calculator results": {
        "haw": "nā hopena calculator", "mi": "ngā hua tātaitai", "ty": "te mau hopoiʻa tātaitai", "sm": "iʻuga o le masini",
    },
}

# Role/animal title patterns
TITLES = {
    "The Squirrel — The Seeker": {
        "haw": "Ka ʻIole lāʻau — Ke ʻImi", "mi": "Te Kiore rākau — Te Kaitoro",
        "ty": "Te ʻĪore rāʻau — Te ʻimi", "sm": "Le Isu maumau — Le Saili",
    },
    "The Dragon — The Royal": {
        "haw": "Ka Dragon — Ke Aliʻi", "mi": "Te Tarakona — Te Ariki",
        "ty": "Te Deragona — Te ariʻi", "sm": "Le Tarako — Le Tupu",
    },
    "The Monkey — The Mage": {
        "haw": "Ka Kekeko — Ke Kahuna", "mi": "Te Makimaki — Te Matakite",
        "ty": "Te Maki — Te tahuʻa", "sm": "Le Manuki — Le Taulaitu",
    },
    "The Buffalo — The Seeker": {
        "haw": "Ka Pipi hihiu — Ke ʻImi", "mi": "Te Pūru — Te Kaitoro",
        "ty": "Te Puaʻatoro — Te ʻimi", "sm": "Le Pafalo — Le Saili",
    },
    "The Serpent — The Mage": {
        "haw": "Ka Nahesa — Ke Kahuna", "mi": "Te Nākahi — Te Matakite",
        "ty": "Te ʻŌphi — Te tahuʻa", "sm": "Le Gata — Le Taulaitu",
    },
    "The Phoenix — The Royal": {
        "haw": "Ka Phoenix — Ke Aliʻi", "mi": "Te Phoenix — Te Ariki",
        "ty": "Te Phoenix — Te ariʻi", "sm": "Le Phoenix — Le Tupu",
    },
    "The Tiger — The Royal": {
        "haw": "Ka Tiger — Ke Aliʻi", "mi": "Te Taika — Te Ariki",
        "ty": "Te Tiga — Te ariʻi", "sm": "Le Taika — Le Tupu",
    },
    "The Horse — The Seeker": {
        "haw": "Ka Lio — Ke ʻImi", "mi": "Te Hōiho — Te Kaitoro",
        "ty": "Te Hōi — Te ʻimi", "sm": "Le Solofanua — Le Saili",
    },
    "The Wolf — The Mage": {
        "haw": "Ka ʻĪlio hihiu — Ke Kahuna", "mi": "Te Wuruki — Te Matakite",
        "ty": "Te ʻUri — Te tahuʻa", "sm": "Le Luko — Le Taulaitu",
    },
    "The Cat — The Mage": {
        "haw": "Ka Pōpoki — Ke Kahuna", "mi": "Te Ngeru — Te Matakite",
        "ty": "Te Pīni — Te tahuʻa", "sm": "Le Pusi — Le Taulaitu",
    },
    "The Deer — The Seeker": {
        "haw": "Ka Dia — Ke ʻImi", "mi": "Te Tia — Te Kaitoro",
        "ty": "Te Dia — Te ʻimi", "sm": "Le Tia — Le Saili",
    },
    "The Bear — The Royal": {
        "haw": "Ka Pea — Ke Aliʻi", "mi": "Te Pea — Te Ariki",
        "ty": "Te Bea — Te ariʻi", "sm": "Le Urosa — Le Tupu",
    },
}


def apply_terms(text: str, loc: str) -> str:
    """Replace domain terms inside a string while preserving HTML and brands."""
    # Protect HTML
    tags = {}
    def tag_sub(m):
        k = f"⟦TAG{len(tags)}⟧"
        tags[k] = m.group(0)
        return k
    out = re.sub(r"<[^>]+>", tag_sub, text)

    # Brands first (longest)
    brands = [
        "TotemAstrology.com™", "TotemAstrology.com", "Totem Astrology™", "Totem Astrology",
        "Totem Connections", "Totem Animals Calculator", "Totem Calculator",
        "Four Pillars of Destiny", "Travis Barrett LeBlanc", "Earthly Wisdom for your Journey",
        "Winnie the Pooh", "Wizard of Oz", "Jade Emperor", "Values Triangles", "Sacred Roles",
        "Nepal Time", "Five Elements", "Rainbow companions", "Shadow companions",
        "Rainbow Companions", "Shadow Companions", "Same-As-Me", "Values Trine", "Mirror Opposite",
    ]
    brand_map = {}
    for i, b in enumerate(brands):
        if b in out:
            tok = f"⟦BR{i}⟧"
            out = out.replace(b, tok)
            brand_map[tok] = b

    # Animals (word boundaries-ish)
    for en_a, loc_a in ANIMALS[loc].items():
        out = re.sub(rf"\b{re.escape(en_a)}\b", loc_a, out)
    for en_e, loc_e in ELEMENTS[loc].items():
        out = re.sub(rf"\b{re.escape(en_e)}\b", loc_e, out)
    for en_p, loc_p in PILLARS[loc].items():
        out = re.sub(rf"\b{re.escape(en_p)}\b", loc_p, out)
    for en_r, loc_r in ROLES[loc].items():
        out = re.sub(rf"\bThe {re.escape(en_r)}\b", loc_r if loc != "ty" else loc_r, out)
        out = re.sub(rf"\b{re.escape(en_r)}\b", loc_r.replace("Te ", "").replace("Le ", "") if loc in ("ty", "sm") else loc_r, out)

    for tok, b in brand_map.items():
        out = out.replace(tok, b)
    for tok, t in tags.items():
        out = out.replace(tok, t)
    return out


# Load long-form translations if present (written separately)
LONG_FILES = {loc: TMP / f"long-{loc}.json" for loc in ("haw", "mi", "ty", "sm")}


def translate_one(key: str, en: str, loc: str, long_maps: dict) -> str:
    if en in PASSTHROUGH or en.startswith("Page build ") or en.startswith("<a href=\"mailto:") \
            or en.startswith("<a href=\"https://www.facebook") or en.startswith("<a href=\"https://www.instagram") \
            or en.startswith("<a href=\"https://wa.me") or re.fullmatch(r"[+\d\s().-]+", en):
        # still localize link labels when wrapped
        if en.startswith("<a href=\"connections.html"):
            return en  # brand in link text
        if en.startswith("<a href=\"how-it-works.html\">← How It Works</a>"):
            return f'<a href="how-it-works.html">{SHORT["← How It Works"][loc]}</a>'
        if en == '<a href="connections.html?v=20260807">← Totem Connections</a>':
            return en
        return en

    if en in SHORT:
        return SHORT[en][loc]
    if en in TITLES:
        return TITLES[en][loc]

    # Link-only variants in HTML wrappers
    m = re.fullmatch(r'(<a href="[^"]+"[^>]*>)(.*?)(</a>)', en, re.DOTALL)
    if m and m.group(2) in SHORT:
        return m.group(1) + SHORT[m.group(2)][loc] + m.group(3)
    if m and m.group(2) in PASSTHROUGH:
        return en
    if m and m.group(2).startswith("← ") and m.group(2)[2:] in SHORT:
        return m.group(1) + "← " + SHORT[m.group(2)[2:]][loc] + m.group(3)

    # Strong-wrapped animal pairs
    if en.startswith("<strong>") and " + " in en:
        return apply_terms(en, loc)

    # Long map override
    if key in long_maps.get(loc, {}):
        return long_maps[loc][key]

    # Fallback: term-substituted English (better than missing; long maps should cover)
    return apply_terms(en, loc)


def main():
    long_maps = {}
    for loc, path in LONG_FILES.items():
        if path.exists():
            long_maps[loc] = json.loads(path.read_text(encoding="utf-8"))
            print(f"loaded long-{loc}: {len(long_maps[loc])}")
        else:
            long_maps[loc] = {}
            print(f"missing {path.name} — using term-sub fallback")

    batch = {"ko": KO}
    for loc in ("haw", "mi", "ty", "sm"):
        d = {}
        for k, v in EN.items():
            d[k] = translate_one(k, v, loc, long_maps)
        batch[loc] = d
        # per-locale cache
        (TMP / f"{loc}.json").write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        missing = [k for k in EN if k not in d]
        print(f"{loc}: keys={len(d)} missing={len(missing)}")

    # Verify
    for loc, d in batch.items():
        miss = [k for k in EN if k not in d]
        assert not miss, (loc, miss[:5])
        assert len(d) == 619

    # Emit JS
    def js_escape(s: str) -> str:
        return json.dumps(s, ensure_ascii=False)

    lines = ["export const BATCH = {"]
    for loc in ("ko", "haw", "mi", "ty", "sm"):
        lines.append(f'  "{loc}": {{')
        items = list(batch[loc].items())
        for i, (k, v) in enumerate(items):
            comma = "," if i < len(items) - 1 else ""
            lines.append(f'    {js_escape(k)}: {js_escape(v)}{comma}')
        comma = "," if loc != "sm" else ""
        lines.append(f"  }}{comma}")
    lines.append("};")
    lines.append("")
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT}")

    # Final verification via import-like parse
    for loc in ("ko", "haw", "mi", "ty", "sm"):
        miss = sum(1 for k in EN if k not in batch[loc])
        print(f"verify {loc}: keys={len(batch[loc])} missing={miss}")


if __name__ == "__main__":
    main()
