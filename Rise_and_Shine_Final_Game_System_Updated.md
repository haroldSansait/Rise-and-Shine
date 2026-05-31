# Rise and Shine Final Game System Document
## Educational Retro RPG Battle Game Concept

### 1. Game System Overview
Rise and Shine is a single-player retro RPG-style educational battle game where players answer questions to fight enemies, clear levels, and progress through academic-themed stages. The game focuses on simple but strategic battle mechanics using only Health and Damage stats. Playable characters provide different Health and Damage combinations, while Bytes serve as companion creatures with unique special skills. This keeps the character system easy to understand while giving the Byte system more strategic importance.

### 2. Core Statistics
* **Health:** Determines how much damage the player, Byte, or enemy can receive before being defeated.
* **Damage:** Determines how much damage the character, Byte, or enemy can deal during attacks.

*Removed stats:* Intelligence, Defense, Speed, and other advanced attributes are not included in this version. The system is intentionally simplified to only Health and Damage.

### 3. Playable Character System
Playable characters do not have special skills. Their role is to represent the player and provide different Health and Damage stat combinations. All special abilities come from Bytes.

| Character | Role Type | Health | Damage | Short Description |
|---|---|---|---|---|
| MJ | Balanced Hero | 110 | 18 | A reliable all-around character with balanced Health and Damage. Good for beginners. |
| Harold | Defensive Hero | 130 | 14 | A steady hero with higher Health, useful for surviving longer stages. |
| Bai | Damage Hero | 95 | 22 | A brave attacker with lower Health but stronger Damage. |
| Dale | Hybrid Fighter | 120 | 20 | A strong and dependable fighter with solid Health and strong Damage. |
| Paps | Tank Hero | 150 | 12 | The highest-Health main character, built for survival but lower Damage. |
| Bebz | Stable Hero | 115 | 16 | A safe and consistent character with reliable stats. |
| Matt | Power Attacker | 100 | 24 | The highest-Damage main character, but with lower Health. |
| JB | Survival Fighter | 140 | 15 | A durable hero with high Health and decent Damage for harder stages. |

### 4. Special Unlockable Character
A special character can be unlocked randomly after defeating a Stage Boss. This adds surprise and replay value to the progression system.

| Special Character | Unlock Method | Health | Damage | Description |
|---|---|---|---|---|
| Shine | Random chance after Stage Boss clear | 125 | 25 | A rare hidden character with strong overall stats. Shine represents growth after overcoming major challenges. |

| Boss Cleared | Unlock Chance |
|---|---|
| Prelim Boss | 15% chance |
| Midterm Boss | 25% chance |
| Prefinal Boss | 35% chance |
| Final Boss | Optional guaranteed unlock after game completion |

### 5. Final 10 Bytes
Bytes are digital companions that support the player during battle. Unlike playable characters, Bytes have special skills. Players can use Byte skills for offense, defense, healing, control, or enemy weakening.

| Byte | Role Type | Health | Damage | Special Skill | Skill Effect |
|---|---|---|---|---|---|
| Porturtle | Defensive Byte | 120 | 10 | Port Shield | Reduces incoming damage by 40% for one enemy attack. |
| RAMhorn | Power Byte | 95 | 20 | Memory Charge | Deals 2x Byte Damage to one enemy. |
| Bitbug | Sneaky Byte | 80 | 16 | Code Sting | Deals damage and lowers enemy Damage by 20% for one turn. |
| Voltbyte | Speed Attacker | 75 | 22 | Shock Strike | Deals damage and may weaken the enemy’s next attack. |
| Glitchip | Random Effect Byte | 85 | 18 | Error Pulse | Deals random damage between 15 and 35. |
| Firewisp | Fire Spirit Byte | 85 | 18 | Flame Flicker | Deals damage and burns the enemy for two turns. |
| Pinglet | Network Scout Byte | 70 | 15 | Ping Shot | Deals quick consistent damage and can reveal enemy weakness. |
| Keyfox | Security Byte | 90 | 17 | Key Strike | Deals damage and has a chance to lock the enemy’s next attack. |
| Lagoon | Healing Byte | 105 | 8 | Aqua Restore | Restores 25 Health to the player. |
| Datashade | Dark Data Byte | 88 | 19 | Shadow Packet | Deals damage and reduces the enemy’s next attack power. |

### 6. Byte Role Categories
| Role Category | Bytes | Purpose |
|---|---|---|
| Defensive | Porturtle | Helps the player survive by reducing incoming damage. |
| Offensive | RAMhorn, Voltbyte, Firewisp, Pinglet | Focuses on dealing direct or repeated damage. |
| Control / Debuff | Bitbug, Keyfox, Datashade | Weakens enemies or limits their attacks. |
| Healing | Lagoon | Restores player Health during battle. |
| Random / Glitch | Glitchip | Adds unpredictable bonus damage. |

### 7. Battle System
Rise and White uses a turn-based battle system. The player answers educational questions during battle. Correct answers allow the character and Byte to attack, while wrong answers allow the enemy to attack.

| Player Action | Battle Result |
|---|---|
| Correct Answer | Character and Byte perform normal attacks. |
| Wrong Answer | Enemy attacks the player. |
| Byte Skill Used | The selected Byte activates its unique special ability. |
| Enemy Defeated | The player clears the level. |
| Stage Boss Defeated | The stage is cleared, Health resets, and maximum Health increases. |

### 8. Damage Formula
The normal attack formula is simple:
`Total Normal Attack Damage = Character Damage + Byte Damage`

*Example:* MJ has 18 Damage and Pinglet has 15 Damage. If the player answers correctly, the total attack damage is `18 + 15 = 33` damage.

### 9. Byte Skill Charge System
To prevent Byte skills from being used too often, Byte special skills charge through correct answers.

| Skill Type | Charge Requirement |
|---|---|
| Normal Skill | 3 correct answers |
| Strong Attack Skill | 4 correct answers |
| Healing Skill | 4 correct answers |
| Random / Special Effect Skill | 4 correct answers |

### 10. Stage Progression
The game is divided into four fixed stages: Prelim, Midterm, Prefinal, and Final. Each stage contains 5 levels. Every stage has a Stage Boss, while the Final stage ends with the Final Boss.

| Stage | Number of Levels | Boss Type | Health Rule |
|---|---|---|---|
| Prelim | 5 Levels | Stage Boss | Health carries through all levels and resets after the boss. |
| Midterm | 5 Levels | Stage Boss | Health carries through all levels and resets after the boss. |
| Prefinal | 5 Levels | Stage Boss | Health carries through all levels and resets after the boss. |
| Final | 5 Levels | Final Boss | Health carries through all levels until the final battle. |

### 11. Health Carryover and Growth System
The player’s Health does not reset after clearing a normal level. Remaining Health carries over from Level 1 to Level 5 within the same stage. Health only resets after defeating the Stage Boss.

| Progression Point | Health Rule |
|---|---|
| After clearing a normal level | Health does not reset. Remaining Health carries over. |
| Before the Stage Boss | Player enters the boss fight with remaining Health. |
| After defeating the Stage Boss | Health resets to full. |

After every Stage Boss clear, maximum Health increases because the next stage becomes harder.

| Stage Cleared | Maximum Health Increase |
|---|---|
| After Prelim Boss | +20 Max Health |
| After Midterm Boss | +25 Max Health |
| After Prefinal Boss | +30 Max Health |

### 12. Example Health Progression
| Stage Point | Example Using MJ |
|---|---|
| Prelim Start | MJ starts with 110 Max Health. |
| After Prelim Boss | MJ Max Health becomes 130. |
| After Midterm Boss | MJ Max Health becomes 155. |
| After Prefinal Boss | MJ Max Health becomes 185. |

### 13. Enemy Difficulty Scaling
| Stage | Enemy Health Range | Enemy Damage Range | Difficulty |
|---|---|---|---|
| Prelim | 40–70 HP | 8–12 Damage | Easy |
| Midterm | 70–100 HP | 12–18 Damage | Moderate |
| Prefinal | 100–140 HP | 18–24 Damage | Hard |
| Final | 140–200 HP | 24–32 Damage | Very Hard |

### 14. Boss Difficulty Scaling
| Boss Stage | Boss Health | Boss Damage | Description |
|---|---|---|---|
| Prelim Boss | 160 HP | 16 Damage | First major test of basic understanding. |
| Midterm Boss | 230 HP | 22 Damage | Requires better survival and Byte skill use. |
| Prefinal Boss | 310 HP | 28 Damage | Tests consistency and strategy. |
| Final Boss | 420 HP | 36 Damage | Ultimate challenge and final learning test. |

### 15. Recommended Byte Unlock Progression
| Unlock Point | Byte Unlocked |
|---|---|
| Start of Game | Pinglet |
| Prelim Level 2 Clear | Bitbug |
| Prelim Boss Clear | Porturtle |
| Midterm Level 2 Clear | Voltbyte |
| Midterm Boss Clear | RAMhorn |
| Prefinal Level 2 Clear | Firewisp |
| Prefinal Boss Clear | Keyfox |
| Final Level 2 Clear | Lagoon |
| Final Level 4 Clear | Datashade |
| Special Unlock | Glitchip |

### 16. Example Gameplay Scenario
The player chooses MJ and uses Pinglet. MJ has 110 Health and 18 Damage. Pinglet has 70 Health and 15 Damage. The battle starts against a Prelim enemy with 60 HP. If the player answers correctly, MJ and Pinglet attack together. The total attack damage is `18 + 15 = 33`. The enemy’s remaining Health becomes `60 - 33 = 27` HP. If the player answers correctly again, the enemy is defeated. If the player answers incorrectly, the enemy attacks and MJ loses Health. MJ’s remaining Health carries over to the next level until the Stage Boss is defeated.

### 17. Presentation-Ready Summary
Rise and Shine uses a simple RPG battle system with only Health and Damage stats. Playable characters such as MJ, Harold, Bai, Dale, Paps, Bebz, Matt, and JB do not have special skills. Their role is to provide different stat combinations for different playstyles. The game’s strategy comes from the 10 main Bytes, each with unique special skills for attacking, defending, healing, weakening enemies, delaying attacks, or creating random effects. Health does not reset after normal levels and only resets after a Stage Boss clear. After each Stage Boss, maximum Health increases to match the rising difficulty of the next stage. A rare special character, Shine, can be randomly unlocked after clearing a Stage Boss, giving players an additional reward and motivation to continue progressing.

### 18. Detailed Level Enemy and Boss Stats Progression
This section lists the recommended Health and Damage values for each level enemy and stage boss. Enemy Damage is the amount of Health lost when the player answers incorrectly. These values follow the Health carryover rule, where player Health does not reset after normal level clears and only resets after defeating a Stage Boss.

#### 18.1 Stat Rules for Enemies and Bosses
* **Health:** How much damage an enemy or boss can take before being defeated.
* **Damage:** How much damage the enemy or boss deals when the player answers incorrectly.

#### 18.2 Prelim Stage Enemy Stats (Difficulty: Beginner)
| Level | Enemy Name | Health | Damage | Description |
|---|---|---|---|---|
| Prelim Level 1 | Bit Mite | 45 HP | 8 DMG | Very easy first enemy for introducing battle mechanics. |
| Prelim Level 2 | Cache Slime | 55 HP | 9 DMG | Slightly stronger enemy with basic memory-themed attacks. |
| Prelim Level 3 | Syntax Sprout | 65 HP | 10 DMG | Introduces longer battles through broken code and syntax errors. |
| Prelim Level 4 | File Phantom | 75 HP | 11 DMG | Tests early-game consistency with a corrupted file enemy. |
| Prelim Level 5 | Overclocked Prelim Professor | 160 HP | 16 DMG | First stage boss and first major test of basic understanding. |

#### 18.3 Midterm Stage Enemy Stats (Difficulty: Moderate)
| Level | Enemy Name | Health | Damage | Description |
|---|---|---|---|---|
| Midterm Level 1 | Loop Lurker | 80 HP | 13 DMG | Introduces stronger stage enemies with repeated attack patterns. |
| Midterm Level 2 | Array Ant | 95 HP | 14 DMG | Requires more correct answers and represents arrays and organized data. |
| Midterm Level 3 | Query Wraith | 110 HP | 16 DMG | Punishes wrong answers more heavily with database-themed attacks. |
| Midterm Level 4 | Router Gremlin | 125 HP | 17 DMG | Encourages careful answer selection through network confusion. |
| Midterm Level 5 | Overclocked Midterm Professor | 230 HP | 22 DMG | Stage boss that requires better survival and Byte skill timing. |

#### 18.4 Prefinal Stage Enemy Stats (Difficulty: Hard)
| Level | Enemy Name | Health | Damage | Description |
|---|---|---|---|---|
| Prefinal Level 1 | Requirement Shade | 120 HP | 19 DMG | Starts the hard-stage difficulty with unclear requirement-based attacks. |
| Prefinal Level 2 | Wireframe Wisp | 135 HP | 20 DMG | Requires stronger damage output and careful answers. |
| Prefinal Level 3 | Injection Imp | 150 HP | 22 DMG | High-pressure security-themed enemy with stronger attacks. |
| Prefinal Level 4 | Bug Golem | 165 HP | 23 DMG | Tests survival across the stage with heavy error-based attacks. |
| Prefinal Level 5 | Overclocked Prefinal Professor | 310 HP | 28 DMG | Difficult stage boss that tests consistency, remaining Health, and Byte strategy. |

#### 18.5 Final Stage Enemy Stats (Difficulty: Very Hard)
| Level | Enemy Name | Health | Damage | Description |
|---|---|---|---|---|
| Final Level 1 | Firewall Sentinel | 150 HP | 25 DMG | Begins the final challenge with strong cybersecurity defense. |
| Final Level 2 | Cloud Warden | 170 HP | 27 DMG | Strong cloud-themed enemy that punishes wrong answers. |
| Final Level 3 | Data Hydra | 190 HP | 29 DMG | Requires strong accuracy and Byte skill use. |
| Final Level 4 | System Overlord | 215 HP | 31 DMG | One of the strongest regular enemies, formed from broken modules and systems. |
| Final Level 5 | Overclocked Finals Professor | 420 HP | 36 DMG | Final boss and ultimate learning challenge. |

#### 18.6 Complete Enemy Progression Table
| Stage | Level 1 | Level 2 | Level 3 | Level 4 | Level 5 / Boss |
|---|---|---|---|---|---|
| Prelim HP | 45 | 55 | 65 | 75 | 160 |
| Prelim DMG | 8 | 9 | 10 | 11 | 16 |
| Midterm HP | 80 | 95 | 110 | 125 | 230 |
| Midterm DMG | 13 | 14 | 16 | 17 | 22 |
| Prefinal HP | 120 | 135 | 150 | 165 | 310 |
| Prefinal DMG | 19 | 20 | 22 | 23 | 28 |
| Final HP | 150 | 170 | 190 | 215 | 420 |
| Final DMG | 25 | 27 | 29 | 31 | 36 |

#### 18.7 Boss Names and Stats
| Stage | Boss Name | Health | Damage |
|---|---|---|---|
| Prelim | Overclocked Prelim Professor | 160 HP | 16 DMG |
| Midterm | Overclocked Midterm Professor | 230 HP | 22 DMG |
| Prefinal | Overclocked Prefinal Professor | 310 HP | 28 DMG |
| Final | Overclocked Finals Professor / Final Boss | 420 HP | 36 DMG |

#### 18.8 Balancing Note
This progression works well because the player’s Health carries over across normal levels, making each stage feel like a survival challenge. Since Health only resets after defeating the Stage Boss, enemy Damage should increase gradually instead of jumping too high too quickly. After each boss clear, the player’s maximum Health increases, allowing the next stage to become harder while still feeling fair.