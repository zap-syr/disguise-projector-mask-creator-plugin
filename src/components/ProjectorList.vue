<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  projectors: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
})

const emit = defineEmits(['update:selected'])

const search = ref('')
const selectedIds = ref([])

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return props.projectors
  return props.projectors.filter(p => p.name.toLowerCase().includes(q))
})

const allChecked = computed(
  () => filtered.value.length > 0 && filtered.value.every(p => selectedIds.value.includes(p.uid))
)

const someChecked = computed(
  () => filtered.value.some(p => selectedIds.value.includes(p.uid)) && !allChecked.value
)

function toggleSelectAll() {
  if (allChecked.value || someChecked.value) {
    selectedIds.value = selectedIds.value.filter(uid => !filtered.value.some(p => p.uid === uid))
  } else {
    const toAdd = filtered.value.map(p => p.uid).filter(uid => !selectedIds.value.includes(uid))
    selectedIds.value = [...selectedIds.value, ...toAdd]
  }
  emit('update:selected', [...selectedIds.value])
}

function toggleProjector(uid) {
  if (selectedIds.value.includes(uid)) {
    selectedIds.value = selectedIds.value.filter(i => i !== uid)
  } else {
    selectedIds.value = [...selectedIds.value, uid]
  }
  emit('update:selected', [...selectedIds.value])
}

function isSelected(uid) {
  return selectedIds.value.includes(uid)
}
</script>

<template>
  <div class="projector-list">
    <div class="panel-header">
      <span class="panel-title">Projectors</span>
    </div>

    <div class="search-wrapper">
      <svg class="search-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="7" cy="7" r="4.5" stroke="#666666" stroke-width="1.5" />
        <path d="M10.5 10.5L13.5 13.5" stroke="#666666" stroke-width="1.5" stroke-linecap="round" />
      </svg>
      <input
        v-model="search"
        type="text"
        class="search-input"
        placeholder="Search projectors..."
        :disabled="loading || !!error"
      />
    </div>

    <div class="list-header">
      <div class="col-check">
        <div
          class="checkbox"
          :class="{ 'is-checked': allChecked, 'is-indeterminate': someChecked, 'is-disabled': loading || !!error || filtered.length === 0 }"
          role="checkbox"
          :aria-checked="allChecked"
          @click="!loading && !error && filtered.length > 0 && toggleSelectAll()"
        >
          <svg v-if="allChecked" class="check-mark" viewBox="0 0 10 8" fill="none">
            <polyline
              points="1,4 3.5,6.5 9,1"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <div v-else-if="someChecked" class="indeterminate-bar" />
        </div>
      </div>
      <div class="col-name header-label">Name</div>
      <div class="col-res header-label">Resolution</div>
    </div>

    <div class="list-body">
      <!-- Error state -->
      <div v-if="error" class="status-state error-state">
        <svg viewBox="0 0 16 16" fill="none" class="status-icon">
          <circle cx="8" cy="8" r="6.5" stroke="#ef4444" stroke-width="1.5" />
          <path d="M8 5v3.5M8 10.5v.5" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <span>{{ error }}</span>
      </div>

      <!-- Loading state -->
      <template v-else-if="loading">
        <div v-for="i in 6" :key="i" class="skeleton-row">
          <div class="skeleton-check" />
          <div class="skeleton-name" :style="{ width: `${55 + (i * 13) % 30}%` }" />
          <div class="skeleton-res" />
        </div>
      </template>

      <!-- Empty search result -->
      <div v-else-if="filtered.length === 0 && projectors.length > 0" class="status-state">
        No projectors match your search
      </div>

      <!-- No projectors in project -->
      <div v-else-if="projectors.length === 0" class="status-state">
        No projectors found in project
      </div>

      <!-- Projector rows -->
      <div
        v-else
        v-for="projector in filtered"
        :key="projector.uid"
        class="list-row"
        :class="{ selected: isSelected(projector.uid) }"
        @click="toggleProjector(projector.uid)"
      >
        <div class="col-check" @click.stop>
          <div
            class="checkbox"
            :class="{ 'is-checked': isSelected(projector.uid) }"
            role="checkbox"
            :aria-checked="isSelected(projector.uid)"
            @click="toggleProjector(projector.uid)"
          >
            <svg v-if="isSelected(projector.uid)" class="check-mark" viewBox="0 0 10 8" fill="none">
              <polyline
                points="1,4 3.5,6.5 9,1"
                stroke="white"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>
        <div class="col-name row-text" :class="{ 'row-text-selected': isSelected(projector.uid) }">
          {{ projector.name }}
        </div>
        <div class="col-res row-text muted">
          {{ projector.resolution.x }}×{{ projector.resolution.y }}
        </div>
      </div>
    </div>

    <div class="list-footer">
      <span v-if="error" class="footer-idle">—</span>
      <span v-else-if="loading" class="footer-idle">Loading projectors…</span>
      <span v-else-if="selectedIds.length === 0" class="footer-idle">No projectors selected</span>
      <span v-else class="footer-count">
        <strong>{{ selectedIds.length }}</strong> of {{ projectors.length }} projectors selected
      </span>
    </div>
  </div>
</template>

<style scoped>
.projector-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
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

.search-wrapper {
  position: relative;
  padding: 10px 12px;
  border-bottom: 1px solid #222222;
  flex-shrink: 0;
  background: #181818;
}

.search-icon {
  position: absolute;
  left: 22px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  background: #141414;
  border: 1px solid #333333;
  color: #eeeeee;
  border-radius: 6px;
  padding: 7px 10px 7px 30px;
  font-size: 12px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input::placeholder {
  color: #555555;
}

.search-input:focus {
  border-color: #0a84ff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.search-input:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.list-header {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 30px;
  background: #181818;
  border-bottom: 1px solid #242424;
  flex-shrink: 0;
}

.header-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: #555555;
  user-select: none;
}

.list-body {
  flex: 1;
  overflow-y: auto;
}

.list-body::-webkit-scrollbar {
  width: 6px;
}

.list-body::-webkit-scrollbar-track {
  background: transparent;
}

.list-body::-webkit-scrollbar-thumb {
  background: #333333;
  border-radius: 3px;
}

.list-body::-webkit-scrollbar-thumb:hover {
  background: #555555;
}

/* Status states (error / empty) */
.status-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 24px;
  text-align: center;
  color: #555555;
  font-size: 12px;
  line-height: 1.5;
}

.error-state {
  color: #ef4444;
}

.status-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* Skeleton loading rows */
.skeleton-row {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 36px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  gap: 0;
}

.skeleton-check {
  width: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.skeleton-check::after {
  content: '';
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  background: #2a2a2a;
  animation: pulse 1.4s ease-in-out infinite;
}

.skeleton-name {
  height: 10px;
  border-radius: 4px;
  background: #2a2a2a;
  animation: pulse 1.4s ease-in-out infinite;
  flex: 0 0 auto;
}

.skeleton-res {
  margin-left: auto;
  width: 72px;
  height: 10px;
  border-radius: 4px;
  background: #2a2a2a;
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

/* Projector rows */
.list-row {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 36px;
  cursor: pointer;
  transition: background 0.15s ease;
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  user-select: none;
}

.list-row:hover {
  background: #252525;
}

.list-row.selected {
  background: rgba(10, 132, 255, 0.1);
}

.list-row.selected:hover {
  background: rgba(10, 132, 255, 0.14);
}

.col-check {
  width: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.col-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-res {
  width: 100px;
  flex-shrink: 0;
  text-align: right;
}

.row-text {
  font-size: 12px;
  color: #cccccc;
}

.row-text-selected {
  color: #dddddd;
}

.row-text.muted {
  color: #666666;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.checkbox {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid #3a3a3a;
  background: #141414;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.checkbox:hover:not(.is-disabled) {
  border-color: #555555;
}

.checkbox.is-checked {
  background: #0a84ff;
  border-color: #0a84ff;
}

.checkbox.is-indeterminate {
  background: #0a84ff;
  border-color: #0a84ff;
}

.checkbox.is-disabled {
  opacity: 0.3;
  cursor: default;
}

.check-mark {
  width: 10px;
  height: 8px;
  flex-shrink: 0;
}

.indeterminate-bar {
  width: 8px;
  height: 1.5px;
  background: #ffffff;
  border-radius: 1px;
}

.list-footer {
  height: 36px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-top: 1px solid #222222;
  background: #181818;
  flex-shrink: 0;
}

.footer-idle {
  font-size: 11px;
  color: #444444;
}

.footer-count {
  font-size: 11px;
  color: #888888;
}

.footer-count strong {
  color: #0a84ff;
  font-weight: 700;
}
</style>
