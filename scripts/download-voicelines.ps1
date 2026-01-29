# PowerShell script to generate and download voicelines
# Run from project root: .\scripts\download-voicelines.ps1

$outputDir = ".\public\audio\voicelines\timeline"
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force
}

# Voiceline definitions - text and filename
$voicelines = @(
    # Dark Forest
    @{file="df-001.mp3"; text="Ah, they come for your borscht, comrade!"},
    @{file="df-002.mp3"; text="They scream louder than accordion at village party!"},
    @{file="df-003.mp3"; text="Domovoi swarm! House spirits very angry about dirty boots!"},
    @{file="df-004.mp3"; text="Mushrooms! But not the good kind babushka puts in soup!"},
    @{file="df-005.mp3"; text="Golems! Heavy like mother-in-law's cooking!"},
    @{file="df-006.mp3"; text="Werewolf! Even hairier than uncle Dmitri!"},
    @{file="df-007.mp3"; text="More enemies than potatoes in harvest season!"},
    @{file="df-008.mp3"; text="Ghost wolves! They howl for your pierogis!"},
    @{file="df-009.mp3"; text="Leshy Shamans! Forest magic goes brrrrr!"},
    @{file="df-010.mp3"; text="BIG BOSS IS COMING! Hide behind the turnips!"},
    @{file="df-011.mp3"; text="Two werewolves! Double the fleas!"},
    @{file="df-012.mp3"; text="More golems! They have stones for brains!"},
    @{file="df-013.mp3"; text="Ghost pack! They want belly rubs from beyond!"},
    @{file="df-014.mp3"; text="Mushroom army! Nature's revenge for all that foraging!"},
    @{file="df-015.mp3"; text="Ancient Treant! This tree has been angry for 1000 years!"},
    @{file="df-016.mp3"; text="Baby trees! They grow up so fast, then attack you!"},
    @{file="df-017.mp3"; text="Wolf spirits! They still want treats from beyond grave!"},
    @{file="df-018.mp3"; text="Werewolf pack! Like very angry book club!"},
    @{file="df-019.mp3"; text="Wasps! Run faster than babushka chasing grandchildren!"},
    @{file="df-020.mp3"; text="Domovoi everywhere! House is very unclean!"},
    @{file="df-021.mp3"; text="Shaman convention! Very magical, very dangerous!"},
    @{file="df-022.mp3"; text="40 screechers! Like 40 mother-in-laws at once!"},
    @{file="df-023.mp3"; text="Shadow stalkers! They follow you like tax collector!"},
    @{file="df-024.mp3"; text="100 Domovoi! Did entire village forget to clean?!"},
    @{file="df-025.mp3"; text="Two Treants! Forest having family reunion!"},
    @{file="df-026.mp3"; text="Elite Golems! They skip leg day never!"},
    @{file="df-027.mp3"; text="Shaman army! Forest magic at maximum blyat!"},
    @{file="df-028.mp3"; text="40 ghost wolves! They still want walkies!"},
    @{file="df-029.mp3"; text="Werewolf army! Full moon special discount!"},
    @{file="df-030.mp3"; text="CHERNOBOG! Dark lord himself! Even bears run from this one!"},
    @{file="df-031.mp3"; text="VICTORY! You are champion! Even the bears applaud!"}
    # Add catacombs and frozen_waste entries as needed
)

Write-Host "Voicelines to generate: $($voicelines.Count)"
Write-Host "Output directory: $outputDir"
Write-Host ""
Write-Host "Use Claude with MiniMax to generate these voicelines."
Write-Host "Voice ID: Russian_AttractiveGuy"
Write-Host ""

foreach ($v in $voicelines) {
    $path = Join-Path $outputDir $v.file
    if (Test-Path $path) {
        Write-Host "[EXISTS] $($v.file)"
    } else {
        Write-Host "[MISSING] $($v.file): `"$($v.text)`""
    }
}
