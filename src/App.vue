<script setup>
import { ref, onMounted } from 'vue'
import ProjectorList from './components/ProjectorList.vue'
import MaskPanel from './components/MaskPanel.vue'
import { getProjectors, createSoftEdgeMasks, createCompositeMasks } from './services/disguiseService.js'

const urlParams = new URLSearchParams(window.location.search)
const directorIp = urlParams.get('director') || 'localhost:80'

const selectedIds = ref([])
const maskType = ref('soft-edge')
const projectors = ref([])
const loading = ref(false)
const fetchError = ref(null)
const creating = ref(false)

onMounted(async () => {
  loading.value = true
  fetchError.value = null
  try {
    const result = await getProjectors(directorIp)
    projectors.value = Array.isArray(result) ? result : []
  } catch (e) {
    fetchError.value = `Could not connect to Designer at ${directorIp}`
  } finally {
    loading.value = false
  }
})

async function handleCreate(config) {
  if (creating.value) return
  const selected = projectors.value.filter(p => selectedIds.value.includes(p.uid))

  const BLEND_MODE_INT = { over: 0, alpha: 1, add: 2, multiply: 3 }

  creating.value = true
  try {
    if (maskType.value === 'soft-edge') {
      const useProjectorRes = config.softEdge.resolutionMode === 'projector'
      const projectorData = selected.map(p => ({
        name: p.name,
        width: useProjectorRes ? p.resolution.x : config.softEdge.width,
        height: useProjectorRes ? p.resolution.y : config.softEdge.height,
      }))
      const result = await createSoftEdgeMasks(directorIp, projectorData, config.softEdge.suffix, config.softEdge.assignOnFeed)
      console.log('Soft edge masks created:', result)
    } else if (maskType.value === 'composite') {
      const useProjectorRes = config.composite.resolutionMode === 'projector'
      const projectorData = selected.map(p => ({
        name: p.name,
        width: useProjectorRes ? p.resolution.x : config.composite.width,
        height: useProjectorRes ? p.resolution.y : config.composite.height,
      }))
      const layerData = config.composite.layers.map(l => ({
        suffix: l.suffix,
        blendMode: BLEND_MODE_INT[l.blendMode] ?? 0,
      }))
      const result = await createCompositeMasks(directorIp, projectorData, layerData, config.composite.assignOnFeed)
      console.log('Composite masks created:', result)
    }
  } catch (e) {
    console.error('Failed to create masks:', e)
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="app-shell">
    <div class="panels-wrapper">
      <div class="card left-card">
        <ProjectorList
          v-model:selected="selectedIds"
          :projectors="projectors"
          :loading="loading"
          :error="fetchError"
        />
      </div>
      <div class="card right-card">
        <MaskPanel
          v-model:maskType="maskType"
          :selectedCount="selectedIds.length"
          :creating="creating"
          @create="handleCreate"
        />
      </div>
    </div>
  </div>
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body,
#app {
  height: 100%;
  overflow: hidden;
}

body {
  background: #141414;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 12px;
  color: #cccccc;
  -webkit-font-smoothing: antialiased;
}
</style>

<style scoped>
.app-shell {
  display: flex;
  justify-content: center;
  align-items: stretch;
  height: 100vh;
  background: #141414;
  padding: 16px;
  overflow: hidden;
}

.panels-wrapper {
  display: flex;
  gap: 12px;
  width: 100%;
  max-width: 1200px;
  height: 100%;
}

.card {
  flex: 1;
  min-width: 0;
  max-width: 720px;
  background: #1e1e1e;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
