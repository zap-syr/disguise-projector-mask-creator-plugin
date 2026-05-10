<script setup>
import { ref, onMounted } from 'vue'
import ProjectorList from './components/ProjectorList.vue'
import MaskPanel from './components/MaskPanel.vue'
import { getProjectors } from './services/disguiseService.js'

const urlParams = new URLSearchParams(window.location.search)
const directorIp = urlParams.get('director') || 'localhost:80'

const selectedIds = ref([])
const maskType = ref('soft-edge')
const projectors = ref([])
const loading = ref(false)
const fetchError = ref(null)

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

function handleCreate() {
  console.log('Create masks', { selectedIds: selectedIds.value, maskType: maskType.value })
}
</script>

<template>
  <div class="app-shell">
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
        @create="handleCreate"
      />
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
  height: 100vh;
  background: #141414;
  padding: 16px;
  gap: 12px;
  overflow: hidden;
}

.card {
  background: #1e1e1e;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.left-card {
  flex: 1;
}

.right-card {
  width: 280px;
  flex-shrink: 0;
}
</style>
