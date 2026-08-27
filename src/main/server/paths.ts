import { existsSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { app } from 'electron'

/**
 * Finds the Suwayomi-Server bundle (JRE + jar).
 *
 * In development we use the copy extracted into ../server/ at the workspace
 * root. When packaged, the bundle is placed in resources/server/ by
 * electron-builder.
 */
export interface ServerPaths {
  javaExe: string
  jar: string
}

function candidateRoots(): string[] {
  if (app.isPackaged) {
    return [join(process.resourcesPath, 'server')]
  }
  // In dev, app.getAppPath() is the kagami/ folder -> go up to the workspace.
  const workspace = resolve(app.getAppPath(), '..')
  return [join(app.getAppPath(), 'resources', 'server'), join(workspace, 'server')]
}

/**
 * The Suwayomi zip extracts into a versioned folder
 * (Suwayomi-Server-vX.Y.ZZZZ-windows-x64), so we accept both the root itself
 * and one subdirectory inside it.
 */
function expand(root: string): string[] {
  if (!existsSync(root)) return []
  const out = [root]
  try {
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (entry.isDirectory()) out.push(join(root, entry.name))
    }
  } catch {
    /* unreadable directory: skip it and try the next candidate */
  }
  return out
}

export function findServerPaths(): ServerPaths | null {
  for (const root of candidateRoots()) {
    for (const dir of expand(root)) {
      const javaExe = join(dir, 'jre', 'bin', 'java.exe')
      const jar = join(dir, 'bin', 'Suwayomi-Server.jar')
      if (existsSync(javaExe) && existsSync(jar)) {
        return { javaExe, jar }
      }
    }
  }
  return null
}
