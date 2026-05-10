<script setup>
const props = defineProps({
  maskType: { type: String, default: 'soft-edge' },
  selectedCount: { type: Number, default: 0 },
})

const emit = defineEmits(['update:maskType', 'create'])

function setMaskType(type) {
  emit('update:maskType', type)
}

function handleCreate() {
  emit('create')
}
</script>

<template>
  <div class="mask-panel">
    <div class="panel-header">
      <span class="panel-title">Mask Options</span>
    </div>

    <div class="panel-content">
      <div class="settings-group">
        <div class="settings-group-header">Mask Type</div>

        <label
          class="radio-option"
          :class="{ active: maskType === 'soft-edge' }"
          @click="setMaskType('soft-edge')"
        >
          <div class="radio-dot" :class="{ selected: maskType === 'soft-edge' }">
            <div v-if="maskType === 'soft-edge'" class="radio-inner" />
          </div>
          <span class="radio-label-text">Create Soft Edge Mask</span>
        </label>

        <label
          class="radio-option"
          :class="{ active: maskType === 'composite' }"
          @click="setMaskType('composite')"
        >
          <div class="radio-dot" :class="{ selected: maskType === 'composite' }">
            <div v-if="maskType === 'composite'" class="radio-inner" />
          </div>
          <span class="radio-label-text">Create Composite Mask</span>
        </label>
      </div>

      <div class="action-area">
        <button class="btn-create" :disabled="selectedCount === 0" @click="handleCreate">
          Create Masks
          <span v-if="selectedCount > 0" class="btn-count">({{ selectedCount }})</span>
        </button>
        <p v-if="selectedCount === 0" class="hint-text">
          Select at least one projector to continue
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-group {
  background: #242424;
  border: 1px solid #333333;
  border-radius: 6px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-group-header {
  color: #0a84ff;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 2px 0;
  user-select: none;
}

.radio-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid #3a3a3a;
  background: #141414;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.15s ease;
}

.radio-dot.selected {
  border-color: #0a84ff;
}

.radio-inner {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #0a84ff;
}

.radio-label-text {
  font-size: 12px;
  color: #aaaaaa;
  transition: color 0.15s ease;
}

.radio-option.active .radio-label-text {
  color: #dddddd;
}

.radio-option:hover .radio-dot:not(.selected) {
  border-color: #555555;
}

.radio-option:hover .radio-label-text {
  color: #cccccc;
}

.action-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

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
  color: #444444;
  text-align: center;
  line-height: 1.5;
}
</style>
