---
name: disguise-api
description: >
  How to work with the Disguise Designer Python REST API in this project. Use this skill
  whenever the user asks about calling Disguise APIs, adding new API calls, modifying
  disguiseService.js, writing Python scripts for the /api/session/python/execute endpoint,
  working with VideoClip / Projection / Track resources, handling HH:MM:SS:FF time formats,
  creating timeline layers, reading or setting layer sequences, or any interaction with the
  Disguise Designer runtime. Also use when adding new features that need to query or mutate
  the Disguise session state.
---

# Disguise API Skill

This project drives Disguise Designer entirely through a single REST endpoint that executes
arbitrary Python. There is no static backend — every feature is a Python string built in JS
and POSTed to Designer.

---

## The execution model

```
Frontend (Vue) → builds Python string → POST /api/session/python/execute → Designer runtime
                                                                          ↓
                                                              returns { returnValue: ... }
```

The `executePython` helper in `src/services/disguiseService.js` handles the HTTP round-trip.
All new API calls should go through it — don't re-implement the fetch logic.

```js
// src/services/disguiseService.js
async function executePython(directorIp, script) {
  const endpoint = `http://${directorIp}/api/session/python/execute`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script })
  });
  const data = await response.json();
  let result = data.returnValue;
  if (typeof result === 'string') {
    try { result = JSON.parse(result); } catch (e) {}
  }
  return result;
}
```

The `directorIp` is injected via `?director=` URL param, parsed in `App.vue` and passed
down to the main plugin component and then into every service call:

```js
// App.vue
const urlParams = new URLSearchParams(window.location.search);
const directorEndpoint = urlParams.get('director') || 'localhost:80'; // fallback for dev
```

During local development (`npm run dev`) the fallback `localhost:80` is used automatically,
so the plugin can be tested against a locally-running Designer instance without any URL params.

---

## Python script patterns

### Simple one-liner
```python
return resourceManager.allResources(VideoClip)
```

### Multi-step wrapped in a function (required when you need local variables)
```python
def run():
    track = resourceManager.load("objects/track/MyTrack.apx", Track)
    if not track:
        return {"status": "error", "message": "Track not found"}
    return {"status": "success", "uid": track.uid}

return run()
```

Always wrap multi-step logic in `def run(): … return run()`. The outer `return` is what
Designer captures as `returnValue`. Forgetting this means the endpoint returns `null`.

### Returning data to JS
Return a plain Python dict or list — Designer serialises it to JSON automatically.
If you need to return a string that is itself JSON, the `executePython` helper will
`JSON.parse` it on the JS side.

---

## Core Designer globals available in every script

| Global | What it is |
|---|---|
| `resourceManager` | Load, create, and enumerate resources |
| `guisystem.track` | The currently selected track in the UI |
| `guisystem.player.tCurrent` | Current playhead position in **beats** |
| `state.globalRefreshRate` | Project refresh rate (use `.asDouble`) |
| `markDirty(obj)` | Mark a resource dirty so Designer persists it |

---

## Resource types

| Python type | What it represents |
|---|---|
| `VideoClip` | A media file (video or still image) |
| `Projection` | A mapping/projection surface |
| `Track` | A timeline track |
| `VariableVideoModule` | The layer module type used to create video layers |
| `Tag` | A timeline tag (cue, timecode, MIDI) |

### Loading resources
```python
# Load an existing resource by path (returns None if not found)
clip = resourceManager.load("objects/videoclip/folder/clip.apx", VideoClip)

# Load or create (creates if path doesn't exist)
track = resourceManager.loadOrCreate("objects/track/MyTrack.apx", Track)

# Enumerate all resources of a type (returns list of {uid, path, ...} dicts)
all_clips = resourceManager.allResources(VideoClip)
```

Resource paths always use forward slashes and end with `.apx`.
The `objects/videoclip/` prefix is required for VideoClip paths.
Use `r'...'` raw strings in Python when interpolating paths from JS to avoid backslash issues.

---

## Time format: HH:MM:SS:FF

Designer timelines use **beats** internally. All time conversions go through the track:

```python
# Convert wall-clock seconds to beats at a given position
beats = track.timeToBeat(seconds)

# Convert beats back to seconds
seconds = track.beatToTime(beats)
```

When the user supplies a time in `HH:MM:SS:FF` format, convert in JS before embedding:

```js
const [hours, minutes, seconds, frames] = options.startTime.split(':').map(Number);
// FPS from the project refresh rate (halved if > 30 for interlaced)
const fps = refreshRate > 30 ? refreshRate / 2 : refreshRate;
const totalSeconds = hours * 3600 + minutes * 60 + seconds + frames / fps;
```

Then embed `totalSeconds` in the Python script and call `track.timeToBeat(totalSeconds)`.

### Beat-relative duration
To express "N seconds of wall-clock time" as a beat duration at a specific position:
```python
end_time_seconds = track.beatToTime(start_beats) + duration_seconds
duration_beats = track.timeToBeat(end_time_seconds) - start_beats
```
This correctly handles BPM changes on the track.

---

## Creating a video layer

```python
new_layer = current_track.addNewLayer(
    VariableVideoModule,   # module type
    start_beats,           # where on the track (in beats)
    length_beats,          # how long (in beats)
    "Layer Name"           # display name
)
```

After creation, configure the layer's sequences (properties that can be keyframed):

```python
# Generic sequence-setting pattern
fseq = new_layer.findSequence("sequence_name")
if fseq:
    markDirty(fseq)
    fseq.disableSequencing = True          # set a static value (no keyframes)
    fseq.sequence.setResource(beat, resource)  # for resource properties
    fseq.sequence.setFloat(beat, value)        # for numeric properties
    fseq.saveOnDelete()
```

### Key sequence names for VariableVideoModule

| Sequence name | Type | Value |
|---|---|---|
| `"video"` | resource | `VideoClip` instance |
| `"mapping"` | resource | `Projection` instance |
| `"mode"` | float | `0` = Locked, `1` = Normal |
| `"At end point"` | float | `0` = Loop, `1` = Ping-Pong, `2` = Pause |
| `"Brightness"` | float | `0.0`–`1.0` |

Set `disableSequencing = False` and use multiple `setFloat` calls at different beats to
animate a property (e.g. brightness fade-in).

---

## Tags

```python
tag = Tag(tag_type, tag_text)
current_track.setTagAtBeat(beat_position, tag)
```

| `tag_type` | Meaning |
|---|---|
| `0` | Timecode tag |
| `1` | Cue tag |
| `2` | MIDI note tag |

Timecode text format: `"HH:MM:SS:FF"` (zero-padded, e.g. `"01:00:00:00"`).

---

## Splitting sections

```python
current_track.splitSectionAtBeat(beat_position)
```

Call before the first layer to open a section, and after each layer's end beat to close it.
`SPLIT_SECTION` in the existing script demonstrates the pattern.

---

## Building new service functions

Follow the existing pattern in `disguiseService.js`:

```js
export async function myNewFeature(directorIp, param) {
  const script = `
def run():
    # ... Python using param: ${param} ...
    return {"status": "success", "result": some_value}
return run()
`;
  return await executePython(directorIp, script);
}
```

**Escaping pitfalls:**
- Use `r'...'` raw strings in Python when embedding paths interpolated from JS.
- Avoid single quotes inside Python string literals if the JS template uses single quotes —
  use double quotes inside Python or escape carefully.
- Variable names in the generated Python must not collide with Designer globals
  (`track`, `clip`, `state`, etc. are reserved — prefix locals with `current_` or similar).

---

## Media hierarchy

`resourceManager.allResources(VideoClip)` returns flat paths like:
```
objects/videoclip/folder/subfolder/clip.apx
```

`buildFileHierarchy()` in `disguiseService.js` converts this flat list into the nested
folder tree the sidebar renders. When adding new media-related features, parse paths the
same way: strip the `objects/videoclip/` prefix, split on `/`, last segment is the file.

Thumbnail URL pattern (used in the media item component):
```
http://{director}/api/v1/thumbnail/{uid}
```

---

## Checklist when adding a new Disguise API feature

1. Write the Python logic first — test the raw script in Designer's Python console if possible.
2. Add a new exported function to `disguiseService.js` that calls `executePython`.
3. Return a structured dict from Python (`{"status": "success", ...}`) so the JS side can
   detect errors reliably.
4. Call the service function from your main plugin component; pass `directorIp` as the first arg.
5. If the feature involves time input from the user, convert HH:MM:SS:FF → seconds in JS
   before embedding in the script.
