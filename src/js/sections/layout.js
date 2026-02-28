export function getLayoutComponents() {
  return [
    {
      slotSelector: '[data-component-slot="layout-header"]',
      path: 'src/html/layout/header.html',
    },
    {
      slotSelector: '[data-component-slot="workspace-shell"]',
      path: 'src/html/layout/workspace-shell.html',
    },
  ];
}
