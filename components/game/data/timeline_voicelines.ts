// Timeline voiceline mappings - maps message text to audio file names
// Audio files are in public/audio/voicelines/timeline/

export interface TimelineVoiceline {
    text: string;
    file: string;
    time: number; // Time in seconds when this should play
}

// Dark Forest voicelines - every 30 seconds
export const darkForestVoicelines: TimelineVoiceline[] = [
    { time: 0, text: "Ah, they come for your borscht, comrade!", file: "df-001.mp3" },
    { time: 30, text: "They scream louder than accordion at village party!", file: "df-002.mp3" },
    { time: 60, text: "Domovoi swarm! House spirits very angry about dirty boots!", file: "df-003.mp3" },
    { time: 90, text: "Mushrooms! But not the good kind babushka puts in soup!", file: "df-004.mp3" },
    { time: 120, text: "Golems! Heavy like mother-in-law's cooking!", file: "df-005.mp3" },
    { time: 150, text: "Werewolf! Even hairier than uncle Dmitri!", file: "df-006.mp3" },
    { time: 180, text: "More enemies than potatoes in harvest season!", file: "df-007.mp3" },
    { time: 210, text: "Ghost wolves! They howl for your pierogis!", file: "df-008.mp3" },
    { time: 240, text: "Leshy Shamans! Forest magic goes brrrrr!", file: "df-009.mp3" },
    { time: 270, text: "BIG BOSS IS COMING! Hide behind the turnips!", file: "df-010.mp3" },
    { time: 300, text: "Two werewolves! Double the fleas!", file: "df-011.mp3" },
    { time: 330, text: "More golems! They have stones for brains!", file: "df-012.mp3" },
    { time: 360, text: "Ghost pack! They want belly rubs from beyond!", file: "df-013.mp3" },
    { time: 390, text: "Mushroom army! Nature's revenge for all that foraging!", file: "df-014.mp3" },
    { time: 420, text: "Ancient Treant! This tree has been angry for 1000 years!", file: "df-015.mp3" },
    { time: 450, text: "Baby trees! They grow up so fast, then attack you!", file: "df-016.mp3" },
    { time: 480, text: "Wolf spirits! They still want treats from beyond grave!", file: "df-017.mp3" },
    { time: 510, text: "Werewolf pack! Like very angry book club!", file: "df-018.mp3" },
    { time: 540, text: "Wasps! Run faster than babushka chasing grandchildren!", file: "df-019.mp3" },
    { time: 570, text: "Domovoi everywhere! House is very unclean!", file: "df-020.mp3" },
    { time: 600, text: "Shaman convention! Very magical, very dangerous!", file: "df-021.mp3" },
    { time: 630, text: "40 screechers! Like 40 mother-in-laws at once!", file: "df-022.mp3" },
    { time: 660, text: "Shadow stalkers! They follow you like tax collector!", file: "df-023.mp3" },
    { time: 690, text: "100 Domovoi! Did entire village forget to clean?!", file: "df-024.mp3" },
    { time: 720, text: "Two Treants! Forest having family reunion!", file: "df-025.mp3" },
    { time: 750, text: "Elite Golems! They skip leg day never!", file: "df-026.mp3" },
    { time: 780, text: "Shaman army! Forest magic at maximum blyat!", file: "df-027.mp3" },
    { time: 810, text: "40 ghost wolves! They still want walkies!", file: "df-028.mp3" },
    { time: 840, text: "Werewolf army! Full moon special discount!", file: "df-029.mp3" },
    { time: 870, text: "CHERNOBOG! Dark lord himself! Even bears run from this one!", file: "df-030.mp3" },
    { time: 900, text: "VICTORY! You are champion! Even the bears applaud!", file: "df-031.mp3" },
];

// Catacombs voicelines - every 30 seconds
export const catacombsVoicelines: TimelineVoiceline[] = [
    { time: 0, text: "You descend into the ancient catacombs...", file: "cat-001.mp3" },
    { time: 30, text: "Bones rattle in the darkness! Very spooky down here!", file: "cat-002.mp3" },
    { time: 60, text: "Tiny creatures swarm from cracks in the walls!", file: "cat-003.mp3" },
    { time: 90, text: "The smell! Like uncle's socks after harvest festival!", file: "cat-004.mp3" },
    { time: 120, text: "Burning spirits emerge from the walls! Hot hot hot!", file: "cat-005.mp3" },
    { time: 150, text: "More skeletons! They need calcium, comrade!", file: "cat-006.mp3" },
    { time: 180, text: "Stone sentinels guard the deeper passages!", file: "cat-007.mp3" },
    { time: 210, text: "A massive Bone Horror claws its way up!", file: "cat-008.mp3" },
    { time: 240, text: "Frost bats! They want your warm blood!", file: "cat-009.mp3" },
    { time: 270, text: "The walls are closing in! Or maybe that's claustrophobia!", file: "cat-010.mp3" },
    { time: 300, text: "The Crypt Lord awakens! He slept for centuries!", file: "cat-011.mp3" },
    { time: 330, text: "Flame wraiths everywhere! Like disco inferno!", file: "cat-012.mp3" },
    { time: 360, text: "Stone golems march! They are not rolling stones!", file: "cat-013.mp3" },
    { time: 390, text: "An Infernal Wraith rises from the depths!", file: "cat-014.mp3" },
    { time: 420, text: "More crawlers! They have too many legs!", file: "cat-015.mp3" },
    { time: 450, text: "The ground shakes! Something big is coming!", file: "cat-016.mp3" },
    { time: 480, text: "Ancient bones reform! They don't stay dead!", file: "cat-017.mp3" },
    { time: 510, text: "Screechers echo! My ears, comrade!", file: "cat-018.mp3" },
    { time: 540, text: "The Crypt Guardian awakens from its eternal vigil!", file: "cat-019.mp3" },
    { time: 570, text: "Fire and ice mix! Like hot borscht with cold vodka!", file: "cat-020.mp3" },
    { time: 600, text: "A Stone Sentinel rises! Very rocky situation!", file: "cat-021.mp3" },
    { time: 630, text: "Bruisers charge! Like bulls in porcelain shop!", file: "cat-022.mp3" },
    { time: 660, text: "The deeper we go, the worse it gets!", file: "cat-023.mp3" },
    { time: 690, text: "Elite bone crawler! Extra crunchy!", file: "cat-024.mp3" },
    { time: 720, text: "Domovoi found their way down here too!", file: "cat-025.mp3" },
    { time: 750, text: "Flame wraiths multiply! Too hot to handle!", file: "cat-026.mp3" },
    { time: 780, text: "Stone golem elite! Twice the rock, twice the pain!", file: "cat-027.mp3" },
    { time: 810, text: "We are getting close to the bottom!", file: "cat-028.mp3" },
    { time: 840, text: "A Titanic Golem blocks the path!", file: "cat-029.mp3" },
    { time: 870, text: "Another Crypt Guardian stirs!", file: "cat-030.mp3" },
    { time: 900, text: "The army of the dead marches!", file: "cat-031.mp3" },
    { time: 930, text: "Elite wraiths! They burn with ancient hatred!", file: "cat-032.mp3" },
    { time: 960, text: "Stone sentinels everywhere! Like garden gnomes of doom!", file: "cat-033.mp3" },
    { time: 990, text: "The catacombs shake! Something approaches!", file: "cat-034.mp3" },
    { time: 1020, text: "Wave after wave! They just keep coming!", file: "cat-035.mp3" },
    { time: 1050, text: "Frost golems join the fight! Now we have two problems!", file: "cat-036.mp3" },
    { time: 1080, text: "Elite stone golem! Built like brick house!", file: "cat-037.mp3" },
    { time: 1110, text: "Another flame wraith elite! Fire sale continues!", file: "cat-038.mp3" },
    { time: 1140, text: "The deepest level approaches!", file: "cat-039.mp3" },
    { time: 1170, text: "The Ancient Crypt Lord rises from the deepest tomb!", file: "cat-040.mp3" },
    { time: 1200, text: "Final battle begins! Fight for motherland!", file: "cat-041.mp3" },
];

// Frozen Waste voicelines - every 30 seconds
export const frozenWasteVoicelines: TimelineVoiceline[] = [
    { time: 0, text: "Frozen spirits emerge from the blizzard...", file: "fw-001.mp3" },
    { time: 30, text: "Ice witches weave their snares! Very cold magic!", file: "fw-002.mp3" },
    { time: 60, text: "Frost wolves hunt in the storm! They smell your fear!", file: "fw-003.mp3" },
    { time: 90, text: "Frozen giants awaken! Big boys from Siberia!", file: "fw-004.mp3" },
    { time: 120, text: "The cold bites deep! Like ex-girlfriend's words!", file: "fw-005.mp3" },
    { time: 150, text: "Ice golems march forward! Coolest enemies yet!", file: "fw-006.mp3" },
    { time: 180, text: "A Frost Wraith materializes from the ice!", file: "fw-007.mp3" },
    { time: 210, text: "Living ice forms from the permafrost!", file: "fw-008.mp3" },
    { time: 240, text: "Kikimora spirits! Very annoying house ghosts!", file: "fw-009.mp3" },
    { time: 270, text: "The blizzard intensifies! Cannot see hand in front of face!", file: "fw-010.mp3" },
    { time: 300, text: "A colossal Ice Golem rises from the permafrost!", file: "fw-011.mp3" },
    { time: 330, text: "The Ice Maiden's song fills the air! Cover ears!", file: "fw-012.mp3" },
    { time: 360, text: "More zmora! Sleep demons want your dreams!", file: "fw-013.mp3" },
    { time: 390, text: "Ice shards fly! Nature's angry snowball fight!", file: "fw-014.mp3" },
    { time: 420, text: "Snow wraiths phase through the blizzard!", file: "fw-015.mp3" },
    { time: 450, text: "Ancient ice-covered treants stir! Frozen forest walks!", file: "fw-016.mp3" },
    { time: 480, text: "Frost bats swarm! They want warm blood!", file: "fw-017.mp3" },
    { time: 510, text: "The temperature drops! Colder than mother's heart when you forget her birthday!", file: "fw-018.mp3" },
    { time: 540, text: "A Frost Giant awakens from eternal slumber!", file: "fw-019.mp3" },
    { time: 570, text: "Ice elementals form! Winter is very much here!", file: "fw-020.mp3" },
    { time: 600, text: "Another Ice Golem emerges from the blizzard!", file: "fw-021.mp3" },
    { time: 630, text: "Frozen werewolves! Even fleas are frozen!", file: "fw-022.mp3" },
    { time: 660, text: "The permafrost cracks! Something ancient stirs!", file: "fw-023.mp3" },
    { time: 690, text: "Screechers join the frozen horde!", file: "fw-024.mp3" },
    { time: 720, text: "An Ice Golem shatters through the glacier!", file: "fw-025.mp3" },
    { time: 750, text: "Stone golems covered in ice! Double trouble!", file: "fw-026.mp3" },
    { time: 780, text: "The wind howls like babushka at lazy grandson!", file: "fw-027.mp3" },
    { time: 810, text: "Elite ice wraith! Extra frosty!", file: "fw-028.mp3" },
    { time: 840, text: "An Ice Wraith descends upon you!", file: "fw-029.mp3" },
    { time: 870, text: "Frozen undead march! They do not feel cold!", file: "fw-030.mp3" },
    { time: 900, text: "The Ancient Frozen Treant awakens!", file: "fw-031.mp3" },
    { time: 930, text: "More frost giants! Like family reunion in Siberia!", file: "fw-032.mp3" },
    { time: 960, text: "Ice storms rage! Even vodka is frozen!", file: "fw-033.mp3" },
    { time: 990, text: "Kikimora multiply! House spirits have union meeting!", file: "fw-034.mp3" },
    { time: 1020, text: "The frozen army grows stronger!", file: "fw-035.mp3" },
    { time: 1050, text: "Zmora horde! Nightmares become real!", file: "fw-036.mp3" },
    { time: 1080, text: "Another Frost Giant joins the hunt!", file: "fw-037.mp3" },
    { time: 1110, text: "Ice golems everywhere! Like frozen statues of doom!", file: "fw-038.mp3" },
    { time: 1140, text: "The wasteland shows no mercy!", file: "fw-039.mp3" },
    { time: 1170, text: "The Frost Colossus appears! Biggest ice cube ever!", file: "fw-040.mp3" },
    { time: 1200, text: "Elite enemies swarm! This is getting serious!", file: "fw-041.mp3" },
    { time: 1230, text: "Frozen wraiths multiply! Like snow in winter!", file: "fw-042.mp3" },
    { time: 1260, text: "Ancient ice spirits join the battle!", file: "fw-043.mp3" },
    { time: 1290, text: "The blizzard reaches maximum fury!", file: "fw-044.mp3" },
    { time: 1320, text: "Stone sentinels frozen in ice march forward!", file: "fw-045.mp3" },
    { time: 1350, text: "More elite enemies! They mean business!", file: "fw-046.mp3" },
    { time: 1380, text: "Frost giants form battle line!", file: "fw-047.mp3" },
    { time: 1410, text: "The ice cracks beneath your feet!", file: "fw-048.mp3" },
    { time: 1440, text: "Werewolves join the frozen pack!", file: "fw-049.mp3" },
    { time: 1470, text: "Another Frost Colossus emerges!", file: "fw-050.mp3" },
    { time: 1500, text: "The frozen wastes throw everything at you!", file: "fw-051.mp3" },
    { time: 1530, text: "Elite ice golems! Ice age begins!", file: "fw-052.mp3" },
    { time: 1560, text: "Ancient frozen treants awaken! Forest revenge!", file: "fw-053.mp3" },
    { time: 1590, text: "Stone golems join ice army!", file: "fw-054.mp3" },
    { time: 1620, text: "Kikimora elite! Head house spirit very angry!", file: "fw-055.mp3" },
    { time: 1650, text: "The final wave approaches!", file: "fw-056.mp3" },
    { time: 1680, text: "Frozen undead army marches!", file: "fw-057.mp3" },
    { time: 1710, text: "Frost Colossus leads the charge!", file: "fw-058.mp3" },
    { time: 1740, text: "MOROZKO, the Frost King approaches!", file: "fw-059.mp3" },
    { time: 1770, text: "Morozko, the Frost King, has arrived! FINAL BATTLE!", file: "fw-060.mp3" },
];

// Get voicelines for a world
export function getVoicelinesForWorld(worldId: string): TimelineVoiceline[] {
    switch (worldId) {
        case 'dark_forest':
            return darkForestVoicelines;
        case 'catacombs':
            return catacombsVoicelines;
        case 'frozen_waste':
            return frozenWasteVoicelines;
        default:
            return darkForestVoicelines;
    }
}

// Get voiceline for a specific time (within 1 second tolerance)
export function getVoicelineAtTime(worldId: string, time: number): TimelineVoiceline | null {
    const voicelines = getVoicelinesForWorld(worldId);
    return voicelines.find(v => Math.abs(v.time - time) < 1) || null;
}
