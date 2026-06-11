(function (window) {
  'use strict';

  window.OA_NARRATIVE_LIBRARY = {
    catalystTemplates: [
      { id: "catalyst_001", title: "Relay Insult", text: "{{genealord}} treated {{ronin}}'s interference as an insult against the bloodline. Before {{signal}} cleared, {{mutant}} was already moving toward {{route}}.", tags: ["grudge", "signal", "pursuit"], intensity: "medium" },
      { id: "catalyst_002", title: "Burned Marker", text: "{{ronin}} found a burned field marker carrying {{genealord}} command code. The message named {{mission}} and left {{route}} exposed.", tags: ["marker", "command", "route"], intensity: "medium" },
      { id: "catalyst_003", title: "Mutant Pressure", text: "{{mutant}} struck the outer relay and forced {{genealord}} to answer with hard pursuit. {{ronin}} entered {{route}} because no quiet road remained.", tags: ["mutant", "relay", "pursuit"], intensity: "high" },
      { id: "catalyst_004", title: "Debt Signal", text: "{{ally}} opened {{signal}} with an old debt attached to every word. {{genealord}} heard the channel wake and marked {{route}} for closure.", tags: ["ally", "debt", "signal"], intensity: "medium" },
      { id: "catalyst_005", title: "Broken Corridor", text: "{{route}} collapsed behind {{ronin}} after {{enemy}} fed false clearance into the grid. {{mission}} became extraction under hostile observation.", tags: ["route", "enemy", "extraction"], intensity: "high" },
      { id: "catalyst_006", title: "Blood Ledger", text: "{{genealord}} carried an old family ledger naming {{ronin}} as unpaid damage. The first move of {{mission}} became personal before command could contain it.", tags: ["family", "ledger", "grudge"], intensity: "high" },
      { id: "catalyst_007", title: "Cold Wake", text: "{{signal}} came alive without permission and pulled {{thirdForce}} into the field. {{ronin}} had one clean minute before {{genealord}} found the source.", tags: ["signal", "thirdForce", "timing"], intensity: "medium" },
      { id: "catalyst_008", title: "Hostile Inheritance", text: "{{genealord}} claimed {{route}} as inherited command ground. {{ronin}} crossed it anyway, and the Unseen Hand recorded the insult.", tags: ["inheritance", "route", "rivalry"], intensity: "medium" },
      { id: "catalyst_009", title: "Failed Silence", text: "{{ally}} tried to mute {{signal}}, but the relay coughed {{ronin}}'s position into the open. {{mutant}} moved first, and {{genealord}} followed with purpose.", tags: ["failure", "ally", "mutant"], intensity: "high" },
      { id: "catalyst_010", title: "Sealed Gate", text: "{{enemy}} sealed the civilian gate and left {{route}} as the only corridor with air. {{ronin}} entered under pressure while {{genealord}} measured the cost.", tags: ["gate", "pressure", "route"], intensity: "high" },
      { id: "catalyst_011", title: "Command Trespass", text: "{{ronin}} touched a restricted command band inside {{signal}}. {{genealord}} answered as if the act had wounded the house itself.", tags: ["command", "signal", "grudge"], intensity: "medium" },
      { id: "catalyst_012", title: "Hunted Asset", text: "{{mission}} began when {{ally}} identified {{ronin}} as the only asset still moving. {{route}} was open, but every open road had been baited.", tags: ["asset", "ally", "bait"], intensity: "medium" },
      { id: "catalyst_013", title: "Rival Claim", text: "{{genealord}} claimed the kill before the hunt began. {{ronin}} answered by taking {{route}} and turning {{signal}} into a challenge.", tags: ["rival", "route", "signal"], intensity: "high" },
      { id: "catalyst_014", title: "Ash Relay", text: "The relay at {{route}} transmitted through smoke and ash. It carried {{injury}}, {{loss}}, and one clear demand for {{ronin}} to move.", tags: ["relay", "injury", "loss"], intensity: "critical" },
      { id: "catalyst_015", title: "Third Force Bid", text: "{{thirdForce}} offered {{gain}} in exchange for access to {{signal}}. {{genealord}} called it theft, and {{ronin}} became the price.", tags: ["thirdForce", "bargain", "signal"], intensity: "medium" },
      { id: "catalyst_016", title: "Oath Static", text: "{{signal}} carried the remains of an oath {{ronin}} had not kept. {{genealord}} recognized the failure and sent {{enemy}} to collect.", tags: ["oath", "enemy", "signal"], intensity: "high" },
      { id: "catalyst_017", title: "No Safe Return", text: "{{route}} stopped answering behind {{ronin}}. The only forward movement ran through {{mutant}}, {{enemy}}, and a command choice with no clean side.", tags: ["route", "mutant", "choice"], intensity: "critical" },
      { id: "catalyst_018", title: "Family Cipher", text: "{{ally}} decoded a family cipher buried in {{signal}}. It proved {{genealord}} had been hunting {{ronin}} before {{mission}} was named.", tags: ["family", "cipher", "hunt"], intensity: "high" },
      { id: "catalyst_019", title: "Exposed Mercy", text: "{{ronin}} spared a wounded runner and exposed {{route}} for six seconds. {{genealord}} saw mercy as weakness and committed pursuit.", tags: ["mercy", "route", "pursuit"], intensity: "medium" },
      { id: "catalyst_020", title: "Black Start", text: "{{signal}} died, returned, and named {{mission}} in a voice that did not belong to command. {{thirdForce}} was inside the field before anyone admitted it.", tags: ["signal", "thirdForce", "mission"], intensity: "critical" },
      { id: "catalyst_021", title: "Inheritance Breach", text: "{{ronin}} crossed a corridor {{genealord}} claimed by blood right. {{mission}} opened with a family insult and no room for apology.", tags: ["family", "route", "breach"], intensity: "high" },
      { id: "catalyst_022", title: "Hunting Psalm", text: "{{genealord}} broadcast an old house oath across {{signal}} and turned every patrol toward {{ronin}}. The words were ceremonial; the pursuit was not.", tags: ["oath", "signal", "pursuit"], intensity: "high" },
      { id: "catalyst_023", title: "Broken Evac", text: "{{route}} lost its extraction beacon while {{ally}} was still inside the pressure zone. {{ronin}} moved because command had no clean replacement.", tags: ["extraction", "ally", "route"], intensity: "critical" },
      { id: "catalyst_024", title: "Pack Wake", text: "{{mutant}} woke beneath the relay floor after {{signal}} spiked. {{genealord}} called it useful pressure; {{ronin}} called it time lost.", tags: ["mutant", "relay", "signal"], intensity: "high" },
      { id: "catalyst_025", title: "Debt Beacon Open", text: "{{ally}} lit a debt beacon that exposed {{route}} and saved thirty seconds. The Unseen Hand accepted the trade because thirty seconds can become a life.", tags: ["ally", "debt", "route"], intensity: "medium" },
      { id: "catalyst_026", title: "Ronin Accused", text: "{{enemy}} named {{ronin}} as the reason an old unit never returned. {{genealord}} converted the accusation into movement orders.", tags: ["enemy", "grudge", "orders"], intensity: "high" },
      { id: "catalyst_027", title: "Signal Court", text: "{{signal}} carried a tribunal code instead of a command phrase. {{genealord}} was not hunting {{ronin}} for strategy; he was delivering sentence.", tags: ["signal", "sentence", "genealord"], intensity: "critical" },
      { id: "catalyst_028", title: "False Extraction", text: "{{thirdForce}} sold a false extraction lane that looked clean until {{enemy}} moved on both ends. {{mission}} became survival before launch was complete.", tags: ["thirdForce", "extraction", "enemy"], intensity: "critical" },
      { id: "catalyst_029", title: "Wounded Route", text: "{{injury}} reports arrived from every marker on {{route}}. {{ronin}} entered the corridor because delay had become another form of loss.", tags: ["injury", "route", "loss"], intensity: "high" },
      { id: "catalyst_030", title: "House Ledger Awake", text: "{{genealord}} opened the house ledger and found {{ronin}} already written into it. The field shifted from pursuit to collection.", tags: ["family", "ledger", "collection"], intensity: "high" },
      { id: "catalyst_031", title: "Mutant Toll", text: "{{mutant}} blocked the clean exit and ignored every Genealord leash. {{route}} remained open only through worse ground.", tags: ["mutant", "route", "cost"], intensity: "high" },
      { id: "catalyst_032", title: "No Return Ping", text: "{{signal}} returned one ping from the extraction side and then went black. {{ronin}} moved forward because backward had stopped existing.", tags: ["signal", "extraction", "ronin"], intensity: "critical" },
      { id: "catalyst_033", title: "Ally Named Traitor", text: "{{ally}} was named traitor on a Genealord band before {{mission}} began. Helping {{ronin}} became rescue, evidence, and liability.", tags: ["ally", "traitor", "mission"], intensity: "high" },
      { id: "catalyst_034", title: "Bad Ronin Contact", text: "{{enemy}} entered the grid with Ronin timing and no Ronin restraint. {{ronin}} recognized the corruption before command did.", tags: ["badRonin", "enemy", "grid"], intensity: "high" },
      { id: "catalyst_035", title: "Buried Oath", text: "A buried oath surfaced inside {{signal}} and named {{cost}} before any asset moved. The Unseen Hand treated it as warning, not prophecy.", tags: ["oath", "signal", "cost"], intensity: "medium" },
      { id: "catalyst_036", title: "Family Road Closed", text: "{{genealord}} closed {{route}} under a family seal and dared {{ronin}} to violate it. The violation became the first operational fact.", tags: ["family", "route", "violation"], intensity: "medium" },
      { id: "catalyst_037", title: "Pressure Birth", text: "{{thirdForce}} struck the relay while {{mutant}} moved under it and {{enemy}} waited above it. {{mission}} began in three directions at once.", tags: ["thirdForce", "mutant", "enemy"], intensity: "critical" },
      { id: "catalyst_038", title: "Lost Child Route", text: "{{ally}} reported civilians trapped on a route command had already abandoned. {{ronin}} moved because abandoned does not mean empty.", tags: ["ally", "civilian", "route"], intensity: "high" },
      { id: "catalyst_039", title: "Signal Bloodline", text: "{{signal}} carried a bloodline phrase only {{genealord}} should know. {{ronin}} understood the hunt had roots deeper than the current field.", tags: ["signal", "family", "hunt"], intensity: "high" },
      { id: "catalyst_040", title: "Extraction Insult", text: "{{ronin}} tried to extract through ground {{genealord}} considered sacred to the house. The route remains open. The insult does not.", tags: ["extraction", "family", "route"], intensity: "critical" }
    ],
    rivalryTemplates: [
      { id: "rivalry_001", title: "Path Insult", text: "{{genealord}} considered {{ronin}} a stain on the path and made {{mission}} a public correction. The Unseen Hand kept the insult alive because insult creates movement.", tags: ["rivalry", "path", "mission"], intensity: "medium" },
      { id: "rivalry_002", title: "Old Hunt", text: "{{ronin}} escaped {{genealord}} once through {{route}} and left command humiliated. This time {{signal}} carried the sound of preparation.", tags: ["escape", "route", "hunt"], intensity: "high" },
      { id: "rivalry_003", title: "Unpaid Name", text: "{{genealord}} spoke {{ronin}}'s name like unpaid debt. Every order from {{enemy}} turned that debt into pressure.", tags: ["debt", "enemy", "pressure"], intensity: "medium" },
      { id: "rivalry_004", title: "House Challenge", text: "{{ronin}} crossed a boundary {{genealord}} treated as family property. {{mission}} became less about victory and more about correction.", tags: ["family", "boundary", "correction"], intensity: "high" },
      { id: "rivalry_005", title: "Signal Duel", text: "{{signal}} carried two command signatures at once. {{ronin}} used it to move, and {{genealord}} used it to promise consequence.", tags: ["signal", "duel", "consequence"], intensity: "medium" },
      { id: "rivalry_006", title: "Broken Salute", text: "{{ronin}} refused the old salute before the last corridor war. {{genealord}} remembered and turned {{route}} into a proving ground.", tags: ["oath", "route", "rivalry"], intensity: "medium" },
      { id: "rivalry_007", title: "Private Sentence", text: "{{genealord}} did not order capture. The order was removal, and {{ronin}} understood the difference.", tags: ["capture", "removal", "rivalry"], intensity: "high" },
      { id: "rivalry_008", title: "Command Mirror", text: "{{ronin}} and {{genealord}} both read the field correctly. The problem was that only one could own {{route}}.", tags: ["command", "route", "contest"], intensity: "medium" },
      { id: "rivalry_009", title: "Debt of Blood", text: "{{genealord}} blamed {{ronin}} for a blood debt older than the current war. {{ally}} knew the story and stayed quiet until {{signal}} forced it open.", tags: ["family", "ally", "signal"], intensity: "high" },
      { id: "rivalry_010", title: "No Witnesses", text: "{{enemy}} was told to leave no witness who could explain how {{ronin}} survived. That order made the rivalry operational.", tags: ["enemy", "survival", "order"], intensity: "critical" },
      { id: "rivalry_011", title: "Stolen Route", text: "{{ronin}} took {{route}} from a Genealord map and lived long enough to use it. {{genealord}} never forgave theft that worked.", tags: ["route", "theft", "grudge"], intensity: "medium" },
      { id: "rivalry_012", title: "Cold Recognition", text: "{{genealord}} recognized {{ronin}} through static alone. The voice on {{signal}} went quiet, then became precise.", tags: ["recognition", "signal", "precision"], intensity: "medium" },
      { id: "rivalry_013", title: "Trial by Corridor", text: "{{genealord}} turned {{mission}} into a trial and {{route}} into the sentence. {{ronin}} kept moving because stillness was admission.", tags: ["trial", "route", "mission"], intensity: "high" },
      { id: "rivalry_014", title: "Rival Doctrine", text: "{{ronin}} believed routes could be saved. {{genealord}} believed routes existed to be owned, burned, or inherited.", tags: ["doctrine", "route", "rivalry"], intensity: "medium" },
      { id: "rivalry_015", title: "Hunted Proof", text: "{{ronin}} was proof that {{genealord}} could be evaded. Proof is dangerous when soldiers begin to believe it.", tags: ["proof", "hunt", "belief"], intensity: "high" },
      { id: "rivalry_016", title: "Name on Iron", text: "{{enemy}} carved {{ronin}}'s name into the pursuit order. {{genealord}} wanted every unit to know this was not routine.", tags: ["enemy", "order", "name"], intensity: "high" },
      { id: "rivalry_017", title: "Insulted Lineage", text: "{{ronin}} broke a line that {{genealord}} claimed could not bend. {{mutant}} pressure only made the insult louder.", tags: ["lineage", "mutant", "insult"], intensity: "critical" },
      { id: "rivalry_018", title: "Route Witness", text: "{{route}} remembered the last time {{ronin}} outran command. {{signal}} made that memory useful and dangerous.", tags: ["route", "memory", "signal"], intensity: "medium" },
      { id: "rivalry_019", title: "Mercy Contempt", text: "{{genealord}} hated {{ronin}} most for surviving with mercy intact. Command can plan for fear; mercy makes timing unreliable.", tags: ["mercy", "command", "rivalry"], intensity: "medium" },
      { id: "rivalry_020", title: "Final Claim", text: "{{genealord}} declared that {{ronin}} would end inside {{mission}}. The Unseen Hand did not answer the boast; it moved the pieces.", tags: ["boast", "mission", "unseenHand"], intensity: "critical" },
      { id: "rivalry_021", title: "Blood Route", text: "{{genealord}} believed {{route}} belonged to the dead of his house. {{ronin}} used it like a road, and that was enough to make the hunt permanent.", tags: ["family", "route", "hunt"], intensity: "high" },
      { id: "rivalry_022", title: "Last Salute Refused", text: "{{ronin}} once refused a surrender salute from {{genealord}} command. The refusal survived longer than the battle.", tags: ["oath", "genealord", "battle"], intensity: "medium" },
      { id: "rivalry_023", title: "Mercy File", text: "{{genealord}} kept a file on every mercy {{ronin}} had shown. He read mercy as pattern, weakness, and insult.", tags: ["mercy", "pattern", "insult"], intensity: "high" },
      { id: "rivalry_024", title: "Two Command Minds", text: "{{ronin}} and {{genealord}} both understood the board before the field admitted it. That made every correct choice personal.", tags: ["command", "rivalry", "field"], intensity: "medium" },
      { id: "rivalry_025", title: "Old Bridge Fire", text: "{{ronin}} survived the old bridge fire and {{genealord}} lost a brother to it. Neither fact makes the other simple.", tags: ["family", "survival", "bridge"], intensity: "high" },
      { id: "rivalry_026", title: "Signal Disrespect", text: "{{ronin}} cut into {{signal}} during a Genealord memorial cadence. {{genealord}} heard disrespect where command heard opportunity.", tags: ["signal", "memorial", "rivalry"], intensity: "high" },
      { id: "rivalry_027", title: "Doctrine Theft", text: "{{enemy}} copied Ronin doctrine and gave it to {{genealord}}. {{ronin}} now fights a corrupted reflection.", tags: ["badRonin", "doctrine", "genealord"], intensity: "critical" },
      { id: "rivalry_028", title: "House Map Scar", text: "{{route}} was marked on a Genealord family map with a scar line. {{ronin}} crossing it reopened the wound.", tags: ["family", "route", "scar"], intensity: "medium" },
      { id: "rivalry_029", title: "Witness Debt", text: "{{ally}} witnessed the first breach between {{ronin}} and {{genealord}}. Their memory makes the rivalry actionable intelligence.", tags: ["ally", "rivalry", "intelligence"], intensity: "medium" },
      { id: "rivalry_030", title: "Name Under Static", text: "{{signal}} distorted every word except {{ronin}}'s name. {{genealord}} repeated it once and moved the line forward.", tags: ["signal", "name", "advance"], intensity: "high" },
      { id: "rivalry_031", title: "No Clean Duel", text: "{{genealord}} wanted a duel and got an operation. {{ronin}} wanted a route and got a vendetta.", tags: ["duel", "operation", "route"], intensity: "medium" },
      { id: "rivalry_032", title: "Inherited Punishment", text: "{{genealord}} inherited the punishment order before inheriting command. {{ronin}} became both target and family obligation.", tags: ["family", "punishment", "target"], intensity: "critical" },
      { id: "rivalry_033", title: "Cold Respect", text: "{{genealord}} respected {{ronin}} enough to stop underestimating him. Respect sharpened the hunt instead of softening it.", tags: ["respect", "hunt", "genealord"], intensity: "medium" },
      { id: "rivalry_034", title: "Mutant Witnessed Escape", text: "{{mutant}} pressure covered {{ronin}}'s old escape and humiliated {{genealord}} command. The creature forgot; the house did not.", tags: ["mutant", "escape", "family"], intensity: "high" },
      { id: "rivalry_035", title: "Bitter Rescue", text: "{{ronin}} once rescued a Genealord asset and made the house owe him life. {{genealord}} hates debts that cannot be paid with punishment.", tags: ["rescue", "debt", "genealord"], intensity: "high" },
      { id: "rivalry_036", title: "Signal Challenge", text: "{{ronin}} used {{signal}} as a challenge, not a plea. {{genealord}} answered with units instead of words.", tags: ["signal", "challenge", "units"], intensity: "medium" },
      { id: "rivalry_037", title: "Ash Name", text: "{{ronin}}'s name was found in ash after a battle both sides claimed to win. {{genealord}} built a grudge from that uncertainty.", tags: ["battle", "ash", "grudge"], intensity: "high" },
      { id: "rivalry_038", title: "Third Force Mockery", text: "{{thirdForce}} mocked both {{ronin}} and {{genealord}} by selling their history back to them. Neither side forgave the accuracy.", tags: ["thirdForce", "history", "rivalry"], intensity: "medium" },
      { id: "rivalry_039", title: "Family Silence", text: "{{genealord}}'s house went silent when {{ronin}} entered {{route}}. Silence can be order, grief, or permission.", tags: ["family", "route", "silence"], intensity: "critical" },
      { id: "rivalry_040", title: "Unfinished Hunt", text: "{{ronin}} has survived too many endings to be treated as routine. {{genealord}} knows this. The next phase will demand more.", tags: ["hunt", "survival", "phase"], intensity: "critical" }
    ],
    grudgeTemplates: [
      { id: "grudge_001", title: "Old Debt Signal", text: "{{signal}} carried an old debt that {{ally}} had buried under field silence. {{ronin}} heard enough to know {{genealord}} would not let it close cleanly.", tags: ["debt", "ally", "signal"], intensity: "medium" },
      { id: "grudge_002", title: "Family Burn", text: "{{genealord}} kept a family account of every road {{ronin}} had crossed. {{route}} was circled in red before {{mission}} began.", tags: ["family", "route", "account"], intensity: "high" },
      { id: "grudge_003", title: "Oath Break", text: "{{ronin}} once swore to hold a gate and left it burning to save survivors. {{enemy}} still calls that choice betrayal.", tags: ["oath", "enemy", "survival"], intensity: "high" },
      { id: "grudge_004", title: "Bitter Relay", text: "{{ally}} opened a relay that had refused {{ronin}} for years. The line came alive because {{cost}} finally outweighed pride.", tags: ["ally", "relay", "cost"], intensity: "medium" },
      { id: "grudge_005", title: "Inheritance Claim", text: "{{genealord}} claimed {{route}} through inheritance and punishment. {{ronin}} treated the claim as noise and kept moving.", tags: ["inheritance", "route", "movement"], intensity: "medium" },
      { id: "grudge_006", title: "Dead Channel", text: "{{signal}} once failed a house unit under {{genealord}} command. Since then, every static burst has sounded like accusation.", tags: ["signal", "failure", "accusation"], intensity: "medium" },
      { id: "grudge_007", title: "Lost Brother Mark", text: "{{genealord}} marked {{ronin}} for a brother lost near {{route}}. The truth mattered less than the name attached to the loss.", tags: ["family", "loss", "route"], intensity: "high" },
      { id: "grudge_008", title: "Bad Ronin Debt", text: "{{enemy}} wore Ronin discipline without Ronin restraint. The old debt between them and {{ronin}} made the field colder.", tags: ["badRonin", "debt", "field"], intensity: "high" },
      { id: "grudge_009", title: "Unpaid Rescue", text: "{{ally}} owed {{ronin}} a rescue that command never recorded. {{mission}} gave the debt a route and a terrible hour.", tags: ["ally", "rescue", "mission"], intensity: "medium" },
      { id: "grudge_010", title: "Name Removed", text: "{{genealord}} removed {{ronin}} from every official list except the kill file. The insult was administrative and absolute.", tags: ["name", "killFile", "grudge"], intensity: "critical" },
      { id: "grudge_011", title: "Corridor Shame", text: "{{route}} was where {{genealord}} lost face in front of command. {{ronin}} walking it again made restraint impossible.", tags: ["route", "shame", "command"], intensity: "high" },
      { id: "grudge_012", title: "Silent Witness", text: "{{thirdForce}} witnessed an old failure and sold the memory to {{enemy}}. Now {{signal}} carries leverage instead of clarity.", tags: ["thirdForce", "enemy", "leverage"], intensity: "medium" },
      { id: "grudge_013", title: "Refused Execution", text: "{{ronin}} once refused to finish a wounded foe and created a future pursuer. {{genealord}} calls that mercy weakness; the field calls it consequence.", tags: ["mercy", "pursuer", "consequence"], intensity: "high" },
      { id: "grudge_014", title: "House Static", text: "{{signal}} clipped a Genealord house phrase through the interference. {{ronin}} knew the grudge had become command traffic.", tags: ["signal", "house", "traffic"], intensity: "medium" },
      { id: "grudge_015", title: "Cost Remembered", text: "{{cost}} was not forgotten by {{ally}} or forgiven by {{genealord}}. The Unseen Hand records both facts before movement begins.", tags: ["cost", "ally", "genealord"], intensity: "medium" },
      { id: "grudge_016", title: "Route Funeral", text: "{{route}} once carried the wounded out and the dead names back. {{genealord}} turned that memory into a weapon against {{ronin}}.", tags: ["route", "injury", "memory"], intensity: "high" },
      { id: "grudge_017", title: "Bloodless Verdict", text: "{{enemy}} delivered a verdict with no shouting and no hesitation. {{ronin}} was to disappear from {{mission}}, not simply lose it.", tags: ["enemy", "verdict", "mission"], intensity: "critical" },
      { id: "grudge_018", title: "Broken Ledger", text: "{{ally}} found the grudge ledger split between family debt and command need. Both columns pointed toward {{ronin}}.", tags: ["ally", "ledger", "family"], intensity: "medium" },
      { id: "grudge_019", title: "Unclean Pardon", text: "{{genealord}} offered pardon only if {{ronin}} abandoned {{route}} and named {{ally}}. It was not mercy; it was extraction of shame.", tags: ["pardon", "ally", "route"], intensity: "high" },
      { id: "grudge_020", title: "Last Account", text: "{{mission}} opened the last account between {{ronin}} and {{genealord}}. Nobody in the field believed it would balance cleanly.", tags: ["mission", "account", "grudge"], intensity: "critical" },
      { id: "grudge_021", title: "Unburied Order", text: "{{enemy}} recovered an old order naming {{ronin}} as deserter, asset, and threat. All three labels are dangerous when believed at once.", tags: ["enemy", "order", "ronin"], intensity: "high" },
      { id: "grudge_022", title: "Widow Route", text: "{{route}} is called the widow route inside {{genealord}} command. {{ronin}} using it again turns memory into pursuit.", tags: ["route", "family", "pursuit"], intensity: "high" },
      { id: "grudge_023", title: "Ally Debt Scar", text: "{{ally}} carries a debt scar from the last time {{ronin}} trusted command. The scar is old; the hesitation is current.", tags: ["ally", "debt", "command"], intensity: "medium" },
      { id: "grudge_024", title: "Mutant Blame", text: "{{genealord}} blames {{ronin}} for releasing {{mutant}} pressure during the old breach. Blame does not require accuracy to move units.", tags: ["mutant", "blame", "units"], intensity: "high" },
      { id: "grudge_025", title: "House Debt Broadcast", text: "{{signal}} carried a house debt broadcast with {{ronin}} embedded in the account. The field now knows the grudge has official weight.", tags: ["signal", "family", "debt"], intensity: "critical" },
      { id: "grudge_026", title: "Lost Extraction List", text: "{{ronin}} still keeps names from a failed extraction list. {{genealord}} keeps the same names for different reasons.", tags: ["extraction", "loss", "genealord"], intensity: "high" },
      { id: "grudge_027", title: "Third Force Receipt", text: "{{thirdForce}} produced a receipt for an old betrayal and sold copies to both sides. The document is ugly because it is useful.", tags: ["thirdForce", "betrayal", "record"], intensity: "medium" },
      { id: "grudge_028", title: "Punished Mercy", text: "{{enemy}} was spared once by {{ronin}} and punished for surviving. Now they return carrying gratitude turned inside out.", tags: ["enemy", "mercy", "return"], intensity: "high" },
      { id: "grudge_029", title: "Silent Anniversary", text: "{{mission}} opens on the anniversary of a corridor failure no one reports accurately. {{ally}} knows the date and avoids saying it.", tags: ["mission", "ally", "failure"], intensity: "medium" },
      { id: "grudge_030", title: "Old Blood Marker", text: "{{route}} carries an old blood marker that {{genealord}} treats as jurisdiction. {{ronin}} treats it as ground.", tags: ["route", "family", "jurisdiction"], intensity: "high" },
      { id: "grudge_031", title: "Command Orphaned", text: "{{ronin}} was orphaned from command after choosing survivors over orders. The grudge began where the paperwork ended.", tags: ["ronin", "survivors", "orders"], intensity: "high" },
      { id: "grudge_032", title: "Bad Ronin Ledger", text: "{{enemy}} keeps a Ronin ledger with names crossed out in black. {{ronin}} is not crossed out yet.", tags: ["badRonin", "ledger", "ronin"], intensity: "critical" },
      { id: "grudge_033", title: "Signal Funeral Tone", text: "{{signal}} returned a funeral tone from an old battlefield. {{genealord}} heard duty; {{ronin}} heard warning.", tags: ["signal", "battlefield", "warning"], intensity: "medium" },
      { id: "grudge_034", title: "Ally Accusation", text: "{{ally}} accused {{ronin}} of surviving too often at other people's expense. The accusation hurts because command has asked the same question.", tags: ["ally", "survival", "cost"], intensity: "high" },
      { id: "grudge_035", title: "Family Seal Broken", text: "{{ronin}} broke a family seal to save an asset and exposed {{route}}. {{genealord}} remembers the broken seal better than the saved life.", tags: ["family", "asset", "route"], intensity: "high" },
      { id: "grudge_036", title: "Mutant Debt", text: "{{mutant}} pressure once killed the wrong unit while {{ronin}} escaped. {{genealord}} filed the loss under Ronin treachery.", tags: ["mutant", "loss", "treachery"], intensity: "high" },
      { id: "grudge_037", title: "Route Confession", text: "{{route}} holds a confession {{thirdForce}} has threatened to broadcast for years. The operation may force the truth into open air.", tags: ["route", "thirdForce", "truth"], intensity: "medium" },
      { id: "grudge_038", title: "Inheritance Wound", text: "{{genealord}} inherited a wound, a name, and an order to finish both. {{ronin}} is the name.", tags: ["family", "order", "genealord"], intensity: "critical" },
      { id: "grudge_039", title: "Abandoned Gate Names", text: "The abandoned gate still lists names command could not recover. {{ronin}} reads them before entering {{route}}.", tags: ["loss", "route", "names"], intensity: "high" },
      { id: "grudge_040", title: "Last Debt Standing", text: "{{cost}} has followed {{ronin}} into every field since the first breach. The route remains open. The debt does not.", tags: ["cost", "debt", "route"], intensity: "critical" }
    ],
    betrayalTemplates: [
      { id: "betrayal_001", title: "Relay Sold", text: "{{ally}} sold one relay coordinate to protect another. {{ronin}} survived the first consequence, but {{signal}} no longer trusted command.", tags: ["ally", "relay", "trust"], intensity: "high" },
      { id: "betrayal_002", title: "Bad Ronin Switch", text: "{{enemy}} answered in Ronin cadence and moved like a friend until the route narrowed. The betrayal became visible only after {{route}} lost its exits.", tags: ["badRonin", "route", "betrayal"], intensity: "critical" },
      { id: "betrayal_003", title: "False Safehouse", text: "{{thirdForce}} marked a safehouse that had already been sold to {{genealord}}. {{ronin}} entered with seconds to spare and no clean trust remaining.", tags: ["thirdForce", "safehouse", "trust"], intensity: "high" },
      { id: "betrayal_004", title: "Signal Knife", text: "{{signal}} carried friendly authentication and hostile timing. Somebody inside {{mission}} wanted {{ronin}} late.", tags: ["signal", "timing", "inside"], intensity: "medium" },
      { id: "betrayal_005", title: "Ally Silence", text: "{{ally}} withheld the last map correction because {{cost}} was attached to their own name. The route stayed open, but not clean.", tags: ["ally", "map", "cost"], intensity: "medium" },
      { id: "betrayal_006", title: "Command Leak", text: "{{enemy}} knew the extraction phrase before {{ronin}} said it. The leak did not stop {{mission}}; it made every step contested.", tags: ["enemy", "leak", "mission"], intensity: "high" },
      { id: "betrayal_007", title: "Gate Turn", text: "{{route}} was supposed to open under allied code. It turned under Genealord authority and left {{ronin}} exposed.", tags: ["route", "gate", "genealord"], intensity: "critical" },
      { id: "betrayal_008", title: "Debt Before Duty", text: "{{ally}} chose an old debt before present duty. The Unseen Hand did not punish the choice; it recorded the damage.", tags: ["ally", "debt", "damage"], intensity: "medium" },
      { id: "betrayal_009", title: "Mutant Bait", text: "{{thirdForce}} used {{mutant}} pressure to hide a sale of route data. {{ronin}} learned the price when the pack arrived early.", tags: ["thirdForce", "mutant", "route"], intensity: "high" },
      { id: "betrayal_010", title: "Clean Voice", text: "The cleanest voice on {{signal}} belonged to the traitor. {{genealord}} let it speak until {{ronin}} trusted the wrong silence.", tags: ["signal", "traitor", "silence"], intensity: "critical" },
      { id: "betrayal_011", title: "Reserve Gone", text: "The reserve unit promised to {{mission}} had been redirected before contact. {{ally}} knew why and would not say it on open channel.", tags: ["reserve", "ally", "mission"], intensity: "medium" },
      { id: "betrayal_012", title: "Price of Passage", text: "{{thirdForce}} demanded {{gain}} and paid for it with {{ronin}}'s location. The road opened and became dangerous at the same time.", tags: ["thirdForce", "gain", "location"], intensity: "high" },
      { id: "betrayal_013", title: "Dead Drop Lie", text: "{{enemy}} salted the dead drop with accurate facts and one fatal lie. {{route}} accepted the lie before command did.", tags: ["enemy", "deadDrop", "route"], intensity: "high" },
      { id: "betrayal_014", title: "Family Trade", text: "{{genealord}} traded a family secret for a live coordinate. The betrayal carried old blood and new precision.", tags: ["family", "coordinate", "precision"], intensity: "critical" },
      { id: "betrayal_015", title: "Ally Under Mark", text: "{{ally}} entered the field already marked by {{enemy}}. Helping {{ronin}} became both rescue and liability.", tags: ["ally", "enemy", "liability"], intensity: "medium" },
      { id: "betrayal_016", title: "Mission Edited", text: "Somebody edited {{mission}} after launch and removed the extraction condition. The Unseen Hand saw the gap before the field admitted it.", tags: ["mission", "edit", "extraction"], intensity: "high" },
      { id: "betrayal_017", title: "Sold Mercy", text: "{{ronin}} spared a runner who sold the mercy back to {{genealord}}. The act remained honorable and still became a weapon.", tags: ["mercy", "genealord", "weapon"], intensity: "high" },
      { id: "betrayal_018", title: "False Injury Call", text: "{{injury}} was broadcast as bait in {{ally}}'s voice. {{ronin}} answered because command cannot ignore a wounded name.", tags: ["injury", "ally", "bait"], intensity: "critical" },
      { id: "betrayal_019", title: "Route Auction", text: "{{route}} was auctioned to {{enemy}} and {{thirdForce}} at the same time. Both buyers arrived angry when the road kept moving.", tags: ["route", "auction", "thirdForce"], intensity: "high" },
      { id: "betrayal_020", title: "Final Betrayal Clock", text: "The betrayal did not explode; it counted down. When {{signal}} changed tone, {{ronin}} had one choice left before closure.", tags: ["clock", "signal", "closure"], intensity: "critical" },
      { id: "betrayal_021", title: "Ally Code Sold", text: "{{ally}}'s route code appeared inside {{enemy}} traffic three minutes after trust was granted. The betrayal is confirmed; the motive is still moving.", tags: ["ally", "enemy", "code"], intensity: "high" },
      { id: "betrayal_022", title: "Genealord Backdoor", text: "{{genealord}} did not break {{signal}}; he was given a door. Whoever opened it knew {{mission}} before launch.", tags: ["genealord", "signal", "mission"], intensity: "critical" },
      { id: "betrayal_023", title: "Bad Ronin Escort", text: "{{enemy}} offered escort under Ronin colors and led the column toward a sealed lane. The lie wore discipline well.", tags: ["badRonin", "escort", "route"], intensity: "high" },
      { id: "betrayal_024", title: "Third Force Invoice", text: "{{thirdForce}} sent an invoice before the trap closed. They charged for betrayal as if it were logistics.", tags: ["thirdForce", "trap", "logistics"], intensity: "medium" },
      { id: "betrayal_025", title: "False Injury Packet", text: "{{injury}} reports arrived with correct names and wrong coordinates. Command almost trusted the pain.", tags: ["injury", "coordinates", "command"], intensity: "high" },
      { id: "betrayal_026", title: "Route Key Duplicated", text: "{{route}} opened for {{ronin}} and {{enemy}} at the same time. Someone copied the key and kept the receipt.", tags: ["route", "enemy", "key"], intensity: "critical" },
      { id: "betrayal_027", title: "Family Pardon Trap", text: "{{genealord}} offered a family pardon through {{ally}}'s channel. The pardon required {{ronin}} to arrive unarmed.", tags: ["family", "ally", "trap"], intensity: "high" },
      { id: "betrayal_028", title: "Mutant Herd Sale", text: "{{thirdForce}} sold {{mutant}} movement as a natural event. It was directed pressure with a clean invoice.", tags: ["thirdForce", "mutant", "pressure"], intensity: "high" },
      { id: "betrayal_029", title: "Command Omission", text: "{{mission}} did not lie; it omitted the extraction failure. Omission is betrayal when soldiers walk into it.", tags: ["mission", "extraction", "command"], intensity: "critical" },
      { id: "betrayal_030", title: "Ally Blackmailed", text: "{{ally}} transmitted clean data with a hostage clause hidden in the pause. The route was true. The freedom was not.", tags: ["ally", "hostage", "route"], intensity: "high" },
      { id: "betrayal_031", title: "Signal Mask", text: "{{signal}} masked a hostile listener behind friendly authentication. The Unseen Hand caught the rhythm, not the name.", tags: ["signal", "listener", "authentication"], intensity: "medium" },
      { id: "betrayal_032", title: "Enemy Mercy Lie", text: "{{enemy}} promised mercy to draw {{ronin}} into the open. The promise was not emotional; it was geometry.", tags: ["enemy", "mercy", "geometry"], intensity: "high" },
      { id: "betrayal_033", title: "Sold Extraction Window", text: "The extraction window was sold before {{route}} opened. {{ronin}} can still move, but the buyer is already waiting.", tags: ["extraction", "route", "buyer"], intensity: "critical" },
      { id: "betrayal_034", title: "House Witness Turned", text: "A house witness turned for {{genealord}} and named {{ally}} as the weak point. The field became personal on both sides.", tags: ["family", "ally", "genealord"], intensity: "high" },
      { id: "betrayal_035", title: "Ronin Mark Copied", text: "{{enemy}} copied a Ronin mark and used it to redirect survivors. The betrayal will leave names in the BDA.", tags: ["badRonin", "survivors", "bda"], intensity: "critical" },
      { id: "betrayal_036", title: "Third Force Witness", text: "{{thirdForce}} witnessed the betrayal and waited to sell the timing. Information is most expensive when it is almost too late.", tags: ["thirdForce", "timing", "betrayal"], intensity: "medium" },
      { id: "betrayal_037", title: "Relay Authority Faked", text: "The relay accepted false authority and locked out {{ally}}. {{signal}} remained alive, but command no longer owned it.", tags: ["relay", "ally", "signal"], intensity: "high" },
      { id: "betrayal_038", title: "Genealord Mercy Price", text: "{{genealord}} priced mercy at {{loss}} and demanded payment in advance. No one in command called it mercy after that.", tags: ["genealord", "mercy", "loss"], intensity: "high" },
      { id: "betrayal_039", title: "Route Witness Removed", text: "The only witness to the sold route disappeared from {{signal}}. The disappearance is now the evidence.", tags: ["route", "signal", "evidence"], intensity: "medium" },
      { id: "betrayal_040", title: "Final Friendly Voice", text: "The final friendly voice asked {{ronin}} to slow down. The Unseen Hand marked the request hostile before the ambush arrived.", tags: ["ronin", "ambush", "voice"], intensity: "critical" }
    ],
    complicationTemplates: [
      { id: "complication_001", title: "Signal Split", text: "{{signal}} split into two convincing routes and only one carried life. The wrong choice would save time and lose {{ally}}.", tags: ["signal", "ally", "choice"], intensity: "high" },
      { id: "complication_002", title: "Route Collapse", text: "{{route}} lost its northern edge after enemy pressure hit the relay. {{ronin}} could still move, but only through exposed ground.", tags: ["route", "relay", "exposure"], intensity: "high" },
      { id: "complication_003", title: "Wounded Clock", text: "{{injury}} slowed the field and forced command to choose between speed and dignity. The Unseen Hand kept both costs visible.", tags: ["injury", "speed", "cost"], intensity: "medium" },
      { id: "complication_004", title: "Mutant Drift", text: "{{mutant}} drifted into the same corridor as {{mission}} without taking orders from anyone. Its pressure made every plan louder.", tags: ["mutant", "mission", "pressure"], intensity: "medium" },
      { id: "complication_005", title: "Ally Heat", text: "{{ally}} drew attention while trying to help {{ronin}}. Trust increased, and so did the number of guns looking for the relay.", tags: ["ally", "trust", "relay"], intensity: "medium" },
      { id: "complication_006", title: "False Weather", text: "{{enemy}} seeded false storm data across {{signal}}. The sky was clear, but every instrument began lying.", tags: ["enemy", "signal", "data"], intensity: "medium" },
      { id: "complication_007", title: "Third Force Toll", text: "{{thirdForce}} demanded a toll in information instead of money. Paying it opened {{route}} and armed a future problem.", tags: ["thirdForce", "route", "toll"], intensity: "high" },
      { id: "complication_008", title: "Command Double Bind", text: "{{mission}} required silence, but {{ally}} needed a broadcast to survive. The field offered no clean version of loyalty.", tags: ["mission", "ally", "loyalty"], intensity: "high" },
      { id: "complication_009", title: "Enemy Patience", text: "{{genealord}} stopped chasing and started waiting. That patience made {{route}} feel safer than it was.", tags: ["genealord", "route", "patience"], intensity: "medium" },
      { id: "complication_010", title: "Lost Civilian Thread", text: "A civilian thread crossed {{route}} and tangled with {{signal}}. Saving it would reveal movement; ignoring it would leave a debt.", tags: ["civilian", "route", "debt"], intensity: "high" },
      { id: "complication_011", title: "Relay Fever", text: "The relay overheated and turned every order into delayed fragments. {{ronin}} had to trust intent instead of timing.", tags: ["relay", "timing", "ronin"], intensity: "medium" },
      { id: "complication_012", title: "Bad Ronin Echo", text: "{{enemy}} copied Ronin movement doctrine and used it against {{ally}}. The counter felt familiar because it came from the same training scar.", tags: ["badRonin", "ally", "doctrine"], intensity: "high" },
      { id: "complication_013", title: "Fuel of Mercy", text: "{{gain}} arrived because {{ronin}} had spared someone earlier. The gift helped, and the witness became traceable.", tags: ["gain", "mercy", "trace"], intensity: "medium" },
      { id: "complication_014", title: "Closed Channel", text: "{{signal}} closed for seventeen seconds while {{genealord}} advanced. In that silence, every asset had to decide alone.", tags: ["signal", "genealord", "silence"], intensity: "critical" },
      { id: "complication_015", title: "Unstable Bargain", text: "{{thirdForce}} offered a shortcut through {{route}} and hid the price until entry. The shortcut was real, and so was the trap.", tags: ["thirdForce", "route", "trap"], intensity: "high" },
      { id: "complication_016", title: "Cost Ledger", text: "{{cost}} became visible before the mission was over. Command could still win, but no outcome would look clean in the ledger.", tags: ["cost", "command", "ledger"], intensity: "medium" },
      { id: "complication_017", title: "Static Witness", text: "{{signal}} recorded a voice that should have been dead. {{ally}} recognized it and lost one second too many.", tags: ["signal", "ally", "witness"], intensity: "high" },
      { id: "complication_018", title: "Mutant at the Door", text: "{{mutant}} reached the outer door before {{enemy}} did. That changed the order of danger without reducing it.", tags: ["mutant", "enemy", "danger"], intensity: "critical" },
      { id: "complication_019", title: "Route Without Cover", text: "{{route}} remained open but shed every piece of cover that made it usable. Movement became possible and punishable.", tags: ["route", "cover", "movement"], intensity: "high" },
      { id: "complication_020", title: "Mission Drift", text: "{{mission}} drifted from rescue to containment without a formal order. The Unseen Hand saw the change and kept the player responsible.", tags: ["mission", "containment", "responsibility"], intensity: "critical" },
      { id: "complication_021", title: "Extraction Clock Split", text: "Two extraction clocks appeared on {{signal}}, and neither matched command time. {{ronin}} can trust one, burn both, or move blind.", tags: ["extraction", "signal", "clock"], intensity: "high" },
      { id: "complication_022", title: "Ally Route Fever", text: "{{ally}} found a route that works only while the relay overheats. The window is real and punishes hesitation.", tags: ["ally", "route", "relay"], intensity: "medium" },
      { id: "complication_023", title: "Mutant Underpass", text: "{{mutant}} occupies the underpass beneath {{route}} and reacts to every transmission pulse. Silence helps movement and hurts command.", tags: ["mutant", "route", "silence"], intensity: "high" },
      { id: "complication_024", title: "Genealord Patience", text: "{{genealord}} stopped pursuit and let {{ronin}} choose the next mistake. Patient enemies make the field feel empty before it closes.", tags: ["genealord", "patience", "field"], intensity: "high" },
      { id: "complication_025", title: "Third Force Toll Gate", text: "{{thirdForce}} controls a toll gate inside {{route}} and wants information, not credits. The price will survive the phase.", tags: ["thirdForce", "route", "price"], intensity: "medium" },
      { id: "complication_026", title: "Bad Ronin Weather", text: "{{enemy}} seeded false weather from a Ronin transmitter. The storm is fabricated, but the wrong decision will still kill movement.", tags: ["badRonin", "weather", "movement"], intensity: "high" },
      { id: "complication_027", title: "Injury Broadcast Loop", text: "{{injury}} reports loop through {{signal}} until command cannot tell current pain from old bait. The loop demands a hard call.", tags: ["injury", "signal", "bait"], intensity: "high" },
      { id: "complication_028", title: "Lost South Road", text: "The south road vanished from the map and remained visible on ground cameras. {{route}} is contradicting itself.", tags: ["route", "map", "camera"], intensity: "medium" },
      { id: "complication_029", title: "Family Seal Delay", text: "{{genealord}} placed a family seal on the gate and forced legal command into tactical time. Bureaucracy became a weapon.", tags: ["family", "gate", "command"], intensity: "medium" },
      { id: "complication_030", title: "Ally Sacrifice Offer", text: "{{ally}} offered to stay behind and hold {{signal}} manually. The offer is useful because it is costly.", tags: ["ally", "signal", "sacrifice"], intensity: "critical" },
      { id: "complication_031", title: "Route Full of Names", text: "{{route}} filled with civilian names instead of coordinates. The road still exists, but every movement now has witnesses.", tags: ["route", "civilian", "witness"], intensity: "high" },
      { id: "complication_032", title: "Mutant Pack Learns", text: "{{mutant}} adjusted to the last lure and stopped chasing noise. The pack is hunting pattern now.", tags: ["mutant", "pack", "pattern"], intensity: "critical" },
      { id: "complication_033", title: "Enemy Reads Mercy", text: "{{enemy}} predicted {{ronin}} would answer a mercy call. Correct predictions are more dangerous than hatred.", tags: ["enemy", "mercy", "prediction"], intensity: "high" },
      { id: "complication_034", title: "Signal Cost Spike", text: "{{signal}} demanded more power for every command phrase. Communication remains possible at a visible price.", tags: ["signal", "cost", "command"], intensity: "medium" },
      { id: "complication_035", title: "Third Force Shelter", text: "{{thirdForce}} offered shelter that would protect {{ally}} and expose {{ronin}}. The shelter is not false; it is selective.", tags: ["thirdForce", "ally", "ronin"], intensity: "high" },
      { id: "complication_036", title: "Genealord Dead Zone", text: "{{genealord}} created a dead zone that removes {{enemy}} from view but not from the field. Invisible pressure is still pressure.", tags: ["genealord", "enemy", "pressure"], intensity: "high" },
      { id: "complication_037", title: "Debt Compartment", text: "{{ally}} hid a debt compartment in the mission file. Opening it may save {{route}} and damage trust.", tags: ["ally", "debt", "route"], intensity: "medium" },
      { id: "complication_038", title: "Extraction Door Jammed", text: "The extraction door jammed with {{ronin}} inside the timing window. Force opens it; patience may kill it.", tags: ["extraction", "ronin", "timing"], intensity: "critical" },
      { id: "complication_039", title: "Mission Cost Visible", text: "{{cost}} appeared on the board before the decision that caused it. The field is warning command, not excusing it.", tags: ["cost", "command", "field"], intensity: "high" },
      { id: "complication_040", title: "Signal May Not", text: "{{mission}} can still succeed if {{signal}} is spent like ammunition. The route remains open. The signal may not.", tags: ["mission", "signal", "route"], intensity: "critical" }
    ],
    allyIntroTemplates: [
      { id: "ally_intro_001", title: "Relay Courier", text: "{{ally}} entered {{signal}} with breathing clipped and coordinates intact. The voice did not ask for trust; it delivered value.", tags: ["ally", "signal", "coordinates"], intensity: "low" },
      { id: "ally_intro_002", title: "Debt Runner", text: "{{ally}} owed {{ronin}} a debt from a road nobody names anymore. Paying it now meant stepping into {{mission}} under fire.", tags: ["ally", "debt", "mission"], intensity: "medium" },
      { id: "ally_intro_003", title: "Southern Relay", text: "{{ally}} answered from a half-buried relay south of {{route}}. The signal was weak, but the map was real.", tags: ["ally", "relay", "route"], intensity: "low" },
      { id: "ally_intro_004", title: "Old Medic", text: "{{ally}} carried {{injury}} reports and the calm of someone who had seen worse. That calm gave {{ronin}} one more decision window.", tags: ["ally", "injury", "calm"], intensity: "medium" },
      { id: "ally_intro_005", title: "Command Orphan", text: "{{ally}} had no active command sponsor and no clean extraction clause. Helping {{ronin}} made them useful and vulnerable.", tags: ["ally", "command", "vulnerable"], intensity: "medium" },
      { id: "ally_intro_006", title: "Static Guide", text: "{{ally}} knew which static belonged to weather and which belonged to {{enemy}}. The distinction kept {{route}} alive.", tags: ["ally", "static", "enemy"], intensity: "low" },
      { id: "ally_intro_007", title: "Last Witness", text: "{{ally}} saw the first betrayal and survived long enough to speak. The testimony made {{mission}} heavier and more accurate.", tags: ["ally", "betrayal", "mission"], intensity: "medium" },
      { id: "ally_intro_008", title: "Ronin Adjacent", text: "{{ally}} moved like a Ronin but carried different scars. {{ronin}} recognized the discipline before trusting the voice.", tags: ["ally", "ronin", "trust"], intensity: "low" },
      { id: "ally_intro_009", title: "Gate Keeper", text: "{{ally}} controlled a rusted gate inside {{route}}. Opening it would help {{ronin}} and tell {{genealord}} the road mattered.", tags: ["ally", "gate", "genealord"], intensity: "medium" },
      { id: "ally_intro_010", title: "Broken Oath Ally", text: "{{ally}} once failed {{ronin}} and never defended the choice. This time the channel opened before pride could stop it.", tags: ["ally", "oath", "ronin"], intensity: "medium" },
      { id: "ally_intro_011", title: "Signal Nurse", text: "{{ally}} repaired {{signal}} with field tools and bad light. The work bought clarity, not safety.", tags: ["ally", "signal", "repair"], intensity: "low" },
      { id: "ally_intro_012", title: "Hidden Spotter", text: "{{ally}} watched {{enemy}} from a service tower with no exit route. The report was clean because fear had already been spent.", tags: ["ally", "enemy", "report"], intensity: "medium" },
      { id: "ally_intro_013", title: "Route Child", text: "{{ally}} grew up inside the routes command later abandoned. They knew where {{route}} lied and where it still told the truth.", tags: ["ally", "route", "truth"], intensity: "low" },
      { id: "ally_intro_014", title: "Wounded Voice", text: "{{ally}} transmitted through {{injury}} and refused evacuation until {{ronin}} moved. The voice stayed steady because panic had no use.", tags: ["ally", "injury", "evacuation"], intensity: "high" },
      { id: "ally_intro_015", title: "Cipher Keeper", text: "{{ally}} carried a cipher that made {{signal}} readable for three clean bursts. Every burst would also make the relay easier to find.", tags: ["ally", "cipher", "signal"], intensity: "medium" },
      { id: "ally_intro_016", title: "Hard Friend", text: "{{ally}} did not soften the report for {{ronin}}. The field needed truth more than comfort.", tags: ["ally", "truth", "ronin"], intensity: "low" },
      { id: "ally_intro_017", title: "Borrowed Armor", text: "{{ally}} arrived wearing armor that did not belong to them and carrying clearance that still worked. The mismatch was dangerous and useful.", tags: ["ally", "armor", "clearance"], intensity: "medium" },
      { id: "ally_intro_018", title: "Debt Beacon", text: "{{ally}} lit a beacon because the old debt finally outweighed survival instinct. {{genealord}} saw the light too.", tags: ["ally", "debt", "genealord"], intensity: "high" },
      { id: "ally_intro_019", title: "Quiet Specialist", text: "{{ally}} entered without ceremony and removed two false routes from the board. Competence changed the pressure faster than hope.", tags: ["ally", "route", "pressure"], intensity: "low" },
      { id: "ally_intro_020", title: "Last Open Door", text: "{{ally}} held the last open door inside {{route}} and asked for no promise. The Unseen Hand understood the cost before accepting it.", tags: ["ally", "route", "cost"], intensity: "critical" },
      { id: "ally_intro_021", title: "Cold Mapkeeper", text: "{{ally}} entered with a map corrected by loss, not optimism. The route data is ugly because it is current.", tags: ["ally", "map", "loss"], intensity: "medium" },
      { id: "ally_intro_022", title: "Oath Courier", text: "{{ally}} carried a broken oath and a working transmitter. Command can use one without forgiving the other.", tags: ["ally", "oath", "transmitter"], intensity: "medium" },
      { id: "ally_intro_023", title: "Gate Medic", text: "{{ally}} held the gate clinic after {{injury}} reports exceeded capacity. Their first transmission was triage, not fear.", tags: ["ally", "injury", "gate"], intensity: "high" },
      { id: "ally_intro_024", title: "Ronin Shadow", text: "{{ally}} moved half a step behind Ronin doctrine and never claimed the name. That restraint made them credible.", tags: ["ally", "ronin", "doctrine"], intensity: "low" },
      { id: "ally_intro_025", title: "Debt with Coordinates", text: "{{ally}} repaid an old debt with coordinates to {{route}}. The gift is clean; the history is not.", tags: ["ally", "debt", "route"], intensity: "medium" },
      { id: "ally_intro_026", title: "Relay Widow", text: "{{ally}} lost family on the relay line and still returned to repair {{signal}}. Discipline is sometimes grief with a tool kit.", tags: ["ally", "family", "signal"], intensity: "high" },
      { id: "ally_intro_027", title: "Signal Auditor", text: "{{ally}} audited {{signal}} and removed three false voices from the channel. The fourth voice remained unidentified.", tags: ["ally", "signal", "audit"], intensity: "medium" },
      { id: "ally_intro_028", title: "Extraction Driver", text: "{{ally}} controlled an extraction vehicle with one bad axle and enough nerve to matter. {{ronin}} has seen worse odds move people.", tags: ["ally", "extraction", "ronin"], intensity: "medium" },
      { id: "ally_intro_029", title: "Witness Under Fire", text: "{{ally}} witnessed {{enemy}} break the route seal and stayed alive long enough to report it. That report changes the board.", tags: ["ally", "enemy", "report"], intensity: "high" },
      { id: "ally_intro_030", title: "Third Force Defector", text: "{{ally}} defected from {{thirdForce}} with route knowledge and enemies behind them. The information is useful because it is hunted.", tags: ["ally", "thirdForce", "route"], intensity: "high" },
      { id: "ally_intro_031", title: "Quiet Survivor", text: "{{ally}} survived the first sweep by refusing to transmit. When they finally spoke, every word was operational.", tags: ["ally", "survivor", "transmit"], intensity: "low" },
      { id: "ally_intro_032", title: "Broken Badge", text: "{{ally}} arrived with a broken badge from a unit command abandoned. The badge still opened one door inside {{route}}.", tags: ["ally", "command", "route"], intensity: "medium" },
      { id: "ally_intro_033", title: "Manual Signal Hold", text: "{{ally}} can hold {{signal}} open by hand for one phase. Nobody says what happens to the hand after that.", tags: ["ally", "signal", "cost"], intensity: "critical" },
      { id: "ally_intro_034", title: "Family Informant", text: "{{ally}} knows a Genealord family phrase and refuses to explain why. The phrase may open the next lock.", tags: ["ally", "family", "lock"], intensity: "medium" },
      { id: "ally_intro_035", title: "Wounded Navigator", text: "{{ally}} navigates through {{injury}} and bad light with no dramatic language. Competence is the morale event.", tags: ["ally", "injury", "navigation"], intensity: "high" },
      { id: "ally_intro_036", title: "Ronin Ledger Keeper", text: "{{ally}} keeps the Ronin ledger of saved names and unpaid losses. {{mission}} will add to one column.", tags: ["ally", "ronin", "ledger"], intensity: "medium" },
      { id: "ally_intro_037", title: "Last Signal Clerk", text: "{{ally}} is the last clerk who knows the old signal routing tables. That knowledge is now front-line material.", tags: ["ally", "signal", "routing"], intensity: "low" },
      { id: "ally_intro_038", title: "Mutant Trail Reader", text: "{{ally}} reads {{mutant}} movement from damaged ground and missing static. The skill keeps {{route}} from lying.", tags: ["ally", "mutant", "route"], intensity: "medium" },
      { id: "ally_intro_039", title: "Ally at Cost", text: "{{ally}} offers help that will cost them cover, clearance, and future safety. The asset survived. The operation did not get cleaner.", tags: ["ally", "cost", "cover"], intensity: "high" },
      { id: "ally_intro_040", title: "Open Door Casualty", text: "{{ally}} holds the door and reports they can hear {{enemy}} on the stairs. The route remains open. The ally may not.", tags: ["ally", "enemy", "route"], intensity: "critical" }
    ],
    enemyIntroTemplates: [
      { id: "enemy_intro_001", title: "Genealord Advance", text: "{{genealord}} entered the field without haste and with full pressure authority. The calm was not mercy; it was confidence.", tags: ["genealord", "pressure", "calm"], intensity: "medium" },
      { id: "enemy_intro_002", title: "Bad Ronin Voice", text: "{{enemy}} spoke in Ronin discipline and moved with corrupted patience. {{ronin}} knew the type before the trap finished forming.", tags: ["enemy", "badRonin", "trap"], intensity: "high" },
      { id: "enemy_intro_003", title: "Hunter Cell", text: "{{enemy}} split into hunter cells and began testing {{route}} for fear response. The Unseen Hand marked the pattern.", tags: ["enemy", "route", "pattern"], intensity: "medium" },
      { id: "enemy_intro_004", title: "House Enforcer", text: "{{genealord}} sent an enforcer who treated family insult as command law. Every step toward {{ronin}} carried inherited anger.", tags: ["genealord", "family", "ronin"], intensity: "high" },
      { id: "enemy_intro_005", title: "Silent Pursuer", text: "{{enemy}} did not broadcast threat language. It only removed exits from {{route}} one by one.", tags: ["enemy", "route", "exits"], intensity: "high" },
      { id: "enemy_intro_006", title: "Signal Reader", text: "{{enemy}} read {{signal}} well enough to predict the first false move. That competence made the field smaller.", tags: ["enemy", "signal", "prediction"], intensity: "medium" },
      { id: "enemy_intro_007", title: "Punishment Officer", text: "{{genealord}} assigned punishment authority before capture authority. The order told {{ronin}} what kind of ending command wanted.", tags: ["genealord", "punishment", "capture"], intensity: "critical" },
      { id: "enemy_intro_008", title: "Route Denial Team", text: "{{enemy}} arrived with route denial charges and no interest in occupation. They planned to destroy {{route}} after forcing {{ronin}} inside.", tags: ["enemy", "route", "denial"], intensity: "high" },
      { id: "enemy_intro_009", title: "Debt Collector", text: "{{genealord}} called the unit a collector, not a patrol. The debt was old, personal, and now operational.", tags: ["genealord", "debt", "patrol"], intensity: "medium" },
      { id: "enemy_intro_010", title: "Relay Interrogator", text: "{{enemy}} touched the relay gently and extracted violent information. {{ally}} heard the process through {{signal}} and went quiet.", tags: ["enemy", "relay", "ally"], intensity: "high" },
      { id: "enemy_intro_011", title: "Cold Battalion", text: "{{enemy}} advanced without music, banners, or visible anger. Command units that calm are built for ugly work.", tags: ["enemy", "command", "advance"], intensity: "medium" },
      { id: "enemy_intro_012", title: "False Friendly", text: "{{enemy}} entered {{signal}} with friendly cadence and one wrong word. {{ronin}} caught the word; the trap still cost time.", tags: ["enemy", "signal", "trap"], intensity: "high" },
      { id: "enemy_intro_013", title: "Genealord Claimant", text: "{{genealord}} claimed {{mission}} as correction for a previous humiliation. The field became personal by order.", tags: ["genealord", "mission", "humiliation"], intensity: "medium" },
      { id: "enemy_intro_014", title: "North Edge Watch", text: "{{enemy}} took the north edge of {{route}} and waited for movement. Patience became the first weapon.", tags: ["enemy", "route", "patience"], intensity: "medium" },
      { id: "enemy_intro_015", title: "Ash Unit", text: "{{enemy}} came through burned ground and left no fresh signal behind. The absence told the Unseen Hand they were trained for denial.", tags: ["enemy", "signal", "denial"], intensity: "high" },
      { id: "enemy_intro_016", title: "Oath Breaker", text: "{{enemy}} had once worn allied code and broken it under pressure. Their return made {{ally}} angry enough to become useful.", tags: ["enemy", "ally", "oath"], intensity: "medium" },
      { id: "enemy_intro_017", title: "Red Ledger Command", text: "{{genealord}} opened the red ledger and moved {{ronin}} from target to obligation. Obligation does not tire quickly.", tags: ["genealord", "ledger", "target"], intensity: "high" },
      { id: "enemy_intro_018", title: "Corridor Butcher", text: "{{enemy}} specialized in closing corridors without caring who remained inside. {{route}} became a trap under professional hands.", tags: ["enemy", "route", "trap"], intensity: "critical" },
      { id: "enemy_intro_019", title: "Signal Harvester", text: "{{enemy}} harvested fragments of {{signal}} and built a pursuit model from the noise. Bad data became good enough to kill.", tags: ["enemy", "signal", "model"], intensity: "high" },
      { id: "enemy_intro_020", title: "Final Pressure Voice", text: "{{genealord}} finally spoke directly to {{ronin}}. The words were quiet, and every unit in the field moved after them.", tags: ["genealord", "ronin", "pressure"], intensity: "critical" },
      { id: "enemy_intro_021", title: "House Knife Unit", text: "{{enemy}} entered under a Genealord house seal and carried no capture gear. The intent was removal, not custody.", tags: ["enemy", "family", "removal"], intensity: "critical" },
      { id: "enemy_intro_022", title: "Bad Ronin Prosecutor", text: "{{enemy}} used Ronin field law to justify betrayal. Legal language made the ambush colder.", tags: ["badRonin", "law", "ambush"], intensity: "high" },
      { id: "enemy_intro_023", title: "Signal Lancer", text: "{{enemy}} attacked {{signal}} before attacking {{ronin}}. Good hunters blind the command hand first.", tags: ["enemy", "signal", "ronin"], intensity: "high" },
      { id: "enemy_intro_024", title: "Genealord Archivist", text: "{{genealord}} sent an archivist with weapons authorization. That means the house wants proof before punishment.", tags: ["genealord", "archive", "punishment"], intensity: "medium" },
      { id: "enemy_intro_025", title: "Route Accountant", text: "{{enemy}} counted exits on {{route}} and began removing them in order. The method is slow and professional.", tags: ["enemy", "route", "exits"], intensity: "high" },
      { id: "enemy_intro_026", title: "Mutant Handler Failed", text: "{{genealord}} sent a handler who had already lost control of {{mutant}} pressure. Failure arrived armed.", tags: ["genealord", "mutant", "failure"], intensity: "critical" },
      { id: "enemy_intro_027", title: "Oath Enforcer", text: "{{enemy}} enforces an oath {{ronin}} never accepted. That does not make the sentence less dangerous.", tags: ["enemy", "oath", "ronin"], intensity: "medium" },
      { id: "enemy_intro_028", title: "Extraction Hunter", text: "{{enemy}} specializes in killing exits, not assets. {{route}} is their target before {{ronin}} is.", tags: ["enemy", "extraction", "route"], intensity: "high" },
      { id: "enemy_intro_029", title: "Family Standard Bearer", text: "{{genealord}} raised a family standard inside the combat grid. Pride is now giving orders.", tags: ["genealord", "family", "orders"], intensity: "medium" },
      { id: "enemy_intro_030", title: "Cold Mercy Team", text: "{{enemy}} carries medical tags and execution authority in the same pouch. Mercy is a tool in their hands.", tags: ["enemy", "mercy", "authority"], intensity: "high" },
      { id: "enemy_intro_031", title: "Third Force Buyer", text: "{{thirdForce}} introduced {{enemy}} as a buyer, not a fighter. Purchased pressure is still pressure.", tags: ["thirdForce", "enemy", "buyer"], intensity: "medium" },
      { id: "enemy_intro_032", title: "Ronin Counterfeit", text: "{{enemy}} wears a Ronin mark one generation out of date. {{ronin}} sees the error and the threat at once.", tags: ["badRonin", "ronin", "mark"], intensity: "high" },
      { id: "enemy_intro_033", title: "Signal Surgeon", text: "{{enemy}} cut {{signal}} with surgical patience and left enough channel alive to mislead command. The wound looks like function.", tags: ["enemy", "signal", "command"], intensity: "critical" },
      { id: "enemy_intro_034", title: "Bridge Closure Cell", text: "{{enemy}} entered {{route}} to close one bridge and strand three futures. The target is movement itself.", tags: ["enemy", "route", "bridge"], intensity: "high" },
      { id: "enemy_intro_035", title: "Genealord Heir", text: "{{genealord}} sent an heir to witness {{ronin}} fail. Witnesses change battles into family memory.", tags: ["genealord", "family", "witness"], intensity: "high" },
      { id: "enemy_intro_036", title: "Ash Discipline", text: "{{enemy}} advanced through ash without breaking formation. Units like that are trained to continue after ugly news.", tags: ["enemy", "discipline", "advance"], intensity: "medium" },
      { id: "enemy_intro_037", title: "Debt Marshal", text: "{{genealord}} assigned a debt marshal to {{mission}}. The title is ceremonial until people start dying for it.", tags: ["genealord", "debt", "mission"], intensity: "high" },
      { id: "enemy_intro_038", title: "Lost Route Specialist", text: "{{enemy}} knows how to make a route disappear while soldiers are still standing on it. The board just became less honest.", tags: ["enemy", "route", "board"], intensity: "critical" },
      { id: "enemy_intro_039", title: "Quiet Kill Authority", text: "{{enemy}} received authority in a whisper and moved without morale theater. Quiet orders are often the worst ones.", tags: ["enemy", "authority", "orders"], intensity: "high" },
      { id: "enemy_intro_040", title: "Final House Line", text: "{{genealord}} placed the final house line across {{route}} and waited for {{ronin}} to cross it. The next phase will demand more.", tags: ["genealord", "family", "route"], intensity: "critical" }
    ],
    mutantEncounterTemplates: [
      { id: "mutant_encounter_001", title: "Outer Scratch", text: "{{mutant}} scratched at the edge of {{route}} and forced everyone to move sooner. It did not choose sides; it chose pressure.", tags: ["mutant", "route", "pressure"], intensity: "medium" },
      { id: "mutant_encounter_002", title: "Relay Bite", text: "{{mutant}} hit the relay hard enough to make {{signal}} stutter. The interruption bought concealment and cost control.", tags: ["mutant", "relay", "signal"], intensity: "high" },
      { id: "mutant_encounter_003", title: "Pack Logic", text: "{{mutant}} learned the bait pattern after the second false call. The next lure would need {{cost}} attached.", tags: ["mutant", "bait", "cost"], intensity: "high" },
      { id: "mutant_encounter_004", title: "Red Corridor", text: "{{route}} changed tone when {{mutant}} entered it. Instruments stayed functional, but nobody trusted their calm.", tags: ["mutant", "route", "instrument"], intensity: "medium" },
      { id: "mutant_encounter_005", title: "Unowned Violence", text: "{{mutant}} brought violence that {{genealord}} could not fully command. That made the battlefield less predictable and more honest.", tags: ["mutant", "genealord", "battlefield"], intensity: "high" },
      { id: "mutant_encounter_006", title: "Bone Signal", text: "{{signal}} carried a low sound when {{mutant}} moved near the tower. {{ally}} called it warning, not noise.", tags: ["mutant", "signal", "ally"], intensity: "medium" },
      { id: "mutant_encounter_007", title: "Door Pressure", text: "{{mutant}} reached the outer door before {{enemy}} formed a line. The order of danger changed, but the danger did not soften.", tags: ["mutant", "enemy", "door"], intensity: "critical" },
      { id: "mutant_encounter_008", title: "Hunger Vector", text: "{{mutant}} followed heat, sound, and old blood through {{route}}. {{ronin}} had to become quieter than fear.", tags: ["mutant", "route", "ronin"], intensity: "high" },
      { id: "mutant_encounter_009", title: "Field Animal", text: "{{mutant}} broke two enemy formations without becoming an ally. Useful does not mean safe.", tags: ["mutant", "enemy", "unsafe"], intensity: "medium" },
      { id: "mutant_encounter_010", title: "Pressure Choir", text: "More than one {{mutant}} answered {{signal}} and turned the channel into pressure. Command could still read it, but not comfortably.", tags: ["mutant", "signal", "command"], intensity: "critical" },
      { id: "mutant_encounter_011", title: "Scavenger Turn", text: "{{mutant}} fed on abandoned signal gear and followed the taste toward {{ally}}. The rescue route became a lure.", tags: ["mutant", "ally", "rescue"], intensity: "high" },
      { id: "mutant_encounter_012", title: "Blind Surge", text: "{{mutant}} surged through smoke and ignored both command flags. {{genealord}} lost control for one useful, dangerous minute.", tags: ["mutant", "genealord", "control"], intensity: "high" },
      { id: "mutant_encounter_013", title: "Quiet Mutation", text: "{{mutant}} did not roar or announce itself. It changed the ground under {{route}} and let the field discover it late.", tags: ["mutant", "route", "ground"], intensity: "medium" },
      { id: "mutant_encounter_014", title: "Signal Feeding", text: "{{mutant}} fed on the open channel and made {{signal}} expensive to use. Silence became safer and less useful.", tags: ["mutant", "signal", "silence"], intensity: "high" },
      { id: "mutant_encounter_015", title: "Wounded Pack", text: "{{injury}} made the pack slower and meaner. {{ronin}} could outrun it once, not forever.", tags: ["mutant", "injury", "ronin"], intensity: "medium" },
      { id: "mutant_encounter_016", title: "Third Force Herding", text: "{{thirdForce}} tried to herd {{mutant}} toward {{enemy}} and misjudged the pressure. The field punished cleverness immediately.", tags: ["thirdForce", "mutant", "enemy"], intensity: "high" },
      { id: "mutant_encounter_017", title: "Glass Teeth", text: "{{mutant}} shattered the outer relay glass and left {{signal}} sharp with feedback. Every command after that carried pain.", tags: ["mutant", "relay", "signal"], intensity: "critical" },
      { id: "mutant_encounter_018", title: "Route Infection", text: "{{route}} began returning bad echoes after {{mutant}} crossed it. The road stayed open, but it stopped being clean.", tags: ["mutant", "route", "echo"], intensity: "high" },
      { id: "mutant_encounter_019", title: "Pack at Mercy", text: "{{ronin}} could spare a wounded {{mutant}} or use it as bait. Either choice would be remembered by the field.", tags: ["mutant", "ronin", "mercy"], intensity: "medium" },
      { id: "mutant_encounter_020", title: "Final Breach Beast", text: "{{mutant}} reached the final breach with no loyalty and too much momentum. The Unseen Hand marked it as crisis, not obstacle.", tags: ["mutant", "breach", "crisis"], intensity: "critical" },
      { id: "mutant_encounter_021", title: "Pack Below Signal", text: "{{mutant}} moved below {{signal}} range and surfaced only when command committed. The pack understands timing now.", tags: ["mutant", "signal", "timing"], intensity: "high" },
      { id: "mutant_encounter_022", title: "Hunt Pattern Shift", text: "{{mutant}} stopped following heat and began following decisions. The route remains open, but the pack is learning the hand.", tags: ["mutant", "pattern", "route"], intensity: "critical" },
      { id: "mutant_encounter_023", title: "Genealord Leash Broken", text: "{{genealord}} tried to turn {{mutant}} pressure into a weapon and lost the leash. Useful danger became independent danger.", tags: ["genealord", "mutant", "leash"], intensity: "high" },
      { id: "mutant_encounter_024", title: "Ally Scent Mark", text: "{{mutant}} marked {{ally}} through residue on the relay floor. The next rescue will not be quiet.", tags: ["mutant", "ally", "relay"], intensity: "high" },
      { id: "mutant_encounter_025", title: "Underpass Teeth", text: "{{route}} reports movement under the concrete and pressure against the lower doors. {{mutant}} has found the underpass.", tags: ["route", "mutant", "underpass"], intensity: "high" },
      { id: "mutant_encounter_026", title: "Dead Static Feeding", text: "{{mutant}} fed on dead static and followed {{signal}} back toward command. The channel is now a scent trail.", tags: ["mutant", "signal", "command"], intensity: "critical" },
      { id: "mutant_encounter_027", title: "Pack Splinter", text: "The pack split, and only one half chased {{ronin}}. The other half found {{route}} without being invited.", tags: ["mutant", "ronin", "route"], intensity: "high" },
      { id: "mutant_encounter_028", title: "Old Wound Recognition", text: "{{mutant}} reacted to {{injury}} like memory, not hunger. The field has scars command did not brief.", tags: ["mutant", "injury", "memory"], intensity: "medium" },
      { id: "mutant_encounter_029", title: "Third Force Herd Failed", text: "{{thirdForce}} tried to herd {{mutant}} into {{enemy}} and created a wider breach. Cleverness has a casualty radius.", tags: ["thirdForce", "mutant", "enemy"], intensity: "critical" },
      { id: "mutant_encounter_030", title: "Signal Mimic", text: "{{mutant}} mimicked a damaged tone inside {{signal}} long enough to pull command attention. The imitation was crude and effective.", tags: ["mutant", "signal", "mimic"], intensity: "high" },
      { id: "mutant_encounter_031", title: "Route Bone Yard", text: "{{route}} crosses a bone yard the pack treats as territory. Movement is possible if command accepts the insult.", tags: ["mutant", "route", "territory"], intensity: "medium" },
      { id: "mutant_encounter_032", title: "Pressure Without Master", text: "{{mutant}} pressure arrived with no Genealord handler and no tactical objective. Random does not mean harmless.", tags: ["mutant", "pressure", "random"], intensity: "high" },
      { id: "mutant_encounter_033", title: "Pack at the Relay", text: "{{mutant}} reached the relay and listened before striking. That pause is the worst part of the report.", tags: ["mutant", "relay", "report"], intensity: "critical" },
      { id: "mutant_encounter_034", title: "Ally Bait Choice", text: "{{ally}} can bait {{mutant}} away from {{ronin}} and may not return before closure. The choice is useful because it is severe.", tags: ["ally", "mutant", "ronin"], intensity: "critical" },
      { id: "mutant_encounter_035", title: "Genealord Pack Tax", text: "{{genealord}} paid a pack tax in bodies and opened a temporary lane. The lane is bought, not safe.", tags: ["genealord", "mutant", "lane"], intensity: "high" },
      { id: "mutant_encounter_036", title: "Silent Claw Line", text: "{{signal}} lost all low tones as {{mutant}} crossed the claw line. Silence became the contact report.", tags: ["mutant", "signal", "silence"], intensity: "medium" },
      { id: "mutant_encounter_037", title: "Hunting Pack Ledger", text: "{{mutant}} pressure is now in the ledger as recurring, adaptive, and expensive. Command should stop treating it as weather.", tags: ["mutant", "ledger", "command"], intensity: "high" },
      { id: "mutant_encounter_038", title: "Third Force Carrion Deal", text: "{{thirdForce}} offered to redirect {{mutant}} for {{gain}} and no guarantee. The bargain smells like future loss.", tags: ["thirdForce", "mutant", "gain"], intensity: "high" },
      { id: "mutant_encounter_039", title: "Door Breath", text: "{{ronin}} reports breath against the final door and no body on camera. The pack is closer than evidence.", tags: ["ronin", "mutant", "door"], intensity: "critical" },
      { id: "mutant_encounter_040", title: "Pack Survived Contact", text: "{{mutant}} survived the contact and left with part of the pattern. The operation survived. So did the hunter.", tags: ["mutant", "pattern", "survival"], intensity: "critical" }
    ],
    unseenHandTransmissionTemplates: [
      { id: "unseen_hand_001", title: "Route Remains", text: "{{ronin}} survived. {{genealord}} committed more pressure. {{route}} remains open, but {{signal}} does not.", tags: ["survival", "route", "signal"], intensity: "medium" },
      { id: "unseen_hand_002", title: "Cost Accepted", text: "{{cost}} has been accepted into the operation. The Unseen Hand does not mourn during movement; it records and continues.", tags: ["cost", "movement", "record"], intensity: "medium" },
      { id: "unseen_hand_003", title: "Debt Visible", text: "{{ally}} has entered the chain. Trust is now useful, traceable, and vulnerable.", tags: ["ally", "trust", "trace"], intensity: "low" },
      { id: "unseen_hand_004", title: "Enemy Learning", text: "{{enemy}} learned from the last choice. The next phase will punish habit.", tags: ["enemy", "learning", "habit"], intensity: "medium" },
      { id: "unseen_hand_005", title: "Pressure Clarified", text: "{{genealord}} has revealed intent. That clarity is a weapon if the Unseen Hand keeps moving.", tags: ["genealord", "intent", "clarity"], intensity: "medium" },
      { id: "unseen_hand_006", title: "Signal Damaged", text: "{{signal}} is damaged but not gone. Command remains possible inside static.", tags: ["signal", "damage", "command"], intensity: "medium" },
      { id: "unseen_hand_007", title: "Mutant Redirected", text: "{{mutant}} moved away from the route for now. It was not defeated; it was redirected.", tags: ["mutant", "route", "redirect"], intensity: "medium" },
      { id: "unseen_hand_008", title: "Gain With Teeth", text: "{{gain}} has been secured. It arrives with teeth, and the field knows it.", tags: ["gain", "field", "cost"], intensity: "high" },
      { id: "unseen_hand_009", title: "Loss Recorded", text: "{{loss}} is recorded. The operation is smaller now, not finished.", tags: ["loss", "operation", "continue"], intensity: "medium" },
      { id: "unseen_hand_010", title: "Injury Managed", text: "{{injury}} has slowed the chain. The Unseen Hand will not confuse slower with broken.", tags: ["injury", "chain", "resolve"], intensity: "medium" },
      { id: "unseen_hand_011", title: "Route Paid", text: "{{route}} has been paid for in exposure. The road is open because something else is now visible.", tags: ["route", "exposure", "cost"], intensity: "high" },
      { id: "unseen_hand_012", title: "Third Force Marked", text: "{{thirdForce}} is no longer background pressure. It has entered the operation and will demand accounting.", tags: ["thirdForce", "accounting", "pressure"], intensity: "high" },
      { id: "unseen_hand_013", title: "Mission Narrowed", text: "{{mission}} has narrowed. That is not failure; it is the shape of consequence.", tags: ["mission", "consequence", "focus"], intensity: "medium" },
      { id: "unseen_hand_014", title: "Ally Preserved", text: "{{ally}} remains in the field. Their survival increases options and liabilities.", tags: ["ally", "survival", "liability"], intensity: "medium" },
      { id: "unseen_hand_015", title: "Enemy Denied", text: "{{enemy}} was denied a clean answer. Denial buys time, not peace.", tags: ["enemy", "time", "denial"], intensity: "low" },
      { id: "unseen_hand_016", title: "Ronin Moving", text: "{{ronin}} is still moving. That fact remains the center of the board.", tags: ["ronin", "movement", "board"], intensity: "medium" },
      { id: "unseen_hand_017", title: "Command Burden", text: "Command has chosen, and the burden has shifted forward. The next decision will not be lighter.", tags: ["command", "burden", "decision"], intensity: "high" },
      { id: "unseen_hand_018", title: "Clean Fear", text: "Fear is present and clean. The Unseen Hand will use it without obeying it.", tags: ["fear", "control", "unseenHand"], intensity: "medium" },
      { id: "unseen_hand_019", title: "Final Door", text: "The final door is visible. {{genealord}}, {{mutant}}, and {{enemy}} are all closer than they were.", tags: ["final", "genealord", "enemy"], intensity: "critical" },
      { id: "unseen_hand_020", title: "No Gentle Phase", text: "There is no gentle phase ahead. There is only the work, the cost, and the route that still answers.", tags: ["cost", "route", "work"], intensity: "critical" },
      { id: "unseen_hand_021", title: "Operational Continuity", text: "{{ronin}} remains operational. {{genealord}} remains committed. Continue before the field converts pressure into closure.", tags: ["ronin", "genealord", "continue"], intensity: "high" },
      { id: "unseen_hand_022", title: "Route Open Signal Uncertain", text: "{{route}} remains open. {{signal}} may not. Command should spend the next phase like ammunition.", tags: ["route", "signal", "command"], intensity: "critical" },
      { id: "unseen_hand_023", title: "Ally Cost Logged", text: "{{ally}} has paid part of the cost. The Unseen Hand records the payment and keeps the operation moving.", tags: ["ally", "cost", "operation"], intensity: "medium" },
      { id: "unseen_hand_024", title: "Enemy Adapting", text: "{{enemy}} is no longer reacting. It is adapting. The next directive must break pattern.", tags: ["enemy", "adaptation", "directive"], intensity: "high" },
      { id: "unseen_hand_025", title: "Mutant Pressure Active", text: "{{mutant}} remains in the field and is learning the noise. Do not mistake survival for resolution.", tags: ["mutant", "field", "survival"], intensity: "high" },
      { id: "unseen_hand_026", title: "Cost Is Named", text: "{{cost}} has a name now. Named costs travel farther than numbers.", tags: ["cost", "debrief", "loss"], intensity: "medium" },
      { id: "unseen_hand_027", title: "Command Burden Accepted", text: "The command burden is accepted. The field will not become kinder because the decision was necessary.", tags: ["command", "burden", "field"], intensity: "medium" },
      { id: "unseen_hand_028", title: "Third Force Interference Logged", text: "{{thirdForce}} is marked as active interference. Their help and harm now belong in the same report.", tags: ["thirdForce", "report", "interference"], intensity: "high" },
      { id: "unseen_hand_029", title: "Extraction Narrowed", text: "Extraction has narrowed to one viable lane. That lane can carry {{ronin}} or collapse under delay.", tags: ["extraction", "ronin", "delay"], intensity: "critical" },
      { id: "unseen_hand_030", title: "Signal Discipline", text: "{{signal}} is damaged but disciplined. Use it sparingly. Static is now a casualty risk.", tags: ["signal", "discipline", "risk"], intensity: "medium" },
      { id: "unseen_hand_031", title: "Gain Has Weight", text: "{{gain}} was secured under pressure and will not remain free. Advantage always sends a bill.", tags: ["gain", "pressure", "bill"], intensity: "medium" },
      { id: "unseen_hand_032", title: "Loss Has Direction", text: "{{loss}} is not behind you. It is moving forward with the chain and shaping the next phase.", tags: ["loss", "chain", "phase"], intensity: "high" },
      { id: "unseen_hand_033", title: "Genealord Pride Engaged", text: "{{genealord}} has shifted from tactical pursuit to personal correction. Pride will make him faster and less clean.", tags: ["genealord", "pride", "pursuit"], intensity: "high" },
      { id: "unseen_hand_034", title: "Bad Ronin Confirmed", text: "{{enemy}} has confirmed bad Ronin interference. Expect familiar doctrine without familiar restraint.", tags: ["badRonin", "enemy", "doctrine"], intensity: "high" },
      { id: "unseen_hand_035", title: "Civilian Thread Alive", text: "The civilian thread remains alive because command spent time. That time is now missing somewhere else.", tags: ["civilian", "time", "cost"], intensity: "medium" },
      { id: "unseen_hand_036", title: "Mission Not Clean", text: "{{mission}} is viable and unclean. Both facts are true. Proceed accordingly.", tags: ["mission", "viable", "cost"], intensity: "medium" },
      { id: "unseen_hand_037", title: "Injury Changes Tempo", text: "{{injury}} has changed tempo, not purpose. Slow movement can still be decisive.", tags: ["injury", "tempo", "purpose"], intensity: "medium" },
      { id: "unseen_hand_038", title: "Debt Enters BDA", text: "The debt has entered the BDA before the mission is over. That is not failure. That is evidence.", tags: ["debt", "bda", "evidence"], intensity: "high" },
      { id: "unseen_hand_039", title: "Final Pressure Approaches", text: "Final pressure is approaching. The asset survived this phase. The operation did not get easier.", tags: ["final", "asset", "pressure"], intensity: "critical" },
      { id: "unseen_hand_040", title: "Next Phase Demands More", text: "{{ronin}} remains operational. The next phase will demand more. The Unseen Hand will answer with decisions, not comfort.", tags: ["ronin", "phase", "decision"], intensity: "critical" }
    ],
    consequenceHookTemplates: [
      { id: "consequence_hook_001", title: "Pressure Rose", text: "{{enemy}} reacted fast, and pressure rose along {{route}}. The gain is real; the field will collect for it.", tags: ["enemy", "pressure", "route"], intensity: "medium" },
      { id: "consequence_hook_002", title: "Trust Improved", text: "{{ally}} trusted the command choice and moved closer to {{ronin}}. Trust improves options and creates hostage value.", tags: ["ally", "trust", "ronin"], intensity: "medium" },
      { id: "consequence_hook_003", title: "Signal Frayed", text: "{{signal}} frayed at the edge after the last directive. Communication still works, but certainty is leaking.", tags: ["signal", "certainty", "leak"], intensity: "medium" },
      { id: "consequence_hook_004", title: "Enemy Awareness", text: "{{genealord}} felt the Unseen Hand inside the pattern. Enemy awareness rose because the move worked.", tags: ["genealord", "awareness", "pattern"], intensity: "high" },
      { id: "consequence_hook_005", title: "Route Safer", text: "{{route}} became safer for one phase and more expensive for the next. The board has not forgiven the choice.", tags: ["route", "cost", "choice"], intensity: "medium" },
      { id: "consequence_hook_006", title: "Mutant Displaced", text: "{{mutant}} shifted away from {{ronin}} and toward an empty heat pocket. The displacement will not stay empty.", tags: ["mutant", "ronin", "displacement"], intensity: "medium" },
      { id: "consequence_hook_007", title: "Loss Deferred", text: "{{loss}} was deferred instead of erased. Deferred loss returns with interest.", tags: ["loss", "deferred", "cost"], intensity: "high" },
      { id: "consequence_hook_008", title: "Gain Exposed", text: "{{gain}} became visible to {{enemy}}. Advantage remains useful even when hunted.", tags: ["gain", "enemy", "advantage"], intensity: "medium" },
      { id: "consequence_hook_009", title: "Injury Slowed", text: "{{injury}} slowed the route and kept the mission human. The clock punished that humanity immediately.", tags: ["injury", "route", "clock"], intensity: "high" },
      { id: "consequence_hook_010", title: "Third Force Interested", text: "{{thirdForce}} noticed the shape of the operation and moved closer. Interest is not friendship.", tags: ["thirdForce", "operation", "risk"], intensity: "medium" },
      { id: "consequence_hook_011", title: "Command Cleaner", text: "The last choice made command cleaner and the field harsher. Clarity rarely arrives alone.", tags: ["command", "clarity", "field"], intensity: "medium" },
      { id: "consequence_hook_012", title: "Civilian Thread", text: "A civilian thread survived because {{ronin}} accepted delay. That delay will now appear on enemy clocks.", tags: ["civilian", "ronin", "delay"], intensity: "medium" },
      { id: "consequence_hook_013", title: "Bad Ronin Mark", text: "{{enemy}} marked the method and recognized Ronin doctrine. The next counter will feel personal.", tags: ["enemy", "ronin", "counter"], intensity: "high" },
      { id: "consequence_hook_014", title: "Relay Alive", text: "The relay remains alive, wounded, and locatable. It can help again if it survives being known.", tags: ["relay", "survival", "known"], intensity: "medium" },
      { id: "consequence_hook_015", title: "Mission Narrowed", text: "{{mission}} narrowed around the last decision. Fewer choices remain, and each carries more weight.", tags: ["mission", "decision", "weight"], intensity: "high" },
      { id: "consequence_hook_016", title: "Family Anger", text: "{{genealord}} treated the move as family insult, not battlefield adjustment. The response will be emotional and disciplined.", tags: ["genealord", "family", "response"], intensity: "high" },
      { id: "consequence_hook_017", title: "Route Open", text: "{{route}} is open because something else was sacrificed. The operation can continue without pretending the price was small.", tags: ["route", "sacrifice", "price"], intensity: "medium" },
      { id: "consequence_hook_018", title: "Signal Hidden", text: "{{signal}} hid the movement and damaged itself doing it. The quiet was purchased, not granted.", tags: ["signal", "movement", "damage"], intensity: "medium" },
      { id: "consequence_hook_019", title: "Enemy Split", text: "{{enemy}} split pursuit across two bad guesses. The split buys time and creates two future contacts.", tags: ["enemy", "pursuit", "time"], intensity: "medium" },
      { id: "consequence_hook_020", title: "Final Cost Near", text: "{{cost}} moved from possibility to proximity. The next phase will ask for a name.", tags: ["cost", "phase", "name"], intensity: "critical" },
      { id: "consequence_hook_021", title: "Route Open Signal Weak", text: "{{route}} remains open, but {{signal}} weakened under the decision. Command can continue; it cannot pretend the channel is whole.", tags: ["route", "signal", "command"], intensity: "high" },
      { id: "consequence_hook_022", title: "Asset Alive Operation Hurt", text: "The asset survived. The operation did not. Future orders will carry that imbalance.", tags: ["asset", "operation", "cost"], intensity: "critical" },
      { id: "consequence_hook_023", title: "Enemy Pattern Burned", text: "{{enemy}} lost the immediate exchange and gained part of the pattern. Victory has made the next contact smarter.", tags: ["enemy", "pattern", "victory"], intensity: "high" },
      { id: "consequence_hook_024", title: "Ally Trust Hardens", text: "{{ally}} trusted the order because it cost something. Cheap trust does not survive this field.", tags: ["ally", "trust", "cost"], intensity: "medium" },
      { id: "consequence_hook_025", title: "Mutant Learns Route", text: "{{mutant}} lost contact and learned {{route}}. The pack is no longer random pressure.", tags: ["mutant", "route", "pack"], intensity: "high" },
      { id: "consequence_hook_026", title: "Third Force Smiles", text: "{{thirdForce}} gained leverage without owning the fight. That is how third forces win phases.", tags: ["thirdForce", "leverage", "phase"], intensity: "medium" },
      { id: "consequence_hook_027", title: "Genealord Anger Disciplined", text: "{{genealord}} is angry and still disciplined. This is the dangerous version.", tags: ["genealord", "anger", "discipline"], intensity: "critical" },
      { id: "consequence_hook_028", title: "Signal Bought Silence", text: "{{signal}} bought silence by spending integrity. The quiet worked and left damage behind.", tags: ["signal", "silence", "damage"], intensity: "medium" },
      { id: "consequence_hook_029", title: "Debt Changes Owner", text: "{{cost}} changed owner after the last decision. Someone else now carries what command avoided.", tags: ["cost", "debt", "command"], intensity: "high" },
      { id: "consequence_hook_030", title: "Extraction Window Smaller", text: "The extraction window is smaller and more honest. It will not forgive delay.", tags: ["extraction", "window", "delay"], intensity: "high" },
      { id: "consequence_hook_031", title: "Bad Ronin Counter", text: "{{enemy}} recognized Ronin doctrine and prepared the corrupt counter. Familiar movement is now a liability.", tags: ["badRonin", "doctrine", "counter"], intensity: "high" },
      { id: "consequence_hook_032", title: "Loss Names Itself", text: "{{loss}} has named itself in the chain. The next report will not call it abstract.", tags: ["loss", "chain", "report"], intensity: "medium" },
      { id: "consequence_hook_033", title: "Gain Exposes Asset", text: "{{gain}} improved the board and exposed the asset holding it. Advantage now has a heartbeat.", tags: ["gain", "asset", "exposure"], intensity: "medium" },
      { id: "consequence_hook_034", title: "Family Feud Public", text: "{{genealord}}'s family feud is no longer private. Every unit can now use it or be used by it.", tags: ["family", "genealord", "unit"], intensity: "high" },
      { id: "consequence_hook_035", title: "Injury Alters Chain", text: "{{injury}} altered the chain without ending it. The field has slowed, not stopped.", tags: ["injury", "chain", "field"], intensity: "medium" },
      { id: "consequence_hook_036", title: "Route Paid Forward", text: "{{route}} stayed open because cost was paid forward. The bill will arrive in a later phase.", tags: ["route", "cost", "phase"], intensity: "high" },
      { id: "consequence_hook_037", title: "Command Keeps Moving", text: "Command keeps moving because stillness would waste the damage already taken. That is not comfort; it is arithmetic.", tags: ["command", "damage", "movement"], intensity: "medium" },
      { id: "consequence_hook_038", title: "Ally May Not", text: "{{ally}} kept the channel alive. The channel remains open. The ally may not.", tags: ["ally", "channel", "cost"], intensity: "critical" },
      { id: "consequence_hook_039", title: "Mission Narrows Again", text: "{{mission}} narrowed again and became more survivable by becoming less generous. The board is honest now.", tags: ["mission", "survival", "board"], intensity: "high" },
      { id: "consequence_hook_040", title: "Next Phase Demands More", text: "{{ronin}} remains operational. {{enemy}} remains informed. The next phase will demand more.", tags: ["ronin", "enemy", "phase"], intensity: "critical" }
    ],
    finalSacrificeTemplates: [
      { id: "final_sacrifice_001", title: "Relay Burn", text: "{{ronin}} burned the relay to keep {{route}} from becoming a map. {{signal}} died cleanly, and the mission lived with less light.", tags: ["relay", "route", "signal"], intensity: "critical" },
      { id: "final_sacrifice_002", title: "Ally Held", text: "{{ally}} held the breach long enough for {{ronin}} to move. The cost was not abstract; it had a voice.", tags: ["ally", "breach", "cost"], intensity: "critical" },
      { id: "final_sacrifice_003", title: "Enemy Locked", text: "{{ronin}} locked {{enemy}} inside the kill corridor and stayed too long to make it work. The route opened behind the sacrifice.", tags: ["ronin", "enemy", "route"], intensity: "critical" },
      { id: "final_sacrifice_004", title: "Signal Burial", text: "{{signal}} was buried under false traffic until it could not be recovered. The Unseen Hand accepted silence to preserve motion.", tags: ["signal", "silence", "motion"], intensity: "high" },
      { id: "final_sacrifice_005", title: "Mutant Draw", text: "{{ronin}} drew {{mutant}} away from the civilian route and into dead ground. Survival became possible for others first.", tags: ["ronin", "mutant", "civilian"], intensity: "critical" },
      { id: "final_sacrifice_006", title: "Genealord Delay", text: "{{ally}} challenged {{genealord}} directly and bought {{ronin}} a narrow exit. Nobody mistook the delay for safety.", tags: ["ally", "genealord", "exit"], intensity: "high" },
      { id: "final_sacrifice_007", title: "Route Sealed", text: "{{route}} was sealed after the last asset crossed. The seal saved the mission and ended return.", tags: ["route", "mission", "return"], intensity: "critical" },
      { id: "final_sacrifice_008", title: "Cost Named", text: "{{cost}} finally took a name and stopped being a number. The AAR will record it because command must remember.", tags: ["cost", "aar", "memory"], intensity: "critical" },
      { id: "final_sacrifice_009", title: "Injury Accepted", text: "{{injury}} was accepted instead of hidden. {{ronin}} kept moving slower, steadier, and more visible.", tags: ["injury", "ronin", "movement"], intensity: "high" },
      { id: "final_sacrifice_010", title: "Third Force Payment", text: "{{thirdForce}} demanded payment at the final door. The Unseen Hand paid with leverage and kept the bodies moving.", tags: ["thirdForce", "payment", "leverage"], intensity: "high" },
      { id: "final_sacrifice_011", title: "Ally Extraction Trade", text: "{{ally}} was extracted while {{gain}} was abandoned in the field. The mission chose a person over advantage.", tags: ["ally", "gain", "choice"], intensity: "high" },
      { id: "final_sacrifice_012", title: "Ronin Vanish", text: "{{ronin}} vanished from {{signal}} to draw pursuit away from {{route}}. The silence was tactical and terrible.", tags: ["ronin", "signal", "route"], intensity: "critical" },
      { id: "final_sacrifice_013", title: "Enemy Passed", text: "{{enemy}} was allowed to pass one checkpoint so civilians could clear another. The choice saved lives and armed the next danger.", tags: ["enemy", "civilian", "danger"], intensity: "high" },
      { id: "final_sacrifice_014", title: "Last Ammunition", text: "The last reserve was spent on cover, not victory. {{ronin}} survived because command chose protection over pride.", tags: ["reserve", "ronin", "protection"], intensity: "medium" },
      { id: "final_sacrifice_015", title: "BDA Shadow", text: "{{loss}} entered the BDA before the operation ended. Command continued because stopping would have wasted the loss.", tags: ["loss", "bda", "command"], intensity: "critical" },
      { id: "final_sacrifice_016", title: "Family Debt Paid", text: "{{ronin}} paid an old family debt by refusing the easy route. {{genealord}} understood and hated the restraint.", tags: ["family", "ronin", "genealord"], intensity: "high" },
      { id: "final_sacrifice_017", title: "Mutant Gate", text: "{{mutant}} was released into the enemy lane to save {{route}}. The decision worked and left no clean conscience.", tags: ["mutant", "enemy", "route"], intensity: "critical" },
      { id: "final_sacrifice_018", title: "No Go Mercy", text: "The Unseen Hand chose NO GO and preserved what remained. The sacrifice was ambition, and ambition does not forgive easily.", tags: ["noGo", "mercy", "ambition"], intensity: "high" },
      { id: "final_sacrifice_019", title: "Final Light", text: "{{signal}} stayed alive for one last transmission and then went dark. That was enough.", tags: ["signal", "transmission", "final"], intensity: "critical" },
      { id: "final_sacrifice_020", title: "Extraction Without Applause", text: "{{mission}} ended without applause and without a clean story. {{ronin}} lived, {{cost}} remained, and the Unseen Hand closed the file.", tags: ["mission", "ronin", "cost"], intensity: "medium" },
      { id: "final_sacrifice_021", title: "Signal Funeral", text: "{{signal}} was kept alive long enough to extract {{ronin}} and then buried under static. The mission succeeded. The channel did not.", tags: ["signal", "ronin", "extraction"], intensity: "critical" },
      { id: "final_sacrifice_022", title: "Ally Last Manual Hold", text: "{{ally}} held the relay manually while {{route}} cleared. The report calls it decisive; the BDA calls it unrecovered.", tags: ["ally", "relay", "bda"], intensity: "critical" },
      { id: "final_sacrifice_023", title: "Genealord Escapes Wounded", text: "{{ronin}} saved the asset and let {{genealord}} leave wounded but alive. Victory remains valid and unfinished.", tags: ["ronin", "genealord", "victory"], intensity: "high" },
      { id: "final_sacrifice_024", title: "Mutant Draw Final", text: "{{ronin}} drew {{mutant}} into dead ground so civilians could clear {{route}}. The route survived because the danger followed a name.", tags: ["ronin", "mutant", "route"], intensity: "critical" },
      { id: "final_sacrifice_025", title: "Third Force Payment Due", text: "{{thirdForce}} opened the final gate and claimed {{gain}} as payment. The operation moved forward with a future problem attached.", tags: ["thirdForce", "gain", "gate"], intensity: "high" },
      { id: "final_sacrifice_026", title: "Bad Ronin Sealed", text: "{{enemy}} was sealed inside the counter-route with the last clean exit. The seal saved {{mission}} and ended another road.", tags: ["badRonin", "route", "mission"], intensity: "critical" },
      { id: "final_sacrifice_027", title: "Family Debt Paid Forward", text: "{{ronin}} paid a family debt by refusing the fastest extraction. {{genealord}} lost the moment and gained the next grudge.", tags: ["family", "ronin", "genealord"], intensity: "high" },
      { id: "final_sacrifice_028", title: "Cost Chosen Openly", text: "{{cost}} was chosen in the open and recorded before execution. Command cannot call it accident afterward.", tags: ["cost", "command", "record"], intensity: "high" },
      { id: "final_sacrifice_029", title: "Route Burns Behind", text: "{{route}} burned behind the final asset and denied pursuit. Extraction succeeded by destroying the way home.", tags: ["route", "extraction", "pursuit"], intensity: "critical" },
      { id: "final_sacrifice_030", title: "Injury Kept Moving", text: "{{injury}} slowed {{ronin}} but did not stop the final cross. Survival entered the file with a limp.", tags: ["injury", "ronin", "survival"], intensity: "medium" },
      { id: "final_sacrifice_031", title: "Ally Over Advantage", text: "{{ally}} was saved and {{gain}} was abandoned. The operation chose a living voice over a clean advantage.", tags: ["ally", "gain", "choice"], intensity: "high" },
      { id: "final_sacrifice_032", title: "Enemy Net Broken", text: "{{signal}} was burned through the enemy net until {{enemy}} lost the trace. The net broke. So did the channel.", tags: ["signal", "enemy", "channel"], intensity: "critical" },
      { id: "final_sacrifice_033", title: "No Perfect Extraction", text: "{{mission}} extracted the asset and left {{loss}} on the board. This is success, not absolution.", tags: ["mission", "loss", "success"], intensity: "high" },
      { id: "final_sacrifice_034", title: "Ronin Holds Door", text: "{{ronin}} held the final door while {{ally}} crossed. Command gained the route and inherited the silence afterward.", tags: ["ronin", "ally", "silence"], intensity: "critical" },
      { id: "final_sacrifice_035", title: "Mutant Released Downrange", text: "{{mutant}} was released downrange to break {{genealord}} pressure. The tactic worked and will be hard to defend in the report.", tags: ["mutant", "genealord", "report"], intensity: "critical" },
      { id: "final_sacrifice_036", title: "Last Honest Order", text: "The last order named {{cost}} before asking anyone to pay it. Honesty did not make the sacrifice smaller.", tags: ["cost", "order", "sacrifice"], intensity: "high" },
      { id: "final_sacrifice_037", title: "Third Force Left Alive", text: "{{thirdForce}} was left alive to distract {{enemy}} and poison the next field. The operation survived with contamination.", tags: ["thirdForce", "enemy", "field"], intensity: "high" },
      { id: "final_sacrifice_038", title: "Signal Goes Dark Clean", text: "{{signal}} went dark cleanly after the final confirmation. Clean darkness is still darkness.", tags: ["signal", "final", "dark"], intensity: "medium" },
      { id: "final_sacrifice_039", title: "Asset Survived Operation Hurt", text: "The asset survived. The operation did not. The Unseen Hand records both and refuses to soften either.", tags: ["asset", "operation", "record"], intensity: "critical" },
      { id: "final_sacrifice_040", title: "Pyrrhic Route Home", text: "{{route}} carried the survivors home and left too much behind to call it clean. The Ronin remains operational. The next phase will demand more.", tags: ["route", "survivors", "pyrrhic"], intensity: "critical" }
    ],
    aarSummaryTemplates: [
      { id: "aar_summary_001", title: "Route Preserved", text: "{{mission}} preserved {{route}} at measurable cost. {{ronin}} survived, {{signal}} degraded, and {{genealord}} remains a future pressure source.", tags: ["aar", "route", "genealord"], intensity: "medium" },
      { id: "aar_summary_002", title: "Pyrrhic Readout", text: "Outcome: success with damage. {{gain}} was secured, {{loss}} was recorded, and command should expect retaliation.", tags: ["aar", "gain", "loss"], intensity: "high" },
      { id: "aar_summary_003", title: "Signal Lost", text: "{{signal}} failed before clean extraction. {{ronin}} moved under degraded command, and the BDA should treat every saved asset as costly.", tags: ["aar", "signal", "bda"], intensity: "critical" },
      { id: "aar_summary_004", title: "Enemy Delayed", text: "{{enemy}} was delayed but not broken. The delay enabled {{mission}} and left pursuit doctrine intact.", tags: ["aar", "enemy", "mission"], intensity: "medium" },
      { id: "aar_summary_005", title: "Ally Account", text: "{{ally}} materially changed the outcome. Their trust increased operational range and increased future liability.", tags: ["aar", "ally", "trust"], intensity: "medium" },
      { id: "aar_summary_006", title: "Mutant Pressure Filed", text: "{{mutant}} pressure altered route timing and forced unplanned expenditure. Treat the encounter as environmental command risk, not random interference.", tags: ["aar", "mutant", "risk"], intensity: "medium" },
      { id: "aar_summary_007", title: "Grudge Active", text: "{{genealord}} remains personally engaged. The grudge is now operational data and should be planned against.", tags: ["aar", "grudge", "genealord"], intensity: "high" },
      { id: "aar_summary_008", title: "Betrayal Confirmed", text: "Betrayal influenced the chain and exposed {{route}}. Counterintelligence review is required before the next operation.", tags: ["aar", "betrayal", "route"], intensity: "high" },
      { id: "aar_summary_009", title: "Cost Ledger Closed", text: "{{cost}} has been accepted and logged. The operation should proceed only if command can carry the debt forward.", tags: ["aar", "cost", "debt"], intensity: "medium" },
      { id: "aar_summary_010", title: "Injury Status", text: "{{injury}} reduced speed and increased visibility. The wound did not end {{mission}}, but it shaped every late decision.", tags: ["aar", "injury", "decision"], intensity: "medium" },
      { id: "aar_summary_011", title: "Third Force Review", text: "{{thirdForce}} entered the chain and created leverage outside command control. Future planning should assume interference with motive.", tags: ["aar", "thirdForce", "leverage"], intensity: "high" },
      { id: "aar_summary_012", title: "No Clean Victory", text: "{{mission}} produced advantage without innocence. The Unseen Hand records victory only after cost has been named.", tags: ["aar", "victory", "cost"], intensity: "high" },
      { id: "aar_summary_013", title: "Ronin Condition", text: "{{ronin}} remains viable but changed by the route. Survival should be treated as continuity, not reset.", tags: ["aar", "ronin", "survival"], intensity: "medium" },
      { id: "aar_summary_014", title: "Route Damage", text: "{{route}} remains usable with restrictions. Repair requires time, silence, and fewer enemies than currently available.", tags: ["aar", "route", "repair"], intensity: "medium" },
      { id: "aar_summary_015", title: "Enemy Awareness High", text: "{{enemy}} now understands part of the Unseen Hand pattern. Future choices should vary timing, signal, and mercy.", tags: ["aar", "enemy", "pattern"], intensity: "high" },
      { id: "aar_summary_016", title: "Gain Verified", text: "{{gain}} was verified under pressure and remains operationally useful. It should not be treated as free.", tags: ["aar", "gain", "pressure"], intensity: "low" },
      { id: "aar_summary_017", title: "Loss Verified", text: "{{loss}} was verified and cannot be recovered inside this operation. The file remains active because the route still answers.", tags: ["aar", "loss", "route"], intensity: "high" },
      { id: "aar_summary_018", title: "Command Recommendation", text: "Recommendation: proceed only with pressure acknowledged. {{genealord}}, {{mutant}}, and {{thirdForce}} all remain capable of shaping the next field.", tags: ["aar", "recommendation", "pressure"], intensity: "critical" },
      { id: "aar_summary_019", title: "No Go Debrief", text: "NO GO preserved remaining assets and ended immediate escalation. The cost is unresolved opportunity and a route that may not reopen.", tags: ["aar", "noGo", "route"], intensity: "medium" },
      { id: "aar_summary_020", title: "Final File", text: "{{mission}} closed with {{gain}}, {{loss}}, and {{cost}} all visible. The Unseen Hand has enough truth to move again.", tags: ["aar", "mission", "truth"], intensity: "critical" },
      { id: "aar_summary_021", title: "Pyrrhic Extraction", text: "{{mission}} achieved extraction with measurable degradation to {{signal}} and permanent pressure on {{route}}. Recommend success classification with cost attached.", tags: ["aar", "extraction", "cost"], intensity: "high" },
      { id: "aar_summary_022", title: "Ronin Operational", text: "{{ronin}} remains operational after final contact. Condition is not clean; readiness is sufficient.", tags: ["aar", "ronin", "readiness"], intensity: "medium" },
      { id: "aar_summary_023", title: "Genealord Not Finished", text: "{{genealord}} was delayed, damaged, or denied, not erased. Future operations should treat the rivalry as active.", tags: ["aar", "genealord", "rivalry"], intensity: "high" },
      { id: "aar_summary_024", title: "Signal Casualty", text: "{{signal}} should be listed as a mission casualty. It carried the operation and may not carry the next one.", tags: ["aar", "signal", "casualty"], intensity: "critical" },
      { id: "aar_summary_025", title: "Ally Cost Recorded", text: "{{ally}} materially affected mission survival. Any future tasking must account for trust gained and safety lost.", tags: ["aar", "ally", "trust"], intensity: "medium" },
      { id: "aar_summary_026", title: "Mutant Risk Recurring", text: "{{mutant}} pressure remains adaptive and unresolved. Classify future encounters as recurring threat, not environmental noise.", tags: ["aar", "mutant", "risk"], intensity: "high" },
      { id: "aar_summary_027", title: "Bad Ronin Interference", text: "{{enemy}} used familiar doctrine without lawful restraint. Counter-Ronin review is mandatory before the next field.", tags: ["aar", "badRonin", "review"], intensity: "high" },
      { id: "aar_summary_028", title: "Third Force Liability", text: "{{thirdForce}} created leverage outside command control. Any gain from them should be treated as contaminated until proven otherwise.", tags: ["aar", "thirdForce", "liability"], intensity: "medium" },
      { id: "aar_summary_029", title: "Route Damage Assessment", text: "{{route}} remains usable with damage, memory, and hostile interest attached. Movement is possible; secrecy is reduced.", tags: ["aar", "route", "damage"], intensity: "high" },
      { id: "aar_summary_030", title: "Cost Named in File", text: "{{cost}} is now named in the file and cannot be converted into generic loss. Command should carry it forward honestly.", tags: ["aar", "cost", "command"], intensity: "medium" },
      { id: "aar_summary_031", title: "Injury Affects Tempo", text: "{{injury}} affected tempo and exposed decision points. The wound is operational data, not background detail.", tags: ["aar", "injury", "tempo"], intensity: "medium" },
      { id: "aar_summary_032", title: "Mission Success No Absolution", text: "{{mission}} succeeded inside a damaged field. Success is recorded; absolution is not part of the report.", tags: ["aar", "mission", "success"], intensity: "high" },
      { id: "aar_summary_033", title: "Gain With Future Cost", text: "{{gain}} was secured and remains useful. It also increased future enemy attention and should not be labeled free advantage.", tags: ["aar", "gain", "enemy"], intensity: "medium" },
      { id: "aar_summary_034", title: "Loss Shapes Next Phase", text: "{{loss}} will shape the next phase more than the victory language suggests. Build the next command packet around that fact.", tags: ["aar", "loss", "phase"], intensity: "high" },
      { id: "aar_summary_035", title: "Enemy Awareness Elevated", text: "{{enemy}} awareness is elevated after contact. Vary signal timing, route logic, and mercy response.", tags: ["aar", "enemy", "awareness"], intensity: "high" },
      { id: "aar_summary_036", title: "Family Grudge Active", text: "{{genealord}}'s family grudge remains active and operationally relevant. Treat emotion as structured pressure.", tags: ["aar", "family", "pressure"], intensity: "high" },
      { id: "aar_summary_037", title: "Extraction Route Spent", text: "{{route}} carried survivors and lost concealment. The route remains open in memory, not necessarily in field condition.", tags: ["aar", "route", "survivors"], intensity: "critical" },
      { id: "aar_summary_038", title: "Command Dilemma Closed", text: "The command dilemma closed with action, not cleanliness. The decision was necessary and still costly.", tags: ["aar", "command", "dilemma"], intensity: "medium" },
      { id: "aar_summary_039", title: "Operation Did Not Reset", text: "{{mission}} ended, but the board did not reset. {{ronin}}, {{genealord}}, and {{thirdForce}} all carry memory forward.", tags: ["aar", "memory", "board"], intensity: "critical" },
      { id: "aar_summary_040", title: "Debrief Last Line", text: "Final note: {{gain}} survived, {{loss}} remains, and {{cost}} will brief the next operation before command does.", tags: ["aar", "final", "cost"], intensity: "critical" }
    ]
  };

  var operationAlphaRuntimePrefix = 'ooh_operation_alpha_';

  function removeOperationAlphaRuntimeKeys(storage) {
    var removed = [];
    var keys = [];
    var index;
    var key;

    if (!storage) {
      return removed;
    }

    try {
      for (index = 0; index < storage.length; index += 1) {
        key = storage.key(index);
        if (key && key.indexOf(operationAlphaRuntimePrefix) === 0) {
          keys.push(key);
        }
      }

      keys.forEach(function (runtimeKey) {
        storage.removeItem(runtimeKey);
        removed.push(runtimeKey);
      });
    }
    catch (error) {
      if (window.console && window.console.warn) {
        window.console.warn('[OA reset] storage reset failed', error);
      }
    }

    return removed;
  }

  function resetOperationAlphaRun() {
    var result = {
      localStorage: removeOperationAlphaRuntimeKeys(window.localStorage),
      sessionStorage: removeOperationAlphaRuntimeKeys(window.sessionStorage)
    };

    if (window.console && window.console.info) {
      window.console.info('[OA reset] runtime state cleared', result);
    }

    return result;
  }

  function bindOperationAlphaTryAgainReset() {
    if (!window.document || window.document.oohAlphaTryAgainResetBound) {
      return;
    }

    window.document.oohAlphaTryAgainResetBound = true;
    window.document.addEventListener('click', function (event) {
      var trigger;

      if (!event.target || !event.target.closest) {
        return;
      }

      trigger = event.target.closest('[data-ooh-alpha-try-again]');
      if (!trigger) {
        return;
      }

      resetOperationAlphaRun();
    }, true);
  }

  window.resetOperationAlphaRun = resetOperationAlphaRun;

  if (window.document && window.document.readyState === 'loading') {
    window.document.addEventListener('DOMContentLoaded', bindOperationAlphaTryAgainReset, { once: true });
  }
  else {
    bindOperationAlphaTryAgainReset();
  }
  window.OA_NARRATIVE_LIBRARY.validate = function () {
    var library = window.OA_NARRATIVE_LIBRARY;
    var allowedIntensity = ["low", "medium", "high", "critical"];
    var sectionNames = Object.keys(library).filter(function (key) {
      return Array.isArray(library[key]);
    });
    var idCounts = {};
    var duplicateIds = [];
    var invalidIntensity = [];
    var missingFields = [];
    var totalEntries = 0;

    sectionNames.forEach(function (sectionName) {
      library[sectionName].forEach(function (entry, index) {
        totalEntries += 1;
        if (!entry.id || !entry.title || !entry.text || !Array.isArray(entry.tags) || !entry.intensity) {
          missingFields.push(sectionName + "[" + index + "]");
        }
        if (entry.id) {
          idCounts[entry.id] = (idCounts[entry.id] || 0) + 1;
        }
        if (allowedIntensity.indexOf(entry.intensity) === -1) {
          invalidIntensity.push(entry.id || sectionName + "[" + index + "]");
        }
      });
    });

    Object.keys(idCounts).forEach(function (id) {
      if (idCounts[id] > 1) {
        duplicateIds.push(id);
      }
    });

    return {
      sectionCount: sectionNames.length,
      totalEntries: totalEntries,
      duplicateIds: duplicateIds,
      invalidIntensity: invalidIntensity,
      missingFields: missingFields
    };
  };
})(window);

