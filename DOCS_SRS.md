# Spaced Repetition System (SRS) Documentation

fudami uses the **FSRS (Free Spaced Repetition Scheduler)** algorithm to optimize your learning journey. This document explains what it is, why we use it, and how it compares to traditional systems.

## What is FSRS?

FSRS is a modern, open-source spaced repetition algorithm based on a three-component model of memory (retrievability, stability, and difficulty). It was developed to overcome the limitations of older algorithms like SM-2.

We use the [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) library, a high-quality TypeScript implementation of the FSRS scheduler.

### Why is it better than Anki's default (SM-2)?

1.  **More Accurate Predictions:** FSRS uses a more sophisticated mathematical model to predict when you are likely to forget a card.
2.  **Continuous Calibration:** The algorithm adapts to your specific memory patterns based on every single review you perform.
3.  **Adaptive to Card Difficulty:** It handles cards of varying difficulty much better than the rigid multiplier system of SM-2.
4.  **No "Ease Hell":** One of the biggest complaints with SM-2 is "ease hell," where cards can get stuck in very short intervals indefinitely. FSRS avoids this naturally through its stability-based calculation.

## How it works in fudami

Every time you review a card, you provide a rating:

-   **Again (1):** You completely forgot the card.
-   **Hard (2):** You remembered, but with significant effort.
-   **Good (3):** You remembered with normal effort.
-   **Easy (4):** You remembered instantly.

### The Math Behind it

FSRS tracks three key values for every card:

-   **Stability (S):** The number of days it takes for the probability of recalling the card to fall to 90%.
-   **Difficulty (D):** How hard the card is to remember.
-   **Retrievability (R):** The probability of recalling the card at a given time.

When you grade a card, FSRS updates **S** and **D**, and then calculates the new **Due Date** based on your requested retention (defaulted to 90% in fudami).

## Open Source & Community

The FSRS algorithm is part of the [Open Spaced Repetition](https://github.com/open-spaced-repetition) initiative. It is fully open-source and continuously refined based on large-scale data analysis from thousands of users.

By using FSRS, fudami ensures you are using the state-of-the-art in memory science to learn Japanese more efficiently.
