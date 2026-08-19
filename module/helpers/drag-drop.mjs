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

  // Drop every listener from the previous render before binding again. A
  // marker attribute is not enough on its own: if anything else also routes
  // the event to _onDrop, the drop is processed more than once and the item
  // is created twice. See the guard in handledOnce() below.
  app._ktDragAbort?.abort();
  const controller = new AbortController();
  app._ktDragAbort = controller;
  const { signal } = controller;

  // Dragging owned documents out of the sheet.
  for (const el of root.querySelectorAll(`${dragSelector}[draggable="true"]`)) {
    el.addEventListener("dragstart", event => onDragStart(app, event), { signal });
  }

  root.addEventListener("dragover", event => event.preventDefault(), { signal });
  root.addEventListener("drop", event => app._onDrop?.(event), { signal });
}

/**
 * True the first time it sees a given drop event, false afterwards.
 *
 * Foundry may deliver the same drop to more than one handler — its own sheet
 * plumbing as well as ours — and both would create the dropped item. Tagging
 * the event object makes the second call a no-op regardless of where it came
 * from, which is more robust than trying to bind exactly one listener.
 */
export function handledOnce(event) {
  if (event.ktHandled) return false;
  event.ktHandled = true;
  return true;
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
