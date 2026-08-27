# Inferred World Schema

Status: `PARTIAL / UNKNOWN internals`

```text
World { id, slug, title, cover, theme, shortDescription, markdownDescription,
  tags[≤3], visibility, remixAllowed, creator,
  characters[], playerSetupFields[], apps[], systemPrompt,
  winLoseRules?, openingScene?, advisorPresets?, consoleAllowed,
  layout, versions[], saves[] }
WorldVersion { number, title?, changelog, publishedAt, creatorSnapshot }
```

This is an externally observable schema proposal. Storage/API names are UNKNOWN; do not treat field names as implementation requirements.
