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

export async function createSoftEdgeMasks(directorIp, projectors, suffix, assignOnFeed) {
  const script = `
def run():
    projectors = ${JSON.stringify(projectors)}
    suffix = ${JSON.stringify(suffix)}
    assign_on_feed = ${assignOnFeed ? 'True' : 'False'}
    feed_rect_map = {}
    if assign_on_feed:
        proj_names = [p["name"] for p in projectors]
        for f in resourceManager.allResources(FeedRect):
            if f.referenceDisplay and f.referenceDisplay.description in proj_names:
                feed_rect_map[f.referenceDisplay.description] = f
    results = []
    for proj in projectors:
        mask_name = proj["name"] + suffix
        path = "objects/softedgetexture/" + mask_name + ".apx"
        mask = resourceManager.loadOrCreate(path, SoftEdgeTexture)
        if mask:
            markDirty(mask)
            mask.size = Vec2(proj["width"], proj["height"])
            mask.saveOnDelete()
            if assign_on_feed and proj["name"] in feed_rect_map:
                feed_rect = feed_rect_map[proj["name"]]
                markDirty(feed_rect)
                feed_rect.mask = mask
                feed_rect.saveOnDelete()
            results.append(mask_name)
    return results
return run()
`
  return await executePython(directorIp, script)
}

export async function createCompositeMasks(directorIp, projectors, layers, assignOnFeed) {
  const script = `
def run():
    projectors = ${JSON.stringify(projectors)}
    layers = ${JSON.stringify(layers)}
    assign_on_feed = ${assignOnFeed ? 'True' : 'False'}
    feed_rect_map = {}
    if assign_on_feed:
        proj_names = [p["name"] for p in projectors]
        for f in resourceManager.allResources(FeedRect):
            if f.referenceDisplay and f.referenceDisplay.description in proj_names:
                feed_rect_map[f.referenceDisplay.description] = f
    results = []
    for proj in projectors:
        comp_name = proj["name"] + "_comp"
        path = "objects/compositetexture/" + comp_name + ".apx"
        comp = resourceManager.loadOrCreate(path, CompositeTexture)
        if comp:
            markDirty(comp)
            comp.size = Int2(proj["width"], proj["height"])
            for i, layer in enumerate(layers):
                comp.addItem()
                tex_name = proj["name"] + layer["suffix"]
                tex_path = "objects/softedgetexture/" + tex_name + ".apx"
                tex = resourceManager.loadOrCreate(tex_path, SoftEdgeTexture)
                markDirty(tex)
                tex.size = Vec2(proj["width"], proj["height"])
                tex.saveOnDelete()
                comp.textures[i] = tex
                comp.blendModes[i] = layer["blendMode"]
            comp.saveOnDelete()
            comp.activate()
            if assign_on_feed and proj["name"] in feed_rect_map:
                feed_rect = feed_rect_map[proj["name"]]
                markDirty(feed_rect)
                feed_rect.mask = comp
                feed_rect.saveOnDelete()
            results.append(comp_name)
    return results
return run()
`
  return await executePython(directorIp, script)
}
