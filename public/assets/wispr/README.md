# Wispr Flow people assets

Researched 1 November 2026. `team.json` contains 7 selectable people, two sourced facts each, public LinkedIn links, work-location evidence, and local portrait paths with their original source URLs. This is a curated roster, not a complete staff directory.

The four confirmed India team members are Nimisha Mehta, Rohan Kochhar, Shivam Bhotika, and Vasundhara Bhagat. Arpit Das is separately listed as an India-launch contributor because his current India base is unconfirmed. The two company founders are Tanay Kothari and Sahaj Garg.

Shivam's role label comes from his named customer testimonial. Vasundhara's scope is self-described; her formal job title remains unconfirmed. Other unresolved candidates are documented in `research/wispr-india-team.md` at the project root. The older `data/wispr-team.json` is a separate, unchanged dataset.

## Use in this project

This project serves its root directly, so the file is available at `./public/assets/wispr/team.json`. Each `photo.path` is relative to the JSON file:

```js
const manifestUrl = new URL('./public/assets/wispr/team.json', document.baseURI);
const team = await fetch(manifestUrl).then(response => response.json());
const indiaTeam = team.people.filter(person => person.group === 'india_team');
const portraitUrl = new URL(indiaTeam[0].photo.path, manifestUrl).href;
```

If a later framework serves `public` as its web root, load `/assets/wispr/team.json` instead; image paths still resolve relative to that file.

## Images and attribution

Images are unmodified source downloads. Founder photos come from [Wispr's downloadable media kit](https://wisprflow.ai/media-kit). Other portraits come from [Wispr's careers page](https://wisprflow.ai/careers), its official blog, named speaker profiles, personal profiles, or attributed customer stories. Each record preserves its source page and image URL. LinkedIn image URLs can expire, so use the local copies.

Public availability does not establish a reuse license. Original rights remain with their owners; no general reuse license was verified. Shivam's source portrait is only 160 × 160 pixels and is best suited to a small avatar. Other image dimensions are included in the JSON.

Facts are paraphrases of public statements, not quotes or endorsements. Locations and job titles reflect the sources available on the research date.
