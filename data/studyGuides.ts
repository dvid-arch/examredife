import { StudyGuide } from '../types.ts';

export const allStudyGuides: StudyGuide[] = [
  {
    id: 'sg1',
    title: 'Cellular Respiration',
    subject: 'Biology',
    createdAt: '2024-05-20',
    content: `
# Cellular Respiration: An Overview

Cellular respiration is the process by which organisms combine oxygen with foodstuff molecules, diverting the chemical energy in these substances into life-sustaining activities and discarding, as waste products, carbon dioxide and water.

## Key Stages:

1.  **Glycolysis:**
    *   Occurs in the cytoplasm.
    *   Breaks down one molecule of glucose into two molecules of pyruvate.
    *   Net production of 2 ATP and 2 NADH.

2.  **Pyruvate Oxidation:**
    *   Takes place in the mitochondrial matrix.
    *   Converts pyruvate into acetyl-CoA.
    *   Produces CO2 and NADH.

3.  **The Krebs Cycle (Citric Acid Cycle):**
    *   Occurs in the mitochondrial matrix.
    *   Completes the breakdown of glucose.
    *   Generates ATP, NADH, and FADH2.
    *   Releases CO2.

4.  **Oxidative Phosphorylation:**
    *   Involves the electron transport chain and chemiosmosis.
    *   Occurs on the inner mitochondrial membrane.
    *   NADH and FADH2 donate electrons to the chain, powering ATP synthesis.
    *   Oxygen is the final electron acceptor, forming water.
    *   Produces the majority of ATP (around 32-34 molecules).
    `
  },
  {
    id: 'sg2',
    title: 'Figures of Speech',
    subject: 'English Language',
    createdAt: '2024-05-18',
    content: `
# Common Figures of Speech

Figures of speech are words or phrases used in a non-literal sense for rhetorical or vivid effect.

## Key Types:

*   **Simile:** A comparison between two unlike things using "like" or "as".
    *   *Example:* He is as brave **as** a lion.

*   **Metaphor:** A direct comparison between two unlike things without using "like" or "as".
    *   *Example:* The world is a stage.

*   **Personification:** Giving human qualities or abilities to inanimate objects or abstract ideas.
    *   *Example:* The wind whispered through the trees.

*   **Hyperbole:** An extreme exaggeration used for emphasis or effect.
    *   *Example:* I'm so hungry I could eat a horse.

*   **Onomatopoeia:** A word that imitates the natural sound of a thing.
    *   *Example:* The bees **buzzed** around the hive.
    `
  },
  {
    id: 'sg3',
    title: 'Newton\'s Laws of Motion',
    subject: 'Physics',
    createdAt: '2024-05-15',
    content: `
# Newton's Laws of Motion

These three laws describe the relationship between a body and the forces acting upon it, and its motion in response to those forces.

## The Three Laws:

1.  **First Law (Law of Inertia):**
    *   An object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force.
    *   Inertia is the resistance to a change in motion.

2.  **Second Law (Law of Acceleration):**
    *   The acceleration of an object as produced by a net force is directly proportional to the magnitude of the net force, in the same direction as the net force, and inversely proportional to the mass of the object.
    *   Formula: **$F = ma$** (Force = mass × acceleration)

3.  **Third Law (Law of Action-Reaction):**
    *   For every action, there is an equal and opposite reaction.
    *   This means that in every interaction, there is a pair of forces acting on the two interacting objects. The size of the forces on the first object equals the size of the force on the second object.
    `
  },
  {
    id: 'sg4',
    title: 'Photosynthesis',
    subject: 'Biology',
    createdAt: '2024-05-21',
    content: `
# Photosynthesis Explained
Photosynthesis is the process used by plants, algae, and certain bacteria to harness energy from sunlight and turn it into chemical energy.
## The Chemical Equation
$6\\text{CO}_2 + 6\\text{H}_2\\text{O} + \\text{Light Energy} \\rightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$
## Key Components
- **Chloroplasts:** The site of photosynthesis.
- **Chlorophyll:** The pigment that absorbs sunlight.
- **Stomata:** Pores on the leaf surface for gas exchange.
`
  },
  {
    id: 'sg5',
    title: 'Verb Tenses',
    subject: 'English Language',
    createdAt: '2024-05-19',
    content: `
# Understanding Verb Tenses
Verb tenses indicate the time of an action or state of being.
## Main Tenses
- **Past:** Action that has already happened (e.g., "I walked").
- **Present:** Action happening now or happens regularly (e.g., "I walk").
- **Future:** Action that will happen (e.g., "I will walk").
Each of these has perfect, progressive, and perfect progressive forms.
`
  },
  {
    id: 'sg6',
    title: 'Ohm\'s Law',
    subject: 'Physics',
    createdAt: '2024-05-16',
    content: `
# Ohm's Law
Ohm's law states that the current through a conductor between two points is directly proportional to the voltage across the two points.
## The Formula
$V = IR$
- **V:** Voltage (in Volts)
- **I:** Current (in Amperes)
- **R:** Resistance (in Ohms)
This is a fundamental principle in electronics and circuit analysis.
`
  }
];