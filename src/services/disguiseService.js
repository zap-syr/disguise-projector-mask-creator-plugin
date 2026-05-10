async function executePython(directorIp, script) {
  const endpoint = `http://${directorIp}/api/session/python/execute`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script }),
  })
  const data = await response.json()
  let result = data.returnValue
  if (typeof result === 'string') {
    try {
      result = JSON.parse(result)
    } catch (e) {}
  }
  return result
}

export async function getProjectors(directorIp) {
  const script = `
def run():
    projectors = resourceManager.allResources(Projector)
    result = []
    for p in projectors:
        result.append({
            "uid": p.uid,
            "name": p.description,
            "resolution": {
                "x": int(p.resolution.x),
                "y": int(p.resolution.y)
            }
        })
    return result
return run()
`
  const projectors = await executePython(directorIp, script)
  if (!Array.isArray(projectors)) return projectors
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
  return projectors.sort((a, b) => collator.compare(a.name, b.name))
}

export async function createSoftEdgeMasks(directorIp, projectors, suffix) {
  const script = `
def run():
    projectors = ${JSON.stringify(projectors)}
    suffix = ${JSON.stringify(suffix)}
    results = []
    for proj in projectors:
        mask_name = proj["name"] + suffix
        path = "objects/softedgetexture/" + mask_name + ".apx"
        mask = resourceManager.loadOrCreate(path, SoftEdgeTexture)
        if mask:
            mask.size = Vec2(proj["width"], proj["height"])
            results.append(mask_name)
    return results
return run()
`
  return await executePython(directorIp, script)
}
