import { StudyGuide } from '../types.ts';

/**
 * Legacy fallback study guides in the correct StudyGuide shape.
 * These are used when the API is unavailable.
 */
export const allStudyGuides: StudyGuide[] = [
  {
    id: 'biology',
    subject: 'Biology',
    lastUpdated: '2024-05-21',
    topics: [
      {
        id: 'cellular-respiration',
        title: 'Cellular Respiration',
        content: `# Cellular Respiration: An Overview

Cellular respiration is the process by which organisms combine oxygen with foodstuff molecules, diverting the chemical energy in these substances into life-sustaining activities and discarding, as waste products, carbon dioxide and water.

## Key Stages:

1.  **Glycolysis:** Occurs in the cytoplasm. Breaks down one molecule of glucose into two molecules of pyruvate. Net production of 2 ATP and 2 NADH.

2.  **Pyruvate Oxidation:** Takes place in the mitochondrial matrix. Converts pyruvate into acetyl-CoA. Produces CO2 and NADH.

3.  **The Krebs Cycle (Citric Acid Cycle):** Occurs in the mitochondrial matrix. Generates ATP, NADH, and FADH2. Releases CO2.

4.  **Oxidative Phosphorylation:** Involves the electron transport chain and chemiosmosis. Occurs on the inner mitochondrial membrane. Produces the majority of ATP (around 32-34 molecules).`
      },
      {
        id: 'photosynthesis',
        title: 'Photosynthesis',
        content: `# Photosynthesis Explained
Photosynthesis is the process used by plants, algae, and certain bacteria to harness energy from sunlight and turn it into chemical energy.
## The Chemical Equation
$6\text{CO}_2 + 6\text{H}_2\text{O} + \text{Light Energy} \rightarrow \text{C}_6\text{H}_{12}\text{O}_6 + 6\text{O}_2$
## Key Components
- **Chloroplasts:** The site of photosynthesis.
- **Chlorophyll:** The pigment that absorbs sunlight.
- **Stomata:** Pores on the leaf surface for gas exchange.`
      }
    ]
  },
  {
    id: 'english',
    subject: 'English Language',
    lastUpdated: '2024-05-19',
    topics: [
      {
        id: 'figures-of-speech',
        title: 'Figures of Speech',
        content: `# Common Figures of Speech

Figures of speech are words or phrases used in a non-literal sense for rhetorical or vivid effect.

## Key Types:

*   **Simile:** A comparison using "like" or "as". *Example:* He is as brave **as** a lion.
*   **Metaphor:** A direct comparison without "like" or "as". *Example:* The world is a stage.
*   **Personification:** Giving human qualities to inanimate objects. *Example:* The wind whispered through the trees.
*   **Hyperbole:** An extreme exaggeration. *Example:* I'm so hungry I could eat a horse.
*   **Onomatopoeia:** A word that imitates a natural sound. *Example:* The bees **buzzed** around the hive.`
      },
      {
        id: 'verb-tenses',
        title: 'Verb Tenses',
        content: `# Understanding Verb Tenses
Verb tenses indicate the time of an action or state of being.
## Main Tenses
- **Past:** Action that has already happened (e.g., "I walked").
- **Present:** Action happening now or happens regularly (e.g., "I walk").
- **Future:** Action that will happen (e.g., "I will walk").
Each of these has perfect, progressive, and perfect progressive forms.`
      }
    ]
  },
  {
    id: 'physics',
    subject: 'Physics',
    lastUpdated: '2024-05-16',
    topics: [
      {
        id: 'newtons-laws',
        title: "Newton's Laws of Motion",
        content: `# Newton's Laws of Motion

1.  **First Law (Law of Inertia):** An object at rest stays at rest unless acted upon by an unbalanced force.
2.  **Second Law:** $F = ma$ (Force = mass × acceleration).
3.  **Third Law:** For every action, there is an equal and opposite reaction.`
      },
      {
        id: 'ohms-law',
        title: "Ohm's Law",
        content: `# Ohm's Law
Ohm's law states that the current through a conductor is directly proportional to the voltage across the two points.
## The Formula
$V = IR$
- **V:** Voltage (Volts)
- **I:** Current (Amperes)
- **R:** Resistance (Ohms)`
      }
    ]
  }
];