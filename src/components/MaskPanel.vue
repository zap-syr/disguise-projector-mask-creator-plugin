<script setup>
import { ref, computed } from 'vue'

defineProps({
  maskType: { type: String, default: 'soft-edge' },
  selectedCount: { type: Number, default: 0 },
  creating: { type: Boolean, default: false },
})

const emit = defineEmits(['update:maskType', 'create'])

// Soft Edge state
const softResolutionMode = ref('projector')
const softWidth = ref(1920)
const softHeight = ref(1080)
const softSuffix = ref('')
const softAssignOnFeed = ref(false)

// Composite state
const compositeResolutionMode = ref('projector')
const compositeWidth = ref(1920)
const compositeHeight = ref(1080)
const layers = ref([])
const compositeAssignOnFeed = ref(false)
let nextLayerId = 1

const BLEND_MODES = [
  { value: 'over', label: 'Over' },
  { value: 'alpha', label: 'Alpha' },
  { value: 'add', label: 'Add' },
  { value: 'multiply', label: 'Multiply' },
]

function addLayer() {
  layers.value.push({ id: nextLayerId++, suffix: '', blendMode: 'add' })
}

function removeLayer(id) {
  layers.value = layers.value.filter((l) => l.id !== id)
}

const duplicateLayerSuffixes = computed(() => {
  const seen = new Set()
  const dups = new Set()
  for (const l of layers.value) {
    if (l.suffix) {
      if (seen.has(l.suffix)) dups.add(l.suffix)
      else seen.add(l.suffix)
    }
  }
  return dups
})

function layerHasError(layer) {
  return !layer.suffix || duplicateLayerSuffixes.value.has(layer.suffix)
}

const hasLayerErrors = computed(() => layers.value.some(l => layerHasError(l)))

function setMaskType(type) {
  emit('update:maskType', type)
}

function handleCreate() {
  emit('create', {
    softEdge: {
      suffix: softSuffix.value,
      resolutionMode: softResolutionMode.value,
      width: softWidth.value,
      height: softHeight.value,
      assignOnFeed: softAssignOnFeed.value,
    },
    composite: {
      resolutionMode: compositeResolutionMode.value,
      width: compositeWidth.value,
      height: compositeHeight.value,
      layers: layers.value.map((l) => ({ suffix: l.suffix, blendMode: l.blendMode })),
      assignOnFeed: compositeAssignOnFeed.value,
    },
  })
}
</script>

<template>
  <div class="mask-panel">
    <div class="panel-header">
      <span class="panel-title">Mask Options</span>
    </div>

    <div class="panel-content">
      <!-- Mask Type -->
      <div class="settings-group">
        <div class="settings-group-header">Mask Type</div>
        <div class="segmented">
          <button
            class="segmented-item"
            :class="{ active: maskType === 'soft-edge' }"
            @click="setMaskType('soft-edge')"
          >
            Soft Edge Mask
          </button>
          <button
            class="segmented-item"
            :class="{ active: maskType === 'composite' }"
            @click="setMaskType('composite')"
          >
            Composite Mask
          </button>
        </div>
      </div>

      <!-- Soft Edge Mask options -->
      <template v-if="maskType === 'soft-edge'">
        <div class="settings-group">
          <div class="settings-group-header">Mask Resolution</div>
          <div class="segmented">
            <button
              class="segmented-item"
              :class="{ active: softResolutionMode === 'projector' }"
              @click="softResolutionMode = 'projector'"
            >
              Projector Resolution
            </button>
            <button
              class="segmented-item"
              :class="{ active: softResolutionMode === 'manual' }"
              @click="softResolutionMode = 'manual'"
            >
              Manual
            </button>
          </div>
          <div v-if="softResolutionMode === 'manual'" class="resolution-row">
            <div class="field-col">
              <span class="field-label">Width</span>
              <input
                v-model.number="softWidth"
                type="number"
                class="field-input"
                min="1"
                placeholder="width"
              />
            </div>
            <span class="resolution-sep">×</span>
            <div class="field-col">
              <span class="field-label">Height</span>
              <input
                v-model.number="softHeight"
                type="number"
                class="field-input"
                min="1"
                placeholder="height"
              />
            </div>
          </div>
        </div>

        <div class="settings-group">
          <div class="settings-group-header">Suffix</div>
          <input v-model="softSuffix" type="text" class="field-input full" placeholder="suffix" />
        </div>

        <div class="settings-group">
          <div class="toggle-row" @click="softAssignOnFeed = !softAssignOnFeed">
            <span class="toggle-label">Assign on Projector Feed</span>
            <div class="toggle-track" :class="{ on: softAssignOnFeed }">
              <div class="toggle-knob"></div>
            </div>
          </div>
        </div>
      </template>

      <!-- Composite Mask options -->
      <template v-if="maskType === 'composite'">
        <div class="settings-group">
          <div class="settings-group-header">Mask Resolution</div>
          <div class="segmented">
            <button
              class="segmented-item"
              :class="{ active: compositeResolutionMode === 'projector' }"
              @click="compositeResolutionMode = 'projector'"
            >
              Projector Resolution
            </button>
            <button
              class="segmented-item"
              :class="{ active: compositeResolutionMode === 'manual' }"
              @click="compositeResolutionMode = 'manual'"
            >
              Manual
            </button>
          </div>
          <div v-if="compositeResolutionMode === 'manual'" class="resolution-row">
            <div class="field-col">
              <span class="field-label">Width</span>
              <input
                v-model.number="compositeWidth"
                type="number"
                class="field-input"
                placeholder="width"
                min="1"
              />
            </div>
            <span class="resolution-sep">×</span>
            <div class="field-col">
              <span class="field-label">Height</span>
              <input
                v-model.number="compositeHeight"
                type="number"
                class="field-input"
                placeholder="height"
                min="1"
              />
            </div>
          </div>
        </div>

        <div class="settings-group">
          <div class="group-title-row">
            <span class="settings-group-header">Layers</span>
            <button class="btn-add-layer" @click="addLayer">+ Add Layer</button>
          </div>

          <div v-if="layers.length === 0" class="layers-empty">No layers added</div>

          <div v-for="(layer, index) in layers" :key="layer.id" class="layer-card">
            <div class="layer-header">
              <span class="layer-title">Layer {{ index + 1 }}</span>
              <button class="btn-delete-layer" @click="removeLayer(layer.id)">
                <svg viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 2l8 8M10 2l-8 8"
                    stroke="#888888"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </div>
            <div class="layer-fields">
              <div class="field-col">
                <span class="field-label">Suffix</span>
                <input
                  :value="layer.suffix"
                  @input="layer.suffix = $event.target.value.toLowerCase()"
                  type="text"
                  class="field-input"
                  :class="{ invalid: layerHasError(layer) }"
                  placeholder="_layer"
                />
              </div>
              <div class="field-col">
                <span class="field-label">Blend Mode</span>
                <div class="select-wrapper">
                  <select v-model="layer.blendMode" class="select-input">
                    <option v-for="mode in BLEND_MODES" :key="mode.value" :value="mode.value">
                      {{ mode.label }}
                    </option>
                  </select>
                  <svg class="select-chevron" viewBox="0 0 10 6" fill="none">
                    <path
                      d="M1 1l4 4 4-4"
                      stroke="#888888"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="settings-group">
          <div class="toggle-row" @click="compositeAssignOnFeed = !compositeAssignOnFeed">
            <span class="toggle-label">Assign on Projector Feed</span>
            <div class="toggle-track" :class="{ on: compositeAssignOnFeed }">
              <div class="toggle-knob"></div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div class="panel-footer">
      <button class="btn-create" :disabled="selectedCount === 0 || creating || (maskType === 'composite' && hasLayerErrors)" @click="handleCreate">
        {{ creating ? 'Creating…' : 'Create Masks' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ── Layout ─────────────────────────────────── */
.mask-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  padding: 13px 16px 11px;
  border-bottom: 1px solid #222222;
  background: #181818;
  flex-shrink: 0;
}

.panel-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #0a84ff;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-content::-webkit-scrollbar {
  width: 6px;
}
.panel-content::-webkit-scrollbar-track {
  background: transparent;
}
.panel-content::-webkit-scrollbar-thumb {
  background: #333333;
  border-radius: 3px;
}
.panel-content::-webkit-scrollbar-thumb:hover {
  background: #555555;
}

.panel-footer {
  flex-shrink: 0;
  padding: 16px;
  border-top: 1px solid #222222;
  background: #181818;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ── Settings group — CSS guide spec ────────── */
.settings-group {
  background: #242424;
  border: 1px solid #333333;
  border-radius: 6px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-group-header {
  color: #0a84ff;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.group-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* ── Segmented control — CSS guide spec ─────── */
.segmented {
  display: flex;
  background: #181818;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
  height: 36px;
}

.segmented-item {
  flex: 1;
  background: transparent;
  color: #888888;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.segmented-item:hover {
  color: #cccccc;
}

.segmented-item.active {
  background: #3a3a3a;
  color: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* ── Resolution row ─────────────────────────── */
.resolution-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.resolution-sep {
  color: #555555;
  font-size: 14px;
  padding-bottom: 8px;
  flex-shrink: 0;
}

/* ── Form fields ────────────────────────────── */
.field-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

/* settings-label spec: #cccccc / 12px / 600 */
.field-label {
  font-size: 12px;
  font-weight: 600;
  color: #cccccc;
}

/* CSS guide input spec */
.field-input {
  background: #181818;
  border: 1px solid #3a3a3a;
  color: #eeeeee;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 12px;
  outline: none;
  width: 100%;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  font-family: inherit;
}

.field-input::placeholder {
  color: #555555;
}

.field-input:focus {
  border-color: #0a84ff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.field-input:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.field-input.invalid {
  border-color: #ef4444;
}

/* Hide number input spinners */
.field-input[type='number']::-webkit-inner-spin-button,
.field-input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
}

/* ── Dropdown / Select ──────────────────────── */
.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.select-input {
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  background: #181818;
  border: 1px solid #3a3a3a;
  color: #eeeeee;
  border-radius: 6px;
  padding: 8px 28px 8px 10px;
  font-size: 12px;
  outline: none;
  cursor: pointer;
  font-family: inherit;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.select-input:focus {
  border-color: #0a84ff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.select-input option {
  background: #1e1e1e;
}

.select-chevron {
  position: absolute;
  right: 9px;
  width: 10px;
  height: 6px;
  pointer-events: none;
}

/* ── Add layer button ───────────────────────── */
.btn-add-layer {
  font-size: 11px;
  font-weight: 600;
  color: #0a84ff;
  background: transparent;
  border: 1px solid rgba(10, 132, 255, 0.3);
  border-radius: 4px;
  padding: 4px 10px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
  white-space: nowrap;
}

.btn-add-layer:hover {
  background: rgba(10, 132, 255, 0.1);
  border-color: rgba(10, 132, 255, 0.55);
}

/* ── Layers empty ───────────────────────────── */
.layers-empty {
  font-size: 12px;
  color: #555555;
  text-align: center;
  padding: 6px 0;
}

/* ── Layer card ─────────────────────────────── */
.layer-card {
  background: #2a2a2a;
  border: 1px solid #383838;
  border-radius: 6px;
  overflow: hidden;
}

.layer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  border-bottom: 1px solid #333333;
  background: #252525;
}

/* settings-label-secondary spec: #777777 / 11px */
.layer-title {
  font-size: 11px;
  font-weight: 600;
  color: #777777;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.btn-delete-layer {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: background 0.15s ease;
}

.btn-delete-layer:hover {
  background: rgba(239, 68, 68, 0.15);
}
.btn-delete-layer:hover path {
  stroke: #ef4444;
}
.btn-delete-layer svg {
  width: 12px;
  height: 12px;
  display: block;
}

.layer-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 12px;
}

/* ── Footer button ──────────────────────────── */
.btn-create {
  width: 100%;
  background: #0a84ff;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  border: none;
  border-radius: 6px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-create:hover:not(:disabled) {
  background: #0060d1;
}

.btn-create:disabled {
  background: #2a2a2a;
  color: #555555;
  cursor: not-allowed;
}

.btn-count {
  font-weight: 400;
  opacity: 0.75;
  font-size: 11px;
}

.hint-text {
  font-size: 11px;
  color: #555555;
  text-align: center;
  line-height: 1.5;
  margin: 0;
}

/* ── Toggle row ─────────────────────────────── */
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.toggle-label {
  font-size: 12px;
  font-weight: 600;
  color: #cccccc;
}

.toggle-track {
  width: 34px;
  height: 18px;
  border-radius: 9px;
  background: #3a3a3a;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 2px;
  transition: background 0.2s ease;
}

.toggle-track.on {
  background: #0a84ff;
}

.toggle-knob {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #888888;
  transition: transform 0.2s ease, background 0.2s ease;
}

.toggle-track.on .toggle-knob {
  background: #ffffff;
  transform: translateX(16px);
}
</style>
