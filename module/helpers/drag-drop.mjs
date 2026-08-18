/**
 * Drag and drop plumbing for ApplicationV2 sheets.
 *
 * ApplicationV2 does not inherit the v1 sheet drag/drop behaviour, so the
 * handlers are attached directly to the rendered element. Child nodes are
 * replaced on every render, so their listeners are rebound each time; the
 * root listeners are bound once and guarded by a marker attribute.
 */

/** Read Foundry's drag payload off a drop event, across v13 and v14. */
export function getDragData(event) {
  const TextEditorImpl = foundry.applications.ux?.TextEditor?.implementation ?? globalThis.TextEditor;
  try {
    return TextEditorImpl.getDragEventData(event);
  } catch (err) {
    return null;
  }
}

/**
 * Attach drag and drop handlers to a sheet.
 * @param {ApplicationV2} app        The sheet instance.
 * @param {object} [options]
 * @param {string} [options.dragSelector]  Elements that may be dragged out.
 */
export function attachDragDrop(app, { dragSelector = ".draggable" } = {}) {
  const root = app.element;
  if (!root) return;

  // Dragging owned documents out of the sheet.
  for (const el of root.querySelectorAll(`${dragSelector}[draggable="true"]`)) {
    el.addEventListener("dragstart", event => onDragStart(app, event));
  }

  // Bind the drop target once per element, not once per render.
  if (root.dataset.ktDropBound === "true") return;
  root.dataset.ktDropBound = "true";
  root.addEventListener("dragover", event => event.preventDefault());
  root.addEventListener("drop", event => app._onDrop?.(event));
}

/** Build the drag payload for an embedded item or a linked actor. */
function onDragStart(app, event) {
  const row = event.currentTarget;

  const itemId = row.dataset.itemId ?? row.closest("[data-item-id]")?.dataset.itemId;
  if (itemId) {
    const item = app.document.items?.get(itemId);
    if (item) {
      event.dataTransfer.setData("text/plain", JSON.stringify(item.toDragData()));
      return;
    }
  }

  const uuid = row.dataset.uuid ?? row.closest("[data-uuid]")?.dataset.uuid;
  if (uuid) {
    const doc = fromUuidSync(uuid);
    if (doc) event.dataTransfer.setData("text/plain", JSON.stringify(doc.toDragData()));
  }
}
