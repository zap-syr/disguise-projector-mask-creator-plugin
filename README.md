# Disguise Projector Mask Creator Plugin

This plugin provides a streamlined interface for batch-creating soft edge and composite mask resources in Disguise Designer. Select any number of projectors from the active session, configure mask settings, and generate the corresponding texture assets in a single action.

## Download

Download the latest release - [Projector Mask Creator](https://github.com/zap-syr/disguise-projector-mask-creator-plugin/releases/latest/download/Projector.Mask.Creator.zip)

## Installation

To install the plugin, follow the official Disguise documentation steps - [Installing Plugins](https://help.disguise.one/designer/plugins/designer-plugin-overview#installing-plugins)

## Plugin Overview

### Projector List

The left panel lists all projectors found in the active Disguise Designer session.

- **Search** — filter projectors by name in real time
- **Checkboxes** — select individual projectors or use Select All / Deselect All
- **Natural sorting** — projectors are sorted numerically (e.g. Projector 1, 2, 10)
- **Resolution display** — each projector shows its output resolution

### Creating Masks

Select one or more projectors, configure the mask settings in the right panel, and click **Create Masks**. The plugin will generate the requested mask resources for every selected projector.

## Settings Panel

### Mask Type

Choose between two mask types using the segmented control:

| Type               | Description                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| **Soft Edge Mask** | Creates a `SoftEdgeTexture` resource for each selected projector                                            |
| **Composite Mask** | Creates a `CompositeTexture` resource with one or more `SoftEdgeTexture` layers for each selected projector |

### Mask Resolution

| Option                   | Description                                                          |
| ------------------------ | -------------------------------------------------------------------- |
| **Projector Resolution** | Each mask is sized to match its projector's native output resolution |
| **Manual**               | All masks are created at a fixed width × height entered manually     |

### Soft Edge Mask Options

| Setting    | Description                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| **Suffix** | Text appended to the projector name to form the mask resource name (e.g. `_mask` → `Projector 1_mask`) |

### Composite Mask Options

| Setting        | Description                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------- |
| **Layers**     | Add one or more layers, each with a suffix and a blend mode. Suffixes must be unique and non-empty |
| **Blend Mode** | Per-layer blend mode: Over, Alpha, Add, or Multiply                                                |

### Assing on Projector Feed

When enabled, the created composite mask is automatically assigned to the matching projector feed

## Issues

Found a bug or have a feature request? [Open an issue](https://github.com/zap-syr/disguise-projector-mask-creator-plugin/issues/new)

## License

This project is licensed under the terms of the MIT License.
