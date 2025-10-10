const languageMapRaw = {
    'de-AT': "Deutsch mit so einem ausgeschrieben österreichischem Akzent",
    'de-BY': "Deutsch mit so einem ausgeschrieben bayrischem Akzent",
    'de-SB': "Deutsch mit so einem ausgeschrieben schwäbischem Akzent",
    'de-CH': "Schweizerisch mit einem ausgeschrieben Akzent",
    'de-DY': 'Deutsche Sprache mit aktuellem Jugendslang',
    'en-US-bx': "In Englischer Sprache mit einem richtig hardcore Bostoner Akzent, wo das 'R' einfach verschwindet",
    'en-US-sx': "In Englischer Sprache mit so einem typischen Südstaaten-Akzent, wo alles gemütlich gezogen wird",
    'en-US-cx': "In Englischer Sprache im mega chilligen Surfer-Slang, als wärst du immer kurz vorm Wellenreiten",
};

const languageMap = {};
for (const key in languageMapRaw) {
    languageMap[key.toLowerCase()] = languageMapRaw[key];
}

module.exports = { languageMapRaw, languageMap };
