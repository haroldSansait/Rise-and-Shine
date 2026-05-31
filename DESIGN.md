# Rise and Shine — Systems Design & Balance Compendium
This document outlines the background narrative framework, asset metrics, unit parameter balances, and sound design properties for the game world.

---

## 1. Narrative Context & Core Theme
* **The Glitchbell Incident**: The game takes place at Rise and Shine Academy, an institution driven by the LUMEN Network (Learning Unified Memory and Evaluation Network). When a distorted bell anomaly overloads the cluster, academic stress transforms the platform into an interactive battlefield.
* **The Bifurcated Ecosystem**:
  * **Friendly Bytes**: Born from curiosity, effort, and positive learning energy.
  * **Glitchborn Bytes**: Born from confusion, stress, and fear of failure.
* **The Overclocked Faculty**: Professors are transformed into localized stage bosses driven by strict performance stress and perfectionism themes.

---

## 2. Visual Architecture & Asset Specifications
All customized art assets follow precise scaling boundaries to prevent edge canvas drift or fuzzy pixels.
* **Playable Heroes Dimensions**: Render target resolution must match bounds between $64 \times 64\text{px}$ and $128 \times 128\text{px}$.
* **Companion Bytes Dimensions**: Sized within a $64 \times 64\text{px}$ individual cell footprint, scaling onto an absolute $256 \times 64\text{px}$ horizontal strip.
* **Glitchborn Minions Dimensions**: Scale footprints between $48 \times 48\text{px}$ and $128 \times 128\text{px}$ to maintain size variety.
* **Stage Boss Dimensions**: Set to a $128 \times 128\text{px}$ individual frame canvas ($512 \times 128\text{px}$ overall line) to emphasize boss hierarchy.

---

## 3. Balance Sheets & Statistical Configurations

### Playable Character Metrics (No Passive Skills)
| Character Name | Role Archetype | Base Health (HP) | Base Damage (DMG) |
| :--- | :--- | :--- | :--- |
| **MJ** | Balanced Hero | 110 | 18 |
| **Harold** | Defensive Hero | 130 | 14 |
| **Bai** | Damage Hero | 95 | 22 |
| **Dale** | Hybrid Fighter | 120 | 20 |
| **Paps** | Tank Hero | 150 | 12 |
| **Bebz** | Stable Hero | 115 | 16 |
| **Matt** | Power Attacker | 100 | 24 |
| **JB** | Survival Fighter | 140 | 15 |
| **Shine** *(Secret)* | Overclocked Special | 125 | 25 |

### Companion Byte Skill Configurations
| Byte Identity | Base HP | Base DMG | Assigned Special Skill | Explicit Mechanical Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **Porturtle** | 120 | 10 | Port Shield | Reduces incoming damage by 40% for one enemy turn. |
| **RAMhorn** | 95 | 20 | Memory Charge | Deals exactly $2\times$ current Byte Damage to target. |
| **Bitbug** | 80 | 16 | Code Sting | Strikes target and lowers enemy Damage by 20% for one turn. |
| **Voltbyte** | 75 | 22 | Shock Strike | Deals damage and may weaken the enemy's next attack. |
| **Glitchip** | 85 | 18 | Error Pulse | Triggers random computational damage scaled between 15 and 35. |
| **Firewisp** | 85 | 18 | Flame Flicker | Infects target with damage over time (burn status) for two turns. |
| **Pinglet** | 70 | 15 | Ping Shot | Deals rapid consistent damage and reveals enemy structural weakness. |
| **Keyfox** | 90 | 17 | Key Strike | Strikes target with a probability to lock down the enemy's next turn. |
| **Lagoon** | 105 | 8 | Aqua Restore | Instantly returns 25 Health points directly to the active player. |
| **Datashade** | 88 | 19 | Shadow Packet | Deals structural damage and checks enemy attack power levels. |

---

## 4. Enemy Scaling Progression Matrices

### Regular Encounter Progress Profiles
* **Prelim Tier**: 40–70 HP range | 8–12 Damage power scale (Easy threshold).
* **Midterm Tier**: 70–100 HP range | 12–18 Damage power scale (Moderate threshold).
* **Prefinal Tier**: 100–140 HP range | 18–24 Damage power scale (Hard threshold).
* **Finals Tier**: 140–200 HP range | 24–32 Damage power scale (Very Hard threshold).

### Academic Arc Boss Specifications
| Stage Endpoint | Boss Character Entity | Total HP | Total DMG | Structural Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Prelim Level 5** | Overclocked Prelim Professor | 160 | 16 | First trial checking core foundational knowledge. |
| **Midterm Level 5** | Overclocked Midterm Professor | 230 | 22 | Checks operational survival and skill timing patterns. |
| **Prefinal Level 5** | Overclocked Prefinal Professor | 310 | 28 | High-pressure check on player consistency and strategy. |
| **Final Level 5** | Overclocked Finals Professor | 420 | 36 | Final bottleneck barrier before accessing the Core chamber. |
| **True Final Boss** | Core of Assessment | 420 | 36 | Ultimate challenge testing comprehensive concepts. |

---

## 5. Audio Design Parameters (`ZzFX` / `Live jsfxr`)
To support procedural, text-coded audio generation, sound effects are mapped directly to sound configuration arrays to maintain a fast download footprint.

### Audio Registry Configurations
```javascript
// Sound configurations passed directly to the browser's Web Audio API
const ProceduralSoundRegistry = {
  bitmite_chirp: [1, .05, 1319, .01, .06, .11, 0, 1.4, 2, 40, .05, .01, .01, 0, 0, 0, 0, .8, .02, .01],
  cacheslime_squish: [1, .1, 220, .02, .08, .2, 1, 0, .5, 5, 0, 0, .05, .3, 0, .1, 0, .6, .05, .05],
  syntaxsprout_error: [2, .05, 880, 0, .02, .1, 4, 3.1, 0, 0, 0, 0, 0, .5, 0, 0, .1, .4, .02, 0],
  generic_impact_heavy: [1, .2, 110, .01, .1, .3, 3, 2.5, -4, 0, 0, 0, .1, .8, 0, 0, .15, .5, .1, .05]
};
```
