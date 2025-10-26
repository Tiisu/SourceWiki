Project Concept: “WikiSourceVerifier” (or similar)
A community-driven reference verification platform for Wikipedia editors and Wikimedia contributors.
Goal:
 To crowdsource and curate credible, country-based reference databases that support better citation practices on Wikipedia.

Core Features
1. Reference Submission Form
Simple web form where contributors can:


Paste a URL or upload a reference (e.g., PDF, DOI, book info)


Select the country of origin


Suggest a category:


📗 Primary source (firsthand/original data)


📘 Secondary source (reporting or analysis)


🚫 Not reliable (blog, misinformation, biased source)


Optionally link the Wikipedia article where it was used.


2. Verification Dashboard (Country Admins)
Each country has assigned verifiers (e.g., Wikimedia community members, editors, librarians)


They can:


Review pending submissions


Mark as “Credible” / “Unreliable”


Reassign or flag for global review


Add short notes (“Owned by government”, “Academic publisher”, etc.)


3. Public Reference Directory
A searchable and filterable list of verified sources:


Filter by Country, Category, Reliability, or Type of Media


API endpoint for external tools (so editors can integrate it into Wikipedia citation templates or gadgets)


Each entry includes:


Title / Publisher


URL / DOI


Country


Reliability category


Date verified


Verifier name (optional)


4. Gamification / Community Metrics
Contributors earn points or badges for verified submissions


Country dashboards show leaderboards for engagement






Suggested Tech Stack (Lightweight and Wikimedia-friendly)
Component
Recommendation
Frontend
React + TailwindCSS (lightweight, responsive)
Backend
Flask or FastAPI (Python) / Node.js (Express)
Database
SQLite or PostgreSQL (depending on scale)
Auth
Wikimedia OAuth (via Meta-Wiki or OAuth consumer)
Hosting
Wikimedia Toolforge (ideal) or Cloud VPS
API
REST API or GraphQL for future integration with Wikipedia tools


Possible Integrations
Wikidata property: Each verified source can be linked to a Wikidata item (e.g., publisher, website).


Wikipedia gadgets/userscripts: Editors could get a pop-up in the citation editor that checks if a source is already verified.


Machine learning extension (future): Automatically detect unreliable sources based on patterns (domain reputation, bias, etc.).




Example User Flow
A contributor finds a source while editing a Wikipedia article.


They visit WikiSourceVerifier.org.


Submit the link + select “Ghana” + mark it as “Secondary”.


A Ghanaian admin reviews it → marks “Credible”.


It appears in the public “Ghana - Verified Sources” list.


Other editors now know it’s a trustworthy source.




Possible Implementation Plan
Phase
Description
Duration
Phase 1
Prototype web app (submission + public list)
2–3 weeks
Phase 2
Admin dashboard for verifiers
2 weeks
Phase 3
Wikimedia OAuth integration + API
2 weeks
Phase 4
Public beta with 5–10 country communities
1 month
Phase 5
Integration with Wikipedia citation tools
Later phase


Benefits for the Wikimedia Movement
Reduces the spread of unreliable sources on Wikipedia.


Encourages cross-country collaboration for credible referencing.


Supports smaller language Wikipedias (like Dagbani, Twi, Fante, etc.) with localised reference vetting.


Creates an open dataset of verified credible references per country.




