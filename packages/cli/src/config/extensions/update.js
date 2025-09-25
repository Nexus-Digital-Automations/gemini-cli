/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs';
import { getErrorMessage } from '../../utils/errors.js';
import { ExtensionUpdateState } from '../../ui/state/extensions.js';
import {} from 'react';
import { copyExtension, installExtension, uninstallExtension, loadExtension, loadInstallMetadata, ExtensionStorage, } from '../extension.js';
import { checkForExtensionUpdate } from './github.js';
export async function updateExtension(extension, cwd = process.cwd(), currentState, setExtensionUpdateState) {
    if (currentState === ExtensionUpdateState.UPDATING) {
        return undefined;
    }
    setExtensionUpdateState(ExtensionUpdateState.UPDATING);
    const installMetadata = loadInstallMetadata(extension.path);
    if (!installMetadata?.type) {
        setExtensionUpdateState(ExtensionUpdateState.ERROR);
        throw new Error(`Extension ${extension.name} cannot be updated, type is unknown.`);
    }
    if (installMetadata?.type === 'link') {
        setExtensionUpdateState(ExtensionUpdateState.UP_TO_DATE);
        throw new Error(`Extension is linked so does not need to be updated`);
    }
    const originalVersion = extension.version;
    const tempDir = await ExtensionStorage.createTmpDir();
    try {
        await copyExtension(extension.path, tempDir);
        await uninstallExtension(extension.name, cwd);
        await installExtension(installMetadata, false, cwd);
        const updatedExtensionStorage = new ExtensionStorage(extension.name);
        const updatedExtension = loadExtension({
            extensionDir: updatedExtensionStorage.getExtensionDir(),
            workspaceDir: cwd,
        });
        if (!updatedExtension) {
            setExtensionUpdateState(ExtensionUpdateState.ERROR);
            throw new Error('Updated extension not found after installation.');
        }
        const updatedVersion = updatedExtension.config.version;
        setExtensionUpdateState(ExtensionUpdateState.UPDATED_NEEDS_RESTART);
        return {
            name: extension.name,
            originalVersion,
            updatedVersion,
        };
    }
    catch (e) {
        console.error(`Error updating extension, rolling back. ${getErrorMessage(e)}`);
        setExtensionUpdateState(ExtensionUpdateState.ERROR);
        await copyExtension(tempDir, extension.path);
        throw e;
    }
    finally {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
}
export async function updateAllUpdatableExtensions(cwd = process.cwd(), extensions, extensionsState, setExtensionsUpdateState) {
    return (await Promise.all(extensions
        .filter((extension) => extensionsState.get(extension.name) ===
        ExtensionUpdateState.UPDATE_AVAILABLE)
        .map((extension) => updateExtension(extension, cwd, extensionsState.get(extension.name), (updateState) => {
        setExtensionsUpdateState((prev) => {
            const finalState = new Map(prev);
            finalState.set(extension.name, updateState);
            return finalState;
        });
    })))).filter((updateInfo) => !!updateInfo);
}
export async function checkForAllExtensionUpdates(extensions, extensionsUpdateState, setExtensionsUpdateState, cwd = process.cwd()) {
    for (const extension of extensions) {
        const initialState = extensionsUpdateState.get(extension.name);
        if (initialState === undefined) {
            if (!extension.installMetadata) {
                setExtensionsUpdateState((prev) => {
                    extensionsUpdateState = new Map(prev);
                    extensionsUpdateState.set(extension.name, ExtensionUpdateState.NOT_UPDATABLE);
                    return extensionsUpdateState;
                });
                continue;
            }
            await checkForExtensionUpdate(extension, (updatedState) => {
                setExtensionsUpdateState((prev) => {
                    extensionsUpdateState = new Map(prev);
                    extensionsUpdateState.set(extension.name, updatedState);
                    return extensionsUpdateState;
                });
            }, cwd);
        }
    }
    return extensionsUpdateState;
}
//# sourceMappingURL=update.js.map