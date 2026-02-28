export function getModalComponents() {
  return [
    {
      slotSelector: '[data-component-slot="modals-global"]',
      path: 'src/html/modals/tutorial-and-utility-modals.html',
    },
    {
      slotSelector: '[data-component-slot="modal-shortcuts"]',
      path: 'src/html/modals/shortcuts-modal.html',
    },
    {
      slotSelector: '[data-component-slot="modal-version"]',
      path: 'src/html/modals/version-modal.html',
    },
  ];
}
