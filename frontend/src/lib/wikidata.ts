export async function fetchCountryMetadata(country: string) {
  const res = await fetch(
    `https://www.wikidata.org/wiki/Special:EntityData/${country}.json`
  );
  return res.json();
}
