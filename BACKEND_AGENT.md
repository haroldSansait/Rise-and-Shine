# Rise and Shine — Logical Core & Architecture Specifications
This document outlines the state-machine rules, runtime mathematics, assessment loops, and local data hydration paradigms driving the game's execution layer.

---

## 1. Robust State Management Architecture
The entire turn-based game engine operates as an event-driven state environment. To eliminate code fragmentation or unexpected sequence leaks, game state tracking utilizes strict, deterministic transition boundaries.

### Core State Transition Matrix
Transitions flow strictly along validated paths to ensure predictable sequence safety:
`BOOT_UI` ➔ `HERO_SELECT` ➔ `STAGE_LOAD` ➔ `WAITING_FOR_ANSWER` ➔ `EVALUATE_RESPONSE` ➔ `BYTE_ATTACK` / `ENEMY_COUNTER` ➔ `CHECK_HEALTH_THRESHOLDS` ➔ `LEVEL_CLEAR` / `GAME_OVER`.

```javascript
// Lightweight State Coordinator Pattern
const GameStateManager = {
  currentState: 'BOOT_UI',
  allowedTransitions: {
    'BOOT_UI': ['HERO_SELECT'],
    'HERO_SELECT': ['STAGE_LOAD'],
    'STAGE_LOAD': ['WAITING_FOR_ANSWER'],
    'WAITING_FOR_ANSWER': ['EVALUATE_RESPONSE'],
    'EVALUATE_RESPONSE': ['BYTE_ATTACK', 'ENEMY_COUNTER'],
    'BYTE_ATTACK': ['CHECK_HEALTH_THRESHOLDS'],
    'ENEMY_COUNTER': ['CHECK_HEALTH_THRESHOLDS'],
    'CHECK_HEALTH_THRESHOLDS': ['WAITING_FOR_ANSWER', 'LEVEL_CLEAR', 'GAME_OVER'],
    'LEVEL_CLEAR': ['STAGE_LOAD', 'GAME_CLEAR']
  },
  transitionTo(newState) {
    if (this.allowedTransitions[this.currentState].includes(newState)) {
      this.currentState = newState;
      this.syncUIWithState();
    } else {
      console.error(`Invalid Engine Transition: ${this.currentState} -> ${newState}`);
    }
  }
};
```

---

## 2. Computational Battle Logic & Equations
The runtime engine utilizes a simplified, calculation-focused system driven exclusively by explicit Health (HP) and Damage (DMG) matrices.

### Equation Systems
* **Normal Attack Resolution**: Executed synchronously upon a correct user choice array evaluation:
  $$Total Normal Attack Damage = Character Damage + Byte Damage$$
* **Enemy Attack Resolution**: Executed synchronously upon an incorrect user choice array evaluation:
  $$Player Current Health = Player Current Health - Enemy Damage$$

### Byte Skill Charge Infrastructure
Byte special metrics accumulate charge values exclusively from correct question feedback arrays.
* Normal Skills: Require $\ge 3$ correct answers.
* Strong / Healing / Special Skills: Require $\ge 4$ correct answers.

---

## 3. Stage Progression & Health Hydration Rules
The stage system features fixed level tracks across four academic arcs (Prelim, Midterm, Prefinal, Finals).

### Health Carryover & Scaling Architecture
* **Intra-Stage Preservation**: A player's current health metric does not replenish upon a normal level clearance. The remaining value copies forward into the subsequent level context within the active stage.
* **Boss Defeat Milestone**: Full replenishment to maximum capacity occurs only after a Stage Boss module hits 0 HP.
* **Maximum Health Growth Scaling**: Defeating a Stage Boss expands the player's core attributes before loading the subsequent difficulty tier:
  * Post-Prelim Boss: $+20\text{ Max HP}$
  * Post-Midterm Boss: $+25\text{ Max HP}$
  * Post-Prefinal Boss: $+30\text{ Max HP}$

---

## 4. Local Hydration & Asset Mapping (`localStorage`)
The backend engine leverages a unified JSON configuration map (`sprites.json`) to control sprite indexing profiles without requiring asynchronous file slicing loops.

### Client Save Schema (`localStorage`)
```json
{
  "rise_and_shine_save_v1": {
    "unlocked_heroes": ["MJ", "Harold", "Bai", "Dale", "Paps", "Bebz", "Matt", "JB"],
    "unlocked_bytes": ["Pinglet", "Bitbug", "Porturtle"],
    "current_stage": "Midterm",
    "current_level": 1,
    "player_runtime_max_hp": 130,
    "player_runtime_current_hp": 112
  }
}
```
