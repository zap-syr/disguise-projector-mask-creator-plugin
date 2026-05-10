# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.0] - 2026-05-10

### Added

- **Projector list** — fetches all projectors from the active Disguise Designer session via the Python REST API, displayed in a searchable list with checkboxes and natural-numeric sorting
- **Soft Edge Mask creation** — batch-creates `SoftEdgeTexture` resources for all selected projectors, with configurable name suffix and resolution (match projector resolution or manual width × height)
- **Composite Mask creation** — batch-creates `CompositeTexture` resources for all selected projectors, with configurable resolution and a variable number of layers, each with a name suffix and blend mode (Over, Alpha, Add, Multiply); each layer's `SoftEdgeTexture` is also created and sized to match
- **Assign on Projector Feed toggle** — when enabled, automatically assigns the created mask to the matching Projector Feed
- **Mask type switcher** — segmented control to switch between Soft Edge and Composite mask modes
- **Error and loading states** — projector list shows animated skeletons while loading and a clear error message if the Designer connection fails
